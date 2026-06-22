package models

import (
	"time"

	"gorm.io/gorm"
)

// RefreshToken represents a refresh token in the database
type RefreshToken struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Token        string         `json:"token" gorm:"unique;not null;size:255;index"`
	UserID       uint           `json:"user_id" gorm:"not null;index"`
	ExpiresAt    time.Time      `json:"expires_at" gorm:"not null;index"`
	IsRevoked    bool           `json:"is_revoked" gorm:"default:false;index"`
	RevokedAt    *time.Time     `json:"revoked_at,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	IPAddress    string         `json:"ip_address" gorm:"size:45"` // IPv6 support
	UserAgent    string         `json:"user_agent" gorm:"size:500"`
	ReplacedBy   *uint          `json:"replaced_by,omitempty"` // Token ID that replaced this one during rotation

	// Relationships
	User Users `json:"user" gorm:"foreignKey:UserID"`
}

// RefreshTokenRequest represents a request to refresh access token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshTokenResponse represents the response after refreshing token
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

// RevokeTokenRequest represents a request to revoke a specific refresh token
type RevokeTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}
