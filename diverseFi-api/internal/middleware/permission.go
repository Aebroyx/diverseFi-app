package middleware

import (
	"log"
	"net/http"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
)

const (
	// Context key for storing user permissions
	UserPermissionsKey = "userPermissions"
)

// Permission returns a middleware that checks user permissions for protected routes
func Permission(permService *services.PermissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		path := c.Request.URL.Path

		// Skip OPTIONS requests (CORS preflight)
		if method == "OPTIONS" {
			c.Next()
			return
		}

		// Check if route is whitelisted
		if services.IsWhitelisted(method, path) {
			log.Printf("Permission middleware: route %s %s is whitelisted, skipping check", method, path)
			c.Next()
			return
		}

		// Find permission requirement for this route
		routePerm, found := services.FindRoutePermission(method, path)
		if !found {
			// If no permission mapping exists, allow the request
			// This handles routes not explicitly configured
			log.Printf("Permission middleware: no permission mapping for %s %s, allowing", method, path)
			c.Next()
			return
		}

		// Get user from context (set by Auth middleware)
		userVal, exists := c.Get("user")
		if !exists {
			log.Printf("Permission middleware: user not found in context")
			common.SendError(c, http.StatusUnauthorized, "User not authenticated", common.CodeUnauthorized, nil)
			c.Abort()
			return
		}

		user, ok := userVal.(models.RegisterResponse)
		if !ok {
			log.Printf("Permission middleware: invalid user type in context")
			common.SendError(c, http.StatusInternalServerError, "Internal server error", common.CodeInternalError, nil)
			c.Abort()
			return
		}

		// Get roleID from context
		roleIDVal, exists := c.Get("roleID")
		if !exists {
			log.Printf("Permission middleware: roleID not found in context")
			common.SendError(c, http.StatusUnauthorized, "User role not found", common.CodeUnauthorized, nil)
			c.Abort()
			return
		}

		roleID, ok := roleIDVal.(uint)
		if !ok {
			log.Printf("Permission middleware: invalid roleID type in context")
			common.SendError(c, http.StatusInternalServerError, "Internal server error", common.CodeInternalError, nil)
			c.Abort()
			return
		}

		// Check if user permissions are already cached in context
		var userPerms *services.UserPermissions
		if cached, exists := c.Get(UserPermissionsKey); exists {
			userPerms = cached.(*services.UserPermissions)
		} else {
			// Fetch user permissions
			var err error
			userPerms, err = permService.GetUserPermissions(user.ID, roleID)
			if err != nil {
				log.Printf("Permission middleware: failed to get permissions for user %d: %v", user.ID, err)
				common.SendError(c, http.StatusInternalServerError, "Failed to check permissions", common.CodeInternalError, nil)
				c.Abort()
				return
			}
			// Cache in context for subsequent checks in same request
			c.Set(UserPermissionsKey, userPerms)
		}

		// Check if user has the required permission
		if !userPerms.CheckPermission(routePerm.MenuPath, routePerm.Permission) {
			log.Printf("Permission middleware: user %d denied %s permission for %s", user.ID, routePerm.Permission, routePerm.MenuPath)
			common.SendError(c, http.StatusForbidden, "You do not have permission to perform this action", common.CodeForbidden, map[string]any{
				"required_permission": routePerm.Permission,
				"menu_path":           routePerm.MenuPath,
			})
			c.Abort()
			return
		}

		log.Printf("Permission middleware: user %d granted %s permission for %s", user.ID, routePerm.Permission, routePerm.MenuPath)
		c.Next()
	}
}
