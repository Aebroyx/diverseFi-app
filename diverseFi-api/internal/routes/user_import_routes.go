package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterUserImportRoutes registers user import/export routes
func RegisterUserImportRoutes(router *gin.RouterGroup, h *handlers.UserImportHandler) {
	users := router.Group("/users")
	{
		// Export users as Excel file
		users.GET("/export", h.ExportUsersToExcel)

		// Download template Excel file
		users.GET("/template", h.DownloadTemplate)

		// Import operations (JSON-based)
		users.POST("/import/validate", h.ValidateImport)
		users.POST("/import", h.BulkImport)
	}
}
