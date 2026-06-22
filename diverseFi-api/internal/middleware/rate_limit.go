package middleware

import (
	"fmt"
	"net/http"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
)

// RateLimitByIP creates a middleware that rate limits requests by IP address
func RateLimitByIP(rateLimiter *services.RateLimiterService) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		// Check rate limit
		allowed, resetDuration, err := rateLimiter.CheckIPLimit(ip)
		if !allowed {
			// Set rate limit headers
			c.Writer.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rateLimiter.Config.RateLimitPerIP))
			c.Writer.Header().Set("X-RateLimit-Remaining", "0")
			c.Writer.Header().Set("Retry-After", fmt.Sprintf("%.0f", resetDuration.Seconds()))

			common.SendError(c, http.StatusTooManyRequests, err.Error(), "RATE_LIMIT_EXCEEDED", nil)
			c.Abort()
			return
		}

		// Record the request
		rateLimiter.RecordIPRequest(ip)

		// Get current stats
		count, resetAt := rateLimiter.GetIPStats(ip)

		// Set rate limit headers
		c.Writer.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rateLimiter.Config.RateLimitPerIP))
		c.Writer.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", rateLimiter.Config.RateLimitPerIP-count))
		c.Writer.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", resetAt.Unix()))

		c.Next()
	}
}

// RateLimitByUser creates a middleware that rate limits requests by user ID
func RateLimitByUser(rateLimiter *services.RateLimiterService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userID, exists := c.Get("user_id")
		if !exists {
			// If no user ID, skip rate limiting (for public routes)
			c.Next()
			return
		}

		userIDUint, ok := userID.(uint)
		if !ok {
			c.Next()
			return
		}

		// Check rate limit
		allowed, resetDuration, err := rateLimiter.CheckUserLimit(userIDUint)
		if !allowed {
			// Set rate limit headers
			c.Writer.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rateLimiter.Config.RateLimitPerUser))
			c.Writer.Header().Set("X-RateLimit-Remaining", "0")
			c.Writer.Header().Set("Retry-After", fmt.Sprintf("%.0f", resetDuration.Seconds()))

			common.SendError(c, http.StatusTooManyRequests, err.Error(), "RATE_LIMIT_EXCEEDED", nil)
			c.Abort()
			return
		}

		// Record the request
		rateLimiter.RecordUserRequest(userIDUint)

		// Get current stats
		count, resetAt := rateLimiter.GetUserStats(userIDUint)

		// Set rate limit headers
		c.Writer.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rateLimiter.Config.RateLimitPerUser))
		c.Writer.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", rateLimiter.Config.RateLimitPerUser-count))
		c.Writer.Header().Set("X-RateLimit-Reset", fmt.Sprintf("%d", resetAt.Unix()))

		c.Next()
	}
}
