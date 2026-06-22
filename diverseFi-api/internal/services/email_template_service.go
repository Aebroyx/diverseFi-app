package services

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"gorm.io/gorm"
)

type EmailTemplateService struct {
	db     *gorm.DB
	config *config.Config
}

func NewEmailTemplateService(db *gorm.DB, config *config.Config) *EmailTemplateService {
	return &EmailTemplateService{
		db:     db,
		config: config,
	}
}

// GetAllTemplates retrieves email templates with pagination and filters
func (s *EmailTemplateService) GetAllTemplates(params pagination.QueryParams) (*pagination.PaginatedResponse, error) {
	config := pagination.PaginationConfig{
		Model:         &models.EmailTemplate{},
		BaseCondition: map[string]interface{}{},
		SearchFields:  []string{"name", "display_name", "description", "category"},
		FilterFields: map[string]string{
			"name":       "name",
			"category":   "category",
			"is_active":  "is_active",
			"created_at": "created_at",
			"updated_at": "updated_at",
		},
		DateFields: map[string]pagination.DateField{
			"created_at": {
				Start: "created_at",
				End:   "created_at",
			},
			"updated_at": {
				Start: "updated_at",
				End:   "updated_at",
			},
		},
		SortFields: []string{
			"name",
			"display_name",
			"category",
			"version",
			"created_at",
			"updated_at",
		},
		DefaultSort:  "created_at",
		DefaultOrder: "DESC",
		Relations:    []string{},
	}

	paginator := pagination.NewPaginator(s.db)
	return paginator.Paginate(params, config)
}

// GetTemplateByID retrieves an email template by ID
func (s *EmailTemplateService) GetTemplateByID(id uint) (*models.EmailTemplate, error) {
	var template models.EmailTemplate
	if err := s.db.First(&template, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("email template not found")
		}
		return nil, err
	}
	return &template, nil
}

// GetTemplateByName retrieves an email template by name
func (s *EmailTemplateService) GetTemplateByName(name string) (*models.EmailTemplate, error) {
	var template models.EmailTemplate
	if err := s.db.Where("name = ? AND is_active = ?", name, true).First(&template).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("email template not found")
		}
		return nil, err
	}
	return &template, nil
}

// CreateTemplate creates a new email template
func (s *EmailTemplateService) CreateTemplate(req *models.CreateEmailTemplateRequest, userID uint) (*models.EmailTemplate, error) {
	// Check if name already exists
	var existing models.EmailTemplate
	if err := s.db.Unscoped().Where("name = ?", req.Name).First(&existing).Error; err == nil {
		return nil, errors.New("template name already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Convert variables slice to JSON
	variablesJSON := "[]"
	if len(req.Variables) > 0 {
		variablesBytes, err := json.Marshal(req.Variables)
		if err != nil {
			return nil, errors.New("failed to encode variables")
		}
		variablesJSON = string(variablesBytes)
	}

	// Set default IsActive if not provided
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	template := models.EmailTemplate{
		Name:        strings.ToLower(strings.TrimSpace(req.Name)),
		DisplayName: req.DisplayName,
		Description: req.Description,
		Subject:     req.Subject,
		HTMLContent: req.HTMLContent,
		TextContent: req.TextContent,
		Variables:   variablesJSON,
		Category:    req.Category,
		IsActive:    isActive,
		Version:     1,
		CreatedBy:   &userID,
	}

	if err := s.db.Create(&template).Error; err != nil {
		return nil, err
	}

	return &template, nil
}

// UpdateTemplate updates an existing email template
func (s *EmailTemplateService) UpdateTemplate(id uint, req *models.UpdateEmailTemplateRequest, userID uint) (*models.EmailTemplate, error) {
	var template models.EmailTemplate
	if err := s.db.First(&template, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("email template not found")
		}
		return nil, err
	}

	// Convert variables slice to JSON
	if len(req.Variables) > 0 {
		variablesBytes, err := json.Marshal(req.Variables)
		if err != nil {
			return nil, errors.New("failed to encode variables")
		}
		template.Variables = string(variablesBytes)
	}

	// Update fields
	template.DisplayName = req.DisplayName
	template.Description = req.Description
	template.Subject = req.Subject
	template.HTMLContent = req.HTMLContent
	template.TextContent = req.TextContent
	template.Category = req.Category
	template.UpdatedBy = &userID
	template.Version++ // Increment version

	if req.IsActive != nil {
		template.IsActive = *req.IsActive
	}

	if err := s.db.Save(&template).Error; err != nil {
		return nil, err
	}

	return &template, nil
}

// DeleteTemplate soft deletes an email template
func (s *EmailTemplateService) DeleteTemplate(id uint) error {
	result := s.db.Delete(&models.EmailTemplate{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("email template not found")
	}
	return nil
}

// GetCategories retrieves distinct categories
func (s *EmailTemplateService) GetCategories() ([]string, error) {
	var categories []string
	if err := s.db.Model(&models.EmailTemplate{}).
		Distinct("category").
		Where("category IS NOT NULL AND category != ''").
		Pluck("category", &categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// ToResponse converts an EmailTemplate to EmailTemplateResponse
func (s *EmailTemplateService) ToResponse(template *models.EmailTemplate) *models.EmailTemplateResponse {
	var variables []string
	if template.Variables != "" {
		_ = json.Unmarshal([]byte(template.Variables), &variables)
	}

	return &models.EmailTemplateResponse{
		ID:          template.ID,
		Name:        template.Name,
		DisplayName: template.DisplayName,
		Description: template.Description,
		Subject:     template.Subject,
		HTMLContent: template.HTMLContent,
		TextContent: template.TextContent,
		Variables:   variables,
		Category:    template.Category,
		IsActive:    template.IsActive,
		Version:     template.Version,
		CreatedBy:   template.CreatedBy,
		UpdatedBy:   template.UpdatedBy,
		CreatedAt:   template.CreatedAt,
		UpdatedAt:   template.UpdatedAt,
	}
}
