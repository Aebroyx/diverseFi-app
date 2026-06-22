package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type Users struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"unique;not null;size:50"`
	Email     string         `json:"email" gorm:"unique;not null;size:255"`
	Password  string         `json:"-" gorm:"not null"`
	Name      string         `json:"name" gorm:"not null;size:100"`
	RoleID    uint           `json:"role_id" gorm:"not null;default:2"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	IsDeleted bool           `json:"is_deleted" gorm:"default:false"`
	IsActive  bool           `json:"is_active"`

	// Relationships
	Role         Role           `json:"role" gorm:"foreignKey:RoleID"`
	UserMenus    []UserMenu     `json:"user_menus,omitempty" gorm:"foreignKey:UserID"`
	RightsAccess []RightsAccess `json:"rights_access,omitempty" gorm:"foreignKey:UserID"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,password"`
	Name     string `json:"name" validate:"required,max=100"`
}

// RegisterResponse represents the registration response payload
type RegisterResponse struct {
	ID       uint         `json:"id"`
	Username string       `json:"username"`
	Email    string       `json:"email"`
	Name     string       `json:"name"`
	Role     RoleResponse `json:"role"`
	IsActive bool         `json:"is_active"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// TokenResponse represents the token response payload
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

// LoginResponse represents the login response payload
type LoginResponse struct {
	User  RegisterResponse `json:"user"`
	Token TokenResponse    `json:"token"`
}

// Claims represents the JWT claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	RoleID   uint   `json:"role_id"`
	RoleName string `json:"role_name"`
	jwt.RegisteredClaims
}

// CreateUserRequest represents the request payload for creating a user
type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,password"`
	Name     string `json:"name" validate:"required,max=100"`
	RoleID   uint   `json:"role_id" validate:"required,min=1"`
	IsActive *bool  `json:"is_active" validate:"required"`
}

// CreateUserResponse represents the response payload for creating a user
type CreateUserResponse struct {
	ID        uint         `json:"id"`
	Username  string       `json:"username"`
	Email     string       `json:"email"`
	Name      string       `json:"name"`
	Role      RoleResponse `json:"role"`
	IsActive  bool         `json:"is_active"`
	CreatedAt time.Time    `json:"created_at"`
}

type UpdateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email,max=255"`
	Name     string `json:"name" validate:"required,max=100"`
	RoleID   uint   `json:"role_id" validate:"required,min=1"`
	Password string `json:"password,omitempty" validate:"omitempty,password"`
	IsActive *bool  `json:"is_active" validate:"required"`
}

type ResetUserPasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,password"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
}
