package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"strconv"

	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
)

// AuditLogger middleware automatically logs mutating requests (POST, PUT, DELETE)
func AuditLogger(auditService *services.AuditService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only log mutating operations
		method := c.Request.Method
		if method != "POST" && method != "PUT" && method != "DELETE" {
			c.Next()
			return
		}

		// Capture request body
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			// Restore the body so handlers can read it
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// Continue processing the request
		c.Next()

		// Only log successful requests (2xx status codes)
		if c.Writer.Status() < 200 || c.Writer.Status() >= 300 {
			return
		}

		// Extract user info from context (set by auth middleware)
		var userID *uint
		var username string

		if uid, exists := c.Get("user_id"); exists {
			if uidUint, ok := uid.(uint); ok {
				userID = &uidUint
			}
		}

		if uname, exists := c.Get("username"); exists {
			if unameStr, ok := uname.(string); ok {
				username = unameStr
			}
		}

		// Determine action based on method
		action := determineAction(method)

		// Determine resource type and ID from path
		resourceType, resourceID := extractResourceInfo(c)

		// Get correlation ID
		correlationID := GetCorrelationID(c)

		// Get IP and User Agent
		ipAddress := c.ClientIP()
		userAgent := c.Request.UserAgent()

		// Parse request body as new values
		var newValues string
		if len(requestBody) > 0 {
			// Sanitize sensitive fields before logging
			var bodyMap map[string]interface{}
			if err := json.Unmarshal(requestBody, &bodyMap); err == nil {
				sanitizePassword(bodyMap)
				if sanitizedJSON, err := json.Marshal(bodyMap); err == nil {
					newValues = string(sanitizedJSON)
				}
			}
		}

		// Create audit log entry
		go func() {
			_ = auditService.Log(&models.CreateAuditLogRequest{
				UserID:        userID,
				Username:      username,
				Action:        action,
				ResourceType:  resourceType,
				ResourceID:    resourceID,
				OldValues:     "", // Could be populated for UPDATE operations if needed
				NewValues:     newValues,
				IPAddress:     ipAddress,
				UserAgent:     userAgent,
				CorrelationID: correlationID,
			})
		}()
	}
}

// determineAction maps HTTP methods to audit actions
func determineAction(method string) string {
	switch method {
	case "POST":
		return "CREATE"
	case "PUT":
		return "UPDATE"
	case "DELETE":
		return "DELETE"
	default:
		return method
	}
}

// extractResourceInfo extracts resource type and ID from the request path
func extractResourceInfo(c *gin.Context) (string, string) {
	path := c.FullPath()

	// Common patterns:
	// /api/users -> users, ""
	// /api/users/:id -> users, "123"
	// /api/roles/:id/permissions -> roles, "123"

	// Simple extraction based on path segments
	if c.Param("id") != "" {
		resourceID := c.Param("id")

		// Try to extract resource type from path
		// For example: /api/users/:id -> users
		if len(path) > 5 {
			// Remove /api/ prefix and extract the first segment
			parts := splitPath(path)
			if len(parts) > 1 {
				return parts[1], resourceID
			}
		}
		return "unknown", resourceID
	}

	// For POST requests without :id in path
	parts := splitPath(path)
	if len(parts) > 1 {
		return parts[1], ""
	}

	return "unknown", ""
}

// splitPath splits a path into segments, removing empty segments
func splitPath(path string) []string {
	var segments []string
	start := 0

	for i := 0; i < len(path); i++ {
		if path[i] == '/' {
			if i > start {
				segments = append(segments, path[start:i])
			}
			start = i + 1
		}
	}

	if start < len(path) {
		segments = append(segments, path[start:])
	}

	return segments
}

// sanitizePassword removes password fields from the map
func sanitizePassword(data map[string]interface{}) {
	sensitiveFields := []string{"password", "current_password", "new_password", "password_confirmation"}

	for _, field := range sensitiveFields {
		if _, exists := data[field]; exists {
			data[field] = "[REDACTED]"
		}
	}
}

// AuditAction manually logs a specific action (for complex operations)
func AuditAction(c *gin.Context, auditService *services.AuditService, action, resourceType, resourceID string, oldValues, newValues interface{}) {
	var userID *uint
	var username string

	if uid, exists := c.Get("user_id"); exists {
		if uidUint, ok := uid.(uint); ok {
			userID = &uidUint
		}
	}

	if uname, exists := c.Get("username"); exists {
		if unameStr, ok := uname.(string); ok {
			username = unameStr
		}
	}

	correlationID := GetCorrelationID(c)
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	go func() {
		_ = auditService.LogWithContext(
			userID,
			username,
			action,
			resourceType,
			resourceID,
			oldValues,
			newValues,
			ipAddress,
			userAgent,
			correlationID,
		)
	}()
}

// Helper to convert uint to string for resource ID
func uintToString(id uint) string {
	return strconv.FormatUint(uint64(id), 10)
}

// LogLoginAction logs user login actions
func LogLoginAction(c *gin.Context, auditService *services.AuditService, userID uint, username string, success bool) {
	action := "LOGIN_SUCCESS"
	if !success {
		action = "LOGIN_FAILED"
	}

	correlationID := GetCorrelationID(c)
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	var uid *uint
	if success {
		uid = &userID
	}

	go func() {
		_ = auditService.Log(&models.CreateAuditLogRequest{
			UserID:        uid,
			Username:      username,
			Action:        action,
			ResourceType:  "auth",
			ResourceID:    uintToString(userID),
			IPAddress:     ipAddress,
			UserAgent:     userAgent,
			CorrelationID: correlationID,
		})
	}()
}

// LogLogoutAction logs user logout actions
func LogLogoutAction(c *gin.Context, auditService *services.AuditService, userID uint, username string) {
	correlationID := GetCorrelationID(c)
	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	go func() {
		_ = auditService.Log(&models.CreateAuditLogRequest{
			UserID:        &userID,
			Username:      username,
			Action:        "LOGOUT",
			ResourceType:  "auth",
			ResourceID:    fmt.Sprintf("%d", userID),
			IPAddress:     ipAddress,
			UserAgent:     userAgent,
			CorrelationID: correlationID,
		})
	}()
}
