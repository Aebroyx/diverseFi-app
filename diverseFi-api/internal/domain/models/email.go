package models

import (
	"time"

	"gorm.io/gorm"
)

// EmailTemplate stores reusable email templates
type EmailTemplate struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"unique;not null;size:100;index"` // e.g., "welcome_email"
	DisplayName string         `json:"display_name" gorm:"size:200"`
	Description string         `json:"description" gorm:"type:text"`
	Subject     string         `json:"subject" gorm:"not null;size:500"` // Supports {{variables}}
	HTMLContent string         `json:"html_content" gorm:"type:text"`    // Supports {{variables}}
	TextContent string         `json:"text_content" gorm:"type:text"`
	Variables   string         `json:"variables" gorm:"type:text"` // JSON array: ["name", "link"]
	Category    string         `json:"category" gorm:"size:50;index"`    // e.g., "auth", "notification"
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	Version     int            `json:"version" gorm:"default:1"`
	CreatedBy   *uint          `json:"created_by,omitempty" gorm:"index"`
	UpdatedBy   *uint          `json:"updated_by,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Creator *Users `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Updater *Users `json:"updater,omitempty" gorm:"foreignKey:UpdatedBy"`
}

// EmailLog tracks all sent emails
type EmailLog struct {
	ID             uint       `json:"id" gorm:"primaryKey"`
	TemplateID     *uint      `json:"template_id,omitempty" gorm:"index"`
	TemplateName   string     `json:"template_name" gorm:"size:100;index"`
	From           string     `json:"from" gorm:"size:255;not null"`
	To             string     `json:"to" gorm:"type:text;not null"` // JSON array
	Cc             string     `json:"cc,omitempty" gorm:"type:text"` // JSON array
	Bcc            string     `json:"bcc,omitempty" gorm:"type:text"` // JSON array
	Subject        string     `json:"subject" gorm:"size:500"`
	HTMLContent    string     `json:"-" gorm:"type:text"` // Not included in JSON response
	TextContent    string     `json:"-" gorm:"type:text"` // Not included in JSON response
	Status         string     `json:"status" gorm:"size:20;not null;index;default:'pending'"` // "pending", "sent", "failed"
	ResendID       string     `json:"resend_id,omitempty" gorm:"size:100;index"`
	ErrorMessage   string     `json:"error_message,omitempty" gorm:"type:text"`
	Variables      string     `json:"variables,omitempty" gorm:"type:text"` // JSON
	SentByUserID   *uint      `json:"sent_by_user_id,omitempty" gorm:"index"`
	SentByUsername string     `json:"sent_by_username" gorm:"size:50"`
	IPAddress      string     `json:"ip_address" gorm:"size:45"` // IPv6 support
	SentAt         *time.Time `json:"sent_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`

	// Relationships
	Template *EmailTemplate `json:"template,omitempty" gorm:"foreignKey:TemplateID"`
	SentBy   *Users         `json:"sent_by,omitempty" gorm:"foreignKey:SentByUserID"`
}

// CreateEmailTemplateRequest represents request data for creating an email template
type CreateEmailTemplateRequest struct {
	Name        string   `json:"name" validate:"required,min=1,max=100"`
	DisplayName string   `json:"display_name" validate:"max=200"`
	Description string   `json:"description"`
	Subject     string   `json:"subject" validate:"required,min=1,max=500"`
	HTMLContent string   `json:"html_content"`
	TextContent string   `json:"text_content"`
	Variables   []string `json:"variables"`
	Category    string   `json:"category" validate:"max=50"`
	IsActive    *bool    `json:"is_active"`
}

// UpdateEmailTemplateRequest represents request data for updating an email template
type UpdateEmailTemplateRequest struct {
	DisplayName string   `json:"display_name" validate:"max=200"`
	Description string   `json:"description"`
	Subject     string   `json:"subject" validate:"required,min=1,max=500"`
	HTMLContent string   `json:"html_content"`
	TextContent string   `json:"text_content"`
	Variables   []string `json:"variables"`
	Category    string   `json:"category" validate:"max=50"`
	IsActive    *bool    `json:"is_active"`
}

// EmailTemplateResponse represents the response payload for an email template
type EmailTemplateResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description"`
	Subject     string    `json:"subject"`
	HTMLContent string    `json:"html_content"`
	TextContent string    `json:"text_content"`
	Variables   []string  `json:"variables"`
	Category    string    `json:"category"`
	IsActive    bool      `json:"is_active"`
	Version     int       `json:"version"`
	CreatedBy   *uint     `json:"created_by,omitempty"`
	UpdatedBy   *uint     `json:"updated_by,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// SendEmailRequest represents request data for sending an email
type SendEmailRequest struct {
	TemplateName string            `json:"template_name"` // Optional: use template
	To           []string          `json:"to" validate:"required,min=1,dive,email"`
	Cc           []string          `json:"cc,omitempty" validate:"omitempty,dive,email"`
	Bcc          []string          `json:"bcc,omitempty" validate:"omitempty,dive,email"`
	Subject      string            `json:"subject"` // Optional if using template
	HTMLContent  string            `json:"html_content"` // Optional if using template
	TextContent  string            `json:"text_content"`
	Variables    map[string]string `json:"variables,omitempty"` // Variables for template interpolation
}

// SendEmailResponse represents the response after sending an email
type SendEmailResponse struct {
	ID       uint   `json:"id"`
	ResendID string `json:"resend_id,omitempty"`
	Status   string `json:"status"`
	Message  string `json:"message"`
}

// EmailLogQueryParams represents query parameters for filtering email logs
type EmailLogQueryParams struct {
	TemplateID     *uint     `form:"template_id"`
	TemplateName   string    `form:"template_name"`
	Status         string    `form:"status"`
	To             string    `form:"to"` // Search in recipients
	SentByUserID   *uint     `form:"sent_by_user_id"`
	SentByUsername string    `form:"sent_by_username"`
	StartDate      time.Time `form:"start_date"`
	EndDate        time.Time `form:"end_date"`
	Page           int       `form:"page"`
	Limit          int       `form:"limit"`
	SortBy         string    `form:"sort_by"`
	SortOrder      string    `form:"sort_order"`
}

// EmailLogResponse represents the response payload for an email log
type EmailLogResponse struct {
	ID             uint       `json:"id"`
	TemplateID     *uint      `json:"template_id,omitempty"`
	TemplateName   string     `json:"template_name"`
	From           string     `json:"from"`
	To             []string   `json:"to"`
	Cc             []string   `json:"cc,omitempty"`
	Bcc            []string   `json:"bcc,omitempty"`
	Subject        string     `json:"subject"`
	Status         string     `json:"status"`
	ResendID       string     `json:"resend_id,omitempty"`
	ErrorMessage   string     `json:"error_message,omitempty"`
	SentByUserID   *uint      `json:"sent_by_user_id,omitempty"`
	SentByUsername string     `json:"sent_by_username"`
	IPAddress      string     `json:"ip_address"`
	SentAt         *time.Time `json:"sent_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

// EmailTemplateQueryParams represents query parameters for filtering email templates
type EmailTemplateQueryParams struct {
	Name      string `form:"name"`
	Category  string `form:"category"`
	IsActive  *bool  `form:"is_active"`
	Page      int    `form:"page"`
	Limit     int    `form:"limit"`
	SortBy    string `form:"sort_by"`
	SortOrder string `form:"sort_order"`
}
