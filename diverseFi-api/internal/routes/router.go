package routes

import (
	"log"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/handlers"
	"github.com/Aebroyx/diverseFi-api/internal/middleware"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handlers holds all handler instances
type Handlers struct {
	Auth          *handlers.AuthHandler
	User          *handlers.UserHandler
	UserImport    *handlers.UserImportHandler
	Role          *handlers.RoleHandler
	RoleImport    *handlers.RoleImportHandler
	Menu          *handlers.MenuHandler
	MenuImport    *handlers.MenuImportHandler
	RightsAccess  *handlers.RightsAccessHandler
	Search        *handlers.SearchHandler
	Token         *handlers.TokenHandler
	Audit         *handlers.AuditHandler
	Email         *handlers.EmailHandler
	EmailTemplate *handlers.EmailTemplateHandler
}

// Services holds all service instances needed by the router
type Services struct {
	Permission  *services.PermissionService
	Audit       *services.AuditService
	RateLimiter *services.RateLimiterService
}

// SetupRouter initializes the Gin router with all routes and middleware
func SetupRouter(cfg *config.Config, db *gorm.DB, h *Handlers, svc *Services) *gin.Engine {
	router := gin.New()

	// Add logger middleware
	router.Use(gin.Logger())

	// Add recovery middleware
	router.Use(gin.Recovery())

	// Add correlation ID middleware
	router.Use(middleware.CorrelationID())

	// Add CORS middleware
	router.Use(corsMiddleware(cfg))

	// API group
	api := router.Group("/api")

	// Register public routes with rate limiting
	registerPublicRoutes(api, h, svc)

	// Register protected routes
	protected := api.Group("")
	protected.Use(middleware.Auth(cfg.JWTSecret, db))
	protected.Use(middleware.RateLimitByUser(svc.RateLimiter))
	protected.Use(middleware.Permission(svc.Permission))
	protected.Use(middleware.AuditLogger(svc.Audit))
	registerProtectedRoutes(protected, h)

	return router
}

// corsMiddleware returns a CORS middleware handler
func corsMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Log incoming request
		log.Printf("Incoming request: %s %s", c.Request.Method, c.Request.URL.Path)

		// Get allowed origins from config
		allowedOrigin := cfg.CORSAllowedOrigins
		if allowedOrigin == "" {
			allowedOrigin = "http://localhost:3001" // fallback
		}

		// Set CORS headers
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

		// Handle preflight
		if c.Request.Method == "OPTIONS" {
			log.Printf("Handling OPTIONS request for: %s", c.Request.URL.Path)
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// registerPublicRoutes registers all public routes (no authentication required)
func registerPublicRoutes(router *gin.RouterGroup, h *Handlers, svc *Services) {
	// Auth routes with rate limiting
	authGroup := router.Group("/auth")
	authGroup.Use(middleware.RateLimitByIP(svc.RateLimiter))
	{
		// Public auth endpoints
		authGroup.POST("/register", h.Auth.Register)
		authGroup.POST("/login", h.Auth.Login)
		authGroup.POST("/refresh-token", h.Token.RefreshToken)
	}
}

// registerProtectedRoutes registers all protected routes (authentication required)
func registerProtectedRoutes(router *gin.RouterGroup, h *Handlers) {
	RegisterAuthProtectedRoutes(router, h.Auth)
	RegisterTokenRoutes(router, h.Token)
	RegisterAuditRoutes(router, h.Audit)
	RegisterUserRoutes(router, h.User)
	RegisterUserImportRoutes(router, h.UserImport)
	RegisterRoleRoutes(router, h.Role)
	RegisterRoleImportRoutes(router, h.RoleImport)
	RegisterMenuRoutes(router, h.Menu)
	RegisterMenuImportRoutes(router, h.MenuImport)
	RegisterRightsAccessRoutes(router, h.RightsAccess)
	RegisterSearchRoutes(router, h.Search)
	RegisterEmailRoutes(router, h.Email)
	RegisterEmailTemplateRoutes(router, h.EmailTemplate)
}
