package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterRoleImportRoutes registers role import/export routes
func RegisterRoleImportRoutes(router *gin.RouterGroup, h *handlers.RoleImportHandler) {
	roles := router.Group("/roles")
	{
		// Export roles as Excel file
		roles.GET("/export", h.ExportRolesToExcel)

		// Download template Excel file
		roles.GET("/template", h.DownloadRolesTemplate)

		// Import operations (JSON-based)
		roles.POST("/import/validate", h.ValidateRoleImport)
		roles.POST("/import", h.BulkRoleImport)
	}
}
