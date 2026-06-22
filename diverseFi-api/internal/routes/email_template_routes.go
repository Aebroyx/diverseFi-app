package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterEmailTemplateRoutes registers email template routes
func RegisterEmailTemplateRoutes(router *gin.RouterGroup, h *handlers.EmailTemplateHandler) {
	// List templates and categories
	router.GET("/email-templates", h.GetAllTemplates)
	router.GET("/email-templates/categories", h.GetCategories)

	// Single template operations
	emailTemplate := router.Group("/email-template")
	{
		emailTemplate.GET("/:id", h.GetTemplateByID)
		emailTemplate.POST("/create", h.CreateTemplate)
		emailTemplate.PUT("/:id", h.UpdateTemplate)
		emailTemplate.DELETE("/:id", h.DeleteTemplate)
	}
}
