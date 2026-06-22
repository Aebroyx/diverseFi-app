package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterTokenRoutes registers token-related routes (all protected)
// Note: /refresh-token is registered as public route in router.go
func RegisterTokenRoutes(router *gin.RouterGroup, h *handlers.TokenHandler) {
	auth := router.Group("/auth")
	{
		// These require authentication
		auth.POST("/revoke-token", h.RevokeToken)
		auth.POST("/revoke-all-tokens", h.RevokeAllTokens)
		auth.GET("/tokens", h.GetActiveTokens)
	}
}
