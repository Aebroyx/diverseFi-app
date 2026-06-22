package handlers

import (
	"net/http"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type TokenHandler struct {
	tokenService *services.TokenService
	userService  *services.UserService
	config       *config.Config
	db           *gorm.DB
}

func NewTokenHandler(tokenService *services.TokenService, userService *services.UserService, config *config.Config, db *gorm.DB) *TokenHandler {
	return &TokenHandler{
		tokenService: tokenService,
		userService:  userService,
		config:       config,
		db:           db,
	}
}

// RefreshToken rotates the refresh token and issues a new access token
// POST /api/auth/refresh-token
func (h *TokenHandler) RefreshToken(c *gin.Context) {
	// Get refresh token from cookie
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		common.SendError(c, http.StatusUnauthorized, "Refresh token required", common.CodeUnauthorized, nil)
		return
	}

	// Validate and rotate refresh token
	newRefreshToken, err := h.tokenService.RotateRefreshToken(
		refreshToken,
		c.ClientIP(),
		c.Request.UserAgent(),
	)
	if err != nil {
		common.SendError(c, http.StatusUnauthorized, err.Error(), common.CodeUnauthorized, nil)
		return
	}

	// Get user from database
	var user models.Users
	if err := h.db.Preload("Role").First(&user, newRefreshToken.UserID).Error; err != nil {
		common.SendError(c, http.StatusUnauthorized, "User not found", common.CodeUnauthorized, nil)
		return
	}

	// Generate new access token
	accessToken, accessExp, err := h.generateAccessToken(user)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to generate access token", common.CodeInternalError, nil)
		return
	}

	// Set cookies
	h.setAuthCookies(c, accessToken, newRefreshToken.Token, accessExp)

	// Return tokens
	common.SendSuccess(c, http.StatusOK, "Token refreshed successfully", gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken.Token,
		"token_type":    "Bearer",
		"expires_in":    int64(time.Until(accessExp).Seconds()),
	})
}

// RevokeToken revokes a specific refresh token
// POST /api/auth/revoke-token
func (h *TokenHandler) RevokeToken(c *gin.Context) {
	var req models.RevokeTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request", common.CodeValidationError, err.Error())
		return
	}

	if err := h.tokenService.RevokeRefreshToken(req.RefreshToken); err != nil {
		common.SendError(c, http.StatusBadRequest, err.Error(), common.CodeBadRequest, nil)
		return
	}

	common.SendSuccess(c, http.StatusOK, "Token revoked successfully", nil)
}

// RevokeAllTokens revokes all refresh tokens for the authenticated user
// POST /api/auth/revoke-all-tokens
func (h *TokenHandler) RevokeAllTokens(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userIDValue, exists := c.Get("user_id")
	if !exists {
		common.SendError(c, http.StatusUnauthorized, "Authentication required", common.CodeUnauthorized, nil)
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		common.SendError(c, http.StatusInternalServerError, "Invalid user ID", common.CodeInternalError, nil)
		return
	}

	if err := h.tokenService.RevokeAllUserTokens(userID); err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to revoke tokens", common.CodeInternalError, err.Error())
		return
	}

	// Clear cookies
	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	common.SendSuccess(c, http.StatusOK, "All tokens revoked successfully", nil)
}

// GetActiveTokens returns all active refresh tokens for the authenticated user
// GET /api/auth/tokens
func (h *TokenHandler) GetActiveTokens(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userIDValue, exists := c.Get("user_id")
	if !exists {
		common.SendError(c, http.StatusUnauthorized, "Authentication required", common.CodeUnauthorized, nil)
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		common.SendError(c, http.StatusInternalServerError, "Invalid user ID", common.CodeInternalError, nil)
		return
	}

	tokens, err := h.tokenService.GetUserActiveTokens(userID)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to retrieve tokens", common.CodeInternalError, err.Error())
		return
	}

	// Map to safe response (hide full token string)
	type TokenInfo struct {
		ID        uint      `json:"id"`
		CreatedAt time.Time `json:"created_at"`
		ExpiresAt time.Time `json:"expires_at"`
		IPAddress string    `json:"ip_address"`
		UserAgent string    `json:"user_agent"`
	}

	tokenInfos := make([]TokenInfo, len(tokens))
	for i, token := range tokens {
		tokenInfos[i] = TokenInfo{
			ID:        token.ID,
			CreatedAt: token.CreatedAt,
			ExpiresAt: token.ExpiresAt,
			IPAddress: token.IPAddress,
			UserAgent: token.UserAgent,
		}
	}

	common.SendSuccess(c, http.StatusOK, "Active tokens retrieved successfully", gin.H{
		"tokens": tokenInfos,
		"total":  len(tokenInfos),
	})
}

// generateAccessToken generates a JWT access token
func (h *TokenHandler) generateAccessToken(user models.Users) (string, time.Time, error) {
	expirationTime := time.Now().Add(h.config.JWTExpiry)
	claims := &models.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RoleID:   user.RoleID,
		RoleName: user.Role.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "diversefi-api",
			Subject:   user.Username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.config.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

// setAuthCookies sets the access and refresh token cookies
func (h *TokenHandler) setAuthCookies(c *gin.Context, accessToken, refreshToken string, accessExp time.Time) {
	// Set access token cookie (shorter expiry)
	c.SetCookie(
		"access_token",
		accessToken,
		int(time.Until(accessExp).Seconds()),
		"/",
		"",
		false, // set to true in production with HTTPS
		true,  // httpOnly
	)

	// Set refresh token cookie (longer expiry)
	c.SetCookie(
		"refresh_token",
		refreshToken,
		int(h.config.RefreshTokenExpiry.Seconds()),
		"/",
		"",
		false, // set to true in production with HTTPS
		true,  // httpOnly
	)
}
