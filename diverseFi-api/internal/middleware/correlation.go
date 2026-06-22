package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const CorrelationIDKey = "correlation_id"

// CorrelationID middleware adds a unique correlation ID to each request
func CorrelationID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if correlation ID already exists in request header
		correlationID := c.GetHeader("X-Correlation-ID")

		// If not, generate a new one
		if correlationID == "" {
			correlationID = uuid.New().String()
		}

		// Set correlation ID in context for use in handlers
		c.Set(CorrelationIDKey, correlationID)

		// Set correlation ID in response header
		c.Writer.Header().Set("X-Correlation-ID", correlationID)

		c.Next()
	}
}

// GetCorrelationID retrieves the correlation ID from the context
func GetCorrelationID(c *gin.Context) string {
	if correlationID, exists := c.Get(CorrelationIDKey); exists {
		if id, ok := correlationID.(string); ok {
			return id
		}
	}
	return ""
}
