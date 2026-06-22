package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterRoleRoutes registers role management routes
func RegisterRoleRoutes(router *gin.RouterGroup, h *handlers.RoleHandler) {
	// List roles
	router.GET("/roles", h.GetAllRoles)
	router.GET("/roles/active", h.GetActiveRoles)

	// Single role operations
	role := router.Group("/role")
	{
		role.GET("/:id", h.GetRoleByID)
		role.POST("/create", h.CreateRole)
		role.PUT("/:id", h.UpdateRole)
		role.DELETE("/:id", h.DeleteRole)

		// Role-Menu assignments
		role.GET("/:id/menus", h.GetRoleMenus)
		role.POST("/:id/menus", h.AssignMenusToRole)
		role.DELETE("/:id/menus/:menuId", h.RemoveMenuFromRole)
	}
}
