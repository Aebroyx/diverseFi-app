package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterRightsAccessRoutes registers permission override routes
func RegisterRightsAccessRoutes(router *gin.RouterGroup, h *handlers.RightsAccessHandler) {
	ra := router.Group("/rights-access")
	{
		// Get all permission overrides for a user
		ra.GET("/user/:userId", h.GetUserRightsAccess)

		// Get specific permission override
		ra.GET("/user/:userId/menu/:menuId", h.GetUserMenuRightsAccess)

		// Create or update permission override
		ra.POST("", h.CreateOrUpdateRightsAccess)

		// Bulk save permission overrides for a user
		ra.POST("/user/:userId/bulk", h.BulkSaveUserRightsAccess)

		// Delete all permission overrides for a user
		ra.DELETE("/user/:userId", h.DeleteAllUserRightsAccess)

		// Delete permission override
		ra.DELETE("/:id", h.DeleteRightsAccess)
	}
}
