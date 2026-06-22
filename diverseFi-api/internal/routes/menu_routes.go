package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterMenuRoutes registers menu management routes
func RegisterMenuRoutes(router *gin.RouterGroup, h *handlers.MenuHandler) {
	// List menus
	router.GET("/menus", h.GetAllMenus)
	router.GET("/menus/tree", h.GetMenuTree)
	router.GET("/menus/user", h.GetUserMenus) // Get current user's accessible menus with permissions

	// Single menu operations
	menu := router.Group("/menu")
	{
		menu.GET("/:id", h.GetMenuByID)
		menu.POST("/create", h.CreateMenu)
		menu.PUT("/:id", h.UpdateMenu)
		menu.DELETE("/:id", h.DeleteMenu)
	}
}
