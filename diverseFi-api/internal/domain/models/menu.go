package models

import (
	"time"

	"gorm.io/gorm"
)

// Menu represents a navigation menu item in the system
type Menu struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	Name       string         `json:"name" gorm:"not null;size:100"`
	Path       string         `json:"path" gorm:"size:255"`
	Icon       string         `json:"icon" gorm:"size:100"`
	OrderIndex int            `json:"order_index" gorm:"default:0"`
	ParentID   *uint          `json:"parent_id" gorm:"index"`
	IsActive   bool           `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Self-referential relationship for hierarchy
	Parent   *Menu  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Menu `json:"children,omitempty" gorm:"foreignKey:ParentID"`

	// Relationships
	RoleMenus    []RoleMenu    `json:"role_menus,omitempty" gorm:"foreignKey:MenuID"`
	UserMenus    []UserMenu    `json:"user_menus,omitempty" gorm:"foreignKey:MenuID"`
	RightsAccess []RightsAccess `json:"rights_access,omitempty" gorm:"foreignKey:MenuID"`
}

// CreateMenuRequest represents the request payload for creating a menu
type CreateMenuRequest struct {
	Name       string `json:"name" validate:"required,min=1,max=100"`
	Path       string `json:"path" validate:"max=255"`
	Icon       string `json:"icon" validate:"max=100"`
	OrderIndex int    `json:"order_index"`
	ParentID   *uint  `json:"parent_id"`
	IsActive   bool   `json:"is_active"`
}

// UpdateMenuRequest represents the request payload for updating a menu
type UpdateMenuRequest struct {
	Name       string `json:"name" validate:"required,min=1,max=100"`
	Path       string `json:"path" validate:"max=255"`
	Icon       string `json:"icon" validate:"max=100"`
	OrderIndex int    `json:"order_index"`
	ParentID   *uint  `json:"parent_id"`
	IsActive   bool   `json:"is_active"`
}

// MenuResponse represents the response payload for menu data
type MenuResponse struct {
	ID         uint            `json:"id"`
	Name       string          `json:"name"`
	Path       string          `json:"path"`
	Icon       string          `json:"icon"`
	OrderIndex int             `json:"order_index"`
	ParentID   *uint           `json:"parent_id"`
	IsActive   bool            `json:"is_active"`
	Children   []MenuResponse  `json:"children,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

// MenuWithPermissions represents a menu with its effective permissions for a user
type MenuWithPermissions struct {
	ID         uint                      `json:"id"`
	Name       string                    `json:"name"`
	Path       string                    `json:"path"`
	Icon       string                    `json:"icon"`
	OrderIndex int                       `json:"order_index"`
	ParentID   *uint                     `json:"parent_id"`
	IsActive   bool                      `json:"is_active"`
	Children   []MenuWithPermissions     `json:"children,omitempty"`
	Permissions EffectivePermissions     `json:"permissions"`
}

// EffectivePermissions represents the CRUD permissions for a menu
type EffectivePermissions struct {
	CanRead   bool `json:"can_read"`
	CanWrite  bool `json:"can_write"`
	CanUpdate bool `json:"can_update"`
	CanDelete bool `json:"can_delete"`
}
