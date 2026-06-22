package models

import (
	"time"

	"gorm.io/gorm"
)

// Role represents a user role in the system
type Role struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"unique;not null;size:50"`
	DisplayName string         `json:"display_name" gorm:"not null;size:100"`
	Description string         `json:"description" gorm:"size:255"`
	IsDefault   bool           `json:"is_default" gorm:"default:false"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Users     []Users    `json:"users,omitempty" gorm:"foreignKey:RoleID"`
	RoleMenus []RoleMenu `json:"role_menus,omitempty" gorm:"foreignKey:RoleID"`
}

// CreateRoleRequest represents the request payload for creating a role
type CreateRoleRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=50"`
	DisplayName string `json:"display_name" validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"max=255"`
	IsDefault   bool   `json:"is_default"`
}

// UpdateRoleRequest represents the request payload for updating a role
type UpdateRoleRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=50"`
	DisplayName string `json:"display_name" validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"max=255"`
	IsDefault   bool   `json:"is_default"`
	IsActive    bool   `json:"is_active"`
}

// RoleResponse represents the response payload for role data
type RoleResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description"`
	IsDefault   bool      `json:"is_default"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
