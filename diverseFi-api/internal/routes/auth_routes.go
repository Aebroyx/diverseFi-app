package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterAuthPublicRoutes registers public auth routes
func RegisterAuthPublicRoutes(router *gin.RouterGroup, h *handlers.AuthHandler) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
	}
}

// RegisterAuthProtectedRoutes registers protected auth routes
func RegisterAuthProtectedRoutes(router *gin.RouterGroup, h *handlers.AuthHandler) {
	router.GET("/me", h.GetMe)
	router.POST("/auth/logout", h.Logout)
}
