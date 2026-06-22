package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterSearchRoutes registers all search-related routes
func RegisterSearchRoutes(router *gin.RouterGroup, searchHandler *handlers.SearchHandler) {
	search := router.Group("/search")
	{
		search.GET("/global", searchHandler.GlobalSearch)
	}
}
