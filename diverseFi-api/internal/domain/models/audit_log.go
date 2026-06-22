package models

import (
	"time"

	"gorm.io/gorm"
)

// AuditLog represents an audit log entry in the database
type AuditLog struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	UserID         *uint          `json:"user_id,omitempty" gorm:"index"` // Nullable for system actions
	Username       string         `json:"username" gorm:"size:50;index"`
	Action         string         `json:"action" gorm:"not null;size:50;index"` // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
	ResourceType   string         `json:"resource_type" gorm:"size:50;index"`   // users, roles, menus, etc.
	ResourceID     string         `json:"resource_id" gorm:"size:50;index"`     // String to support UUID or composite keys
	OldValues      string         `json:"old_values,omitempty" gorm:"type:text"` // JSON string of old values
	NewValues      string         `json:"new_values,omitempty" gorm:"type:text"` // JSON string of new values
	IPAddress      string         `json:"ip_address" gorm:"size:45;index"` // IPv6 support
	UserAgent      string         `json:"user_agent" gorm:"size:500"`
	CorrelationID  string         `json:"correlation_id" gorm:"size:100;index"`
	Timestamp      time.Time      `json:"timestamp" gorm:"not null;index"`
	CreatedAt      time.Time      `json:"created_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	User *Users `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// AuditLogQueryParams represents query parameters for filtering audit logs
type AuditLogQueryParams struct {
	UserID        *uint     `form:"user_id"`
	Username      string    `form:"username"`
	Action        string    `form:"action"`
	ResourceType  string    `form:"resource_type"`
	ResourceID    string    `form:"resource_id"`
	IPAddress     string    `form:"ip_address"`
	CorrelationID string    `form:"correlation_id"`
	StartDate     time.Time `form:"start_date"`
	EndDate       time.Time `form:"end_date"`
	Page          int       `form:"page"`
	Limit         int       `form:"limit"`
	SortBy        string    `form:"sort_by"`  // Field to sort by
	SortOrder     string    `form:"sort_order"` // asc or desc
}

// AuditLogResponse represents the response payload for audit logs
type AuditLogResponse struct {
	ID            uint       `json:"id"`
	UserID        *uint      `json:"user_id,omitempty"`
	Username      string     `json:"username"`
	Action        string     `json:"action"`
	ResourceType  string     `json:"resource_type"`
	ResourceID    string     `json:"resource_id"`
	OldValues     string     `json:"old_values,omitempty"`
	NewValues     string     `json:"new_values,omitempty"`
	IPAddress     string     `json:"ip_address"`
	UserAgent     string     `json:"user_agent"`
	CorrelationID string     `json:"correlation_id"`
	Timestamp     time.Time  `json:"timestamp"`
}

// CreateAuditLogRequest represents request data for creating an audit log
type CreateAuditLogRequest struct {
	UserID        *uint  `json:"user_id,omitempty"`
	Username      string `json:"username"`
	Action        string `json:"action" validate:"required"`
	ResourceType  string `json:"resource_type" validate:"required"`
	ResourceID    string `json:"resource_id"`
	OldValues     string `json:"old_values,omitempty"`
	NewValues     string `json:"new_values,omitempty"`
	IPAddress     string `json:"ip_address"`
	UserAgent     string `json:"user_agent"`
	CorrelationID string `json:"correlation_id"`
}
