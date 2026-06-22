package routes

import (
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// RegisterAuditRoutes registers audit log routes (all protected)
func RegisterAuditRoutes(router *gin.RouterGroup, h *handlers.AuditHandler) {
	audit := router.Group("/audit")
	{
		audit.GET("/logs", h.GetAuditLogs)
		audit.GET("/logs/user/:userId", h.GetUserAuditLogs)
		audit.GET("/logs/:resourceType/:resourceId", h.GetResourceAuditLogs)
	}
}
