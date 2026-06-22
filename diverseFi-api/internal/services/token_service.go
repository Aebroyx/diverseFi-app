package services

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"gorm.io/gorm"
)

type TokenService struct {
	db     *gorm.DB
	config *config.Config
}

func NewTokenService(db *gorm.DB, config *config.Config) *TokenService {
	return &TokenService{
		db:     db,
		config: config,
	}
}

// GenerateSecureToken generates a cryptographically secure random token
func (s *TokenService) GenerateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// CreateRefreshToken creates a new refresh token for a user
func (s *TokenService) CreateRefreshToken(userID uint, ipAddress, userAgent string) (*models.RefreshToken, error) {
	token, err := s.GenerateSecureToken()
	if err != nil {
		return nil, err
	}

	refreshToken := &models.RefreshToken{
		Token:     token,
		UserID:    userID,
		ExpiresAt: time.Now().Add(s.config.RefreshTokenExpiry),
		IsRevoked: false,
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	if err := s.db.Create(refreshToken).Error; err != nil {
		return nil, err
	}

	return refreshToken, nil
}

// ValidateRefreshToken validates a refresh token and returns it if valid
func (s *TokenService) ValidateRefreshToken(token string) (*models.RefreshToken, error) {
	var refreshToken models.RefreshToken

	if err := s.db.Where("token = ?", token).First(&refreshToken).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid refresh token")
		}
		return nil, err
	}

	// Check if token is revoked
	if refreshToken.IsRevoked {
		return nil, errors.New("refresh token has been revoked")
	}

	// Check if token is expired
	if time.Now().After(refreshToken.ExpiresAt) {
		return nil, errors.New("refresh token has expired")
	}

	return &refreshToken, nil
}

// RotateRefreshToken rotates a refresh token by revoking the old one and creating a new one
func (s *TokenService) RotateRefreshToken(oldToken string, ipAddress, userAgent string) (*models.RefreshToken, error) {
	// Validate old token
	oldRefreshToken, err := s.ValidateRefreshToken(oldToken)
	if err != nil {
		return nil, err
	}

	// Create new refresh token
	newRefreshToken, err := s.CreateRefreshToken(oldRefreshToken.UserID, ipAddress, userAgent)
	if err != nil {
		return nil, err
	}

	// Revoke old token and mark replacement
	now := time.Now()
	oldRefreshToken.IsRevoked = true
	oldRefreshToken.RevokedAt = &now
	oldRefreshToken.ReplacedBy = &newRefreshToken.ID

	if err := s.db.Save(oldRefreshToken).Error; err != nil {
		// Rollback: delete new token if we can't revoke old one
		s.db.Delete(newRefreshToken)
		return nil, err
	}

	return newRefreshToken, nil
}

// RevokeRefreshToken revokes a specific refresh token
func (s *TokenService) RevokeRefreshToken(token string) error {
	var refreshToken models.RefreshToken

	if err := s.db.Where("token = ?", token).First(&refreshToken).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("refresh token not found")
		}
		return err
	}

	if refreshToken.IsRevoked {
		return errors.New("refresh token already revoked")
	}

	now := time.Now()
	refreshToken.IsRevoked = true
	refreshToken.RevokedAt = &now

	return s.db.Save(&refreshToken).Error
}

// RevokeAllUserTokens revokes all refresh tokens for a specific user
func (s *TokenService) RevokeAllUserTokens(userID uint) error {
	now := time.Now()

	return s.db.Model(&models.RefreshToken{}).
		Where("user_id = ? AND is_revoked = ?", userID, false).
		Updates(map[string]interface{}{
			"is_revoked": true,
			"revoked_at": now,
		}).Error
}

// CleanupExpiredTokens removes expired tokens from the database (should be run periodically)
func (s *TokenService) CleanupExpiredTokens() error {
	// Delete tokens that expired more than 30 days ago
	cutoffDate := time.Now().AddDate(0, 0, -30)

	return s.db.Where("expires_at < ?", cutoffDate).
		Delete(&models.RefreshToken{}).Error
}

// GetUserActiveTokens returns all active (non-revoked, non-expired) tokens for a user
func (s *TokenService) GetUserActiveTokens(userID uint) ([]models.RefreshToken, error) {
	var tokens []models.RefreshToken

	err := s.db.Where("user_id = ? AND is_revoked = ? AND expires_at > ?",
		userID, false, time.Now()).
		Order("created_at DESC").
		Find(&tokens).Error

	return tokens, err
}
