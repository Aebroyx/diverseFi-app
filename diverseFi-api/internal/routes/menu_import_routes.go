package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterMenuImportRoutes registers menu import/export routes
func RegisterMenuImportRoutes(router *gin.RouterGroup, h *handlers.MenuImportHandler) {
	menus := router.Group("/menus")
	{
		// Export menus as Excel file
		menus.GET("/export", h.ExportMenusToExcel)

		// Download template Excel file
		menus.GET("/template", h.DownloadMenusTemplate)

		// Import operations (JSON-based)
		menus.POST("/import/validate", h.ValidateMenuImport)
		menus.POST("/import", h.BulkMenuImport)
	}
}
