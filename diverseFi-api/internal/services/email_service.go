package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"github.com/resend/resend-go/v2"
	"gorm.io/gorm"
)

type EmailService struct {
	db              *gorm.DB
	config          *config.Config
	resendClient    *resend.Client
	templateService *EmailTemplateService

	// Rate limiting
	mu              sync.Mutex
	minuteCounter   int
	hourCounter     int
	lastMinuteReset time.Time
	lastHourReset   time.Time
}

func NewEmailService(db *gorm.DB, cfg *config.Config, templateService *EmailTemplateService) *EmailService {
	var client *resend.Client
	if cfg.ResendAPIKey != "" {
		client = resend.NewClient(cfg.ResendAPIKey)
	}

	return &EmailService{
		db:              db,
		config:          cfg,
		resendClient:    client,
		templateService: templateService,
		lastMinuteReset: time.Now(),
		lastHourReset:   time.Now(),
	}
}

// checkRateLimit checks if sending is allowed based on rate limits
func (s *EmailService) checkRateLimit() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()

	// Reset minute counter if needed
	if now.Sub(s.lastMinuteReset) >= time.Minute {
		s.minuteCounter = 0
		s.lastMinuteReset = now
	}

	// Reset hour counter if needed
	if now.Sub(s.lastHourReset) >= time.Hour {
		s.hourCounter = 0
		s.lastHourReset = now
	}

	// Check limits
	if s.minuteCounter >= s.config.EmailRateLimitPerMin {
		return errors.New("rate limit exceeded: too many emails per minute")
	}
	if s.hourCounter >= s.config.EmailRateLimitPerHour {
		return errors.New("rate limit exceeded: too many emails per hour")
	}

	// Increment counters
	s.minuteCounter++
	s.hourCounter++

	return nil
}

// interpolateVariables replaces {{variable}} placeholders with values
func interpolateVariables(content string, variables map[string]string) string {
	result := content
	for key, value := range variables {
		placeholder := fmt.Sprintf("{{%s}}", key)
		result = strings.ReplaceAll(result, placeholder, value)
	}
	return result
}

// SendEmail sends an email using Resend
func (s *EmailService) SendEmail(ctx context.Context, req *models.SendEmailRequest, userID *uint, username, ipAddress string) (*models.SendEmailResponse, error) {
	// Check if email is enabled
	if !s.config.EmailEnabled {
		return nil, errors.New("email service is disabled")
	}

	// Check rate limits
	if err := s.checkRateLimit(); err != nil {
		return nil, err
	}

	var template *models.EmailTemplate
	var subject, htmlContent, textContent string

	// If template_name is provided, fetch and use the template
	if req.TemplateName != "" {
		var err error
		template, err = s.templateService.GetTemplateByName(req.TemplateName)
		if err != nil {
			return nil, fmt.Errorf("template not found: %w", err)
		}

		// Interpolate variables
		subject = interpolateVariables(template.Subject, req.Variables)
		htmlContent = interpolateVariables(template.HTMLContent, req.Variables)
		textContent = interpolateVariables(template.TextContent, req.Variables)
	} else {
		// Use direct values
		if req.Subject == "" {
			return nil, errors.New("subject is required when not using a template")
		}
		if req.HTMLContent == "" && req.TextContent == "" {
			return nil, errors.New("html_content or text_content is required when not using a template")
		}

		subject = req.Subject
		htmlContent = req.HTMLContent
		textContent = req.TextContent

		// Still interpolate variables if provided
		if len(req.Variables) > 0 {
			subject = interpolateVariables(subject, req.Variables)
			htmlContent = interpolateVariables(htmlContent, req.Variables)
			textContent = interpolateVariables(textContent, req.Variables)
		}
	}

	// Convert slices to JSON for storage
	toJSON, _ := json.Marshal(req.To)
	ccJSON, _ := json.Marshal(req.Cc)
	bccJSON, _ := json.Marshal(req.Bcc)
	variablesJSON, _ := json.Marshal(req.Variables)

	// Build from address
	fromAddress := s.config.EmailFromAddress
	if s.config.EmailFromName != "" {
		fromAddress = fmt.Sprintf("%s <%s>", s.config.EmailFromName, s.config.EmailFromAddress)
	}

	// Create email log entry with pending status
	emailLog := models.EmailLog{
		From:           fromAddress,
		To:             string(toJSON),
		Cc:             string(ccJSON),
		Bcc:            string(bccJSON),
		Subject:        subject,
		HTMLContent:    htmlContent,
		TextContent:    textContent,
		Status:         "pending",
		Variables:      string(variablesJSON),
		SentByUserID:   userID,
		SentByUsername: username,
		IPAddress:      ipAddress,
	}

	if template != nil {
		emailLog.TemplateID = &template.ID
		emailLog.TemplateName = template.Name
	} else if req.TemplateName != "" {
		emailLog.TemplateName = req.TemplateName
	}

	if err := s.db.Create(&emailLog).Error; err != nil {
		return nil, fmt.Errorf("failed to create email log: %w", err)
	}

	// Send email via Resend
	if s.resendClient == nil {
		// Update log with error
		now := time.Now()
		emailLog.Status = "failed"
		emailLog.ErrorMessage = "Resend client not initialized - API key missing"
		emailLog.SentAt = &now
		s.db.Save(&emailLog)

		return nil, errors.New("email service not configured: missing API key")
	}

	// Build Resend email params
	params := &resend.SendEmailRequest{
		From:    fromAddress,
		To:      req.To,
		Subject: subject,
	}

	if htmlContent != "" {
		params.Html = htmlContent
	}
	if textContent != "" {
		params.Text = textContent
	}
	if len(req.Cc) > 0 {
		params.Cc = req.Cc
	}
	if len(req.Bcc) > 0 {
		params.Bcc = req.Bcc
	}

	// Send the email
	sent, err := s.resendClient.Emails.Send(params)
	now := time.Now()

	if err != nil {
		// Update log with error
		emailLog.Status = "failed"
		emailLog.ErrorMessage = err.Error()
		emailLog.SentAt = &now
		s.db.Save(&emailLog)

		return &models.SendEmailResponse{
			ID:      emailLog.ID,
			Status:  "failed",
			Message: err.Error(),
		}, fmt.Errorf("failed to send email: %w", err)
	}

	// Update log with success
	emailLog.Status = "sent"
	emailLog.ResendID = sent.Id
	emailLog.SentAt = &now
	s.db.Save(&emailLog)

	return &models.SendEmailResponse{
		ID:       emailLog.ID,
		ResendID: sent.Id,
		Status:   "sent",
		Message:  "Email sent successfully",
	}, nil
}

// GetEmailLogs retrieves email logs with pagination and filters
func (s *EmailService) GetEmailLogs(params pagination.QueryParams) (*pagination.PaginatedResponse, error) {
	config := pagination.PaginationConfig{
		Model:         &models.EmailLog{},
		BaseCondition: map[string]interface{}{},
		SearchFields:  []string{"to", "subject", "template_name", "sent_by_username"},
		FilterFields: map[string]string{
			"template_id":      "template_id",
			"template_name":    "template_name",
			"status":           "status",
			"sent_by_user_id":  "sent_by_user_id",
			"sent_by_username": "sent_by_username",
			"created_at":       "created_at",
		},
		DateFields: map[string]pagination.DateField{
			"created_at": {
				Start: "created_at",
				End:   "created_at",
			},
			"sent_at": {
				Start: "sent_at",
				End:   "sent_at",
			},
		},
		SortFields: []string{
			"created_at",
			"sent_at",
			"status",
			"template_name",
		},
		DefaultSort:  "created_at",
		DefaultOrder: "DESC",
		Relations:    []string{},
	}

	paginator := pagination.NewPaginator(s.db)
	return paginator.Paginate(params, config)
}

// GetEmailLogByID retrieves a single email log by ID
func (s *EmailService) GetEmailLogByID(id uint) (*models.EmailLog, error) {
	var emailLog models.EmailLog
	if err := s.db.First(&emailLog, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("email log not found")
		}
		return nil, err
	}
	return &emailLog, nil
}

// SendTestEmail sends a test email to the configured test email address
func (s *EmailService) SendTestEmail(ctx context.Context, userID *uint, username, ipAddress string) (*models.SendEmailResponse, error) {
	if s.config.TestEmailAddress == "" {
		return nil, errors.New("test email address not configured")
	}

	// Create a test email request
	testReq := &models.SendEmailRequest{
		To:          []string{s.config.TestEmailAddress},
		Subject:     "Test Email from SaaS API",
		HTMLContent: "<h1>Test Email</h1><p>This is a test email sent from your SaaS application.</p><p>If you received this, your email service is working correctly!</p>",
		TextContent: "Test Email\n\nThis is a test email sent from your SaaS application.\n\nIf you received this, your email service is working correctly!",
	}

	return s.SendEmail(ctx, testReq, userID, username, ipAddress)
}

// ToLogResponse converts an EmailLog to EmailLogResponse
func (s *EmailService) ToLogResponse(log *models.EmailLog) *models.EmailLogResponse {
	var to, cc, bcc []string
	_ = json.Unmarshal([]byte(log.To), &to)
	_ = json.Unmarshal([]byte(log.Cc), &cc)
	_ = json.Unmarshal([]byte(log.Bcc), &bcc)

	return &models.EmailLogResponse{
		ID:             log.ID,
		TemplateID:     log.TemplateID,
		TemplateName:   log.TemplateName,
		From:           log.From,
		To:             to,
		Cc:             cc,
		Bcc:            bcc,
		Subject:        log.Subject,
		Status:         log.Status,
		ResendID:       log.ResendID,
		ErrorMessage:   log.ErrorMessage,
		SentByUserID:   log.SentByUserID,
		SentByUsername: log.SentByUsername,
		IPAddress:      log.IPAddress,
		SentAt:         log.SentAt,
		CreatedAt:      log.CreatedAt,
	}
}
