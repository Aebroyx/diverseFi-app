package models

import (
	"time"

	"gorm.io/gorm"
)

// UserMenu represents the pivot table for direct user-menu assignment
type UserMenu struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null;uniqueIndex:idx_user_menu"`
	MenuID    uint           `json:"menu_id" gorm:"not null;uniqueIndex:idx_user_menu"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	User Users `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Menu Menu  `json:"menu,omitempty" gorm:"foreignKey:MenuID"`
}

// AssignMenuToUserRequest represents the request to assign a menu directly to a user
type AssignMenuToUserRequest struct {
	MenuID uint `json:"menu_id" validate:"required,min=1"`
}

// BulkAssignMenusToUserRequest represents the request to assign multiple menus to a user
type BulkAssignMenusToUserRequest struct {
	MenuIDs []uint `json:"menu_ids" validate:"required,dive,min=1"`
}

// UserMenuResponse represents the response for user-menu assignment
type UserMenuResponse struct {
	ID        uint         `json:"id"`
	UserID    uint         `json:"user_id"`
	MenuID    uint         `json:"menu_id"`
	Menu      MenuResponse `json:"menu,omitempty"`
	CreatedAt time.Time    `json:"created_at"`
}
