package models

import (
	"time"

	"gorm.io/gorm"
)

// RightsAccess represents user-specific permission overrides per menu
type RightsAccess struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null;uniqueIndex:idx_user_menu_rights"`
	MenuID    uint           `json:"menu_id" gorm:"not null;uniqueIndex:idx_user_menu_rights"`
	CanRead   *bool          `json:"can_read"`   // nil means inherit from role
	CanWrite  *bool          `json:"can_write"`  // nil means inherit from role
	CanUpdate *bool          `json:"can_update"` // nil means inherit from role
	CanDelete *bool          `json:"can_delete"` // nil means inherit from role
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	User Users `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Menu Menu  `json:"menu,omitempty" gorm:"foreignKey:MenuID"`
}

// CreateRightsAccessRequest represents the request to create/update permission overrides
type CreateRightsAccessRequest struct {
	UserID    uint  `json:"user_id" validate:"required,min=1"`
	MenuID    uint  `json:"menu_id" validate:"required,min=1"`
	CanRead   *bool `json:"can_read"`
	CanWrite  *bool `json:"can_write"`
	CanUpdate *bool `json:"can_update"`
	CanDelete *bool `json:"can_delete"`
}

// UpdateRightsAccessRequest represents the request to update permission overrides
type UpdateRightsAccessRequest struct {
	CanRead   *bool `json:"can_read"`
	CanWrite  *bool `json:"can_write"`
	CanUpdate *bool `json:"can_update"`
	CanDelete *bool `json:"can_delete"`
}

// BulkUserRightsAccessRequest represents the request to bulk update user rights
type BulkUserRightsAccessRequest struct {
	Permissions []UserMenuPermission `json:"permissions" validate:"required,dive"`
}

// UserMenuPermission represents a single menu permission for a user
type UserMenuPermission struct {
	MenuID    uint  `json:"menu_id" validate:"required,min=1"`
	CanRead   *bool `json:"can_read"`
	CanWrite  *bool `json:"can_write"`
	CanUpdate *bool `json:"can_update"`
	CanDelete *bool `json:"can_delete"`
}

// RightsAccessResponse represents the response for rights access
type RightsAccessResponse struct {
	ID        uint         `json:"id"`
	UserID    uint         `json:"user_id"`
	MenuID    uint         `json:"menu_id"`
	CanRead   *bool        `json:"can_read"`
	CanWrite  *bool        `json:"can_write"`
	CanUpdate *bool        `json:"can_update"`
	CanDelete *bool        `json:"can_delete"`
	Menu      MenuResponse `json:"menu,omitempty"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}
