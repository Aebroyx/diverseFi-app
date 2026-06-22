package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterUserRoutes registers user management routes
func RegisterUserRoutes(router *gin.RouterGroup, h *handlers.UserHandler) {
	// List users
	router.GET("/users", h.GetAllUsers)

	// Single user operations
	user := router.Group("/user")
	{
		user.GET("/:id", h.GetUserById)
		user.POST("/create", h.CreateUser)
		user.PUT("/:id", h.UpdateUser)
		user.DELETE("/:id", h.DeleteUser)
		user.POST("/reset-password/:id", h.ResetUserPassword)
	}
}
