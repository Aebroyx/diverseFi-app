package models

import (
	"time"

	"gorm.io/gorm"
)

// RoleMenu represents the pivot table between roles and menus with default permissions
type RoleMenu struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	RoleID    uint           `json:"role_id" gorm:"not null;uniqueIndex:idx_role_menu"`
	MenuID    uint           `json:"menu_id" gorm:"not null;uniqueIndex:idx_role_menu"`
	CanRead   bool           `json:"can_read" gorm:"default:true"`
	CanWrite  bool           `json:"can_write" gorm:"default:false"`
	CanUpdate bool           `json:"can_update" gorm:"default:false"`
	CanDelete bool           `json:"can_delete" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Role Role `json:"role,omitempty" gorm:"foreignKey:RoleID"`
	Menu Menu `json:"menu,omitempty" gorm:"foreignKey:MenuID"`
}

// AssignMenuToRoleRequest represents the request to assign a menu to a role
type AssignMenuToRoleRequest struct {
	MenuID    uint `json:"menu_id" validate:"required,min=1"`
	CanRead   bool `json:"can_read"`
	CanWrite  bool `json:"can_write"`
	CanUpdate bool `json:"can_update"`
	CanDelete bool `json:"can_delete"`
}

// BulkAssignMenusRequest represents the request to assign multiple menus to a role
type BulkAssignMenusRequest struct {
	Menus []AssignMenuToRoleRequest `json:"menus" validate:"required,dive"`
}

// RoleMenuResponse represents the response for role-menu assignment
type RoleMenuResponse struct {
	ID        uint         `json:"id"`
	RoleID    uint         `json:"role_id"`
	MenuID    uint         `json:"menu_id"`
	CanRead   bool         `json:"can_read"`
	CanWrite  bool         `json:"can_write"`
	CanUpdate bool         `json:"can_update"`
	CanDelete bool         `json:"can_delete"`
	Menu      MenuResponse `json:"menu,omitempty"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}
