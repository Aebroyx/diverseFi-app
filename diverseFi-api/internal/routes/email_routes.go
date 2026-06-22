package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterEmailRoutes registers email routes
func RegisterEmailRoutes(router *gin.RouterGroup, h *handlers.EmailHandler) {
	email := router.Group("/email")
	{
		email.POST("/send", h.SendEmail)
		email.POST("/send-test", h.SendTestEmail)
		email.GET("/logs", h.GetEmailLogs)
		email.GET("/log/:id", h.GetEmailLogByID)
	}
}
