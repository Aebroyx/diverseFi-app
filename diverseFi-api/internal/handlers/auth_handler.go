package handlers

import (
	"net/http"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/Aebroyx/diverseFi-api/internal/validators"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	userService  *services.UserService
	auditService *services.AuditService
	validate     *validator.Validate
}

func NewAuthHandler(userService *services.UserService, auditService *services.AuditService) *AuthHandler {
	validate := validator.New()
	// Register custom validators
	if err := validators.RegisterCustomValidators(validate); err != nil {
		panic(err)
	}
	return &AuthHandler{
		userService:  userService,
		auditService: auditService,
		validate:     validate,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	// Using Gin's context
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
		return
	}

	// Register user
	user, err := h.userService.Register(&req)
	if err != nil {
		switch err.Error() {
		case "username already exists":
			c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		case "email already exists":
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	// Return success response
	c.JSON(http.StatusCreated, user)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
		return
	}

	// Login user with context (IP and UserAgent for tracking)
	response, err := h.userService.LoginWithContext(&req, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		// Log failed login attempt
		go h.logLoginAttempt(c, req.Username, 0, false)

		switch err.Error() {
		case "invalid username or password":
			common.SendError(c, http.StatusBadRequest, "Invalid username or password", common.CodeBadRequest, nil)
		case "user is not active":
			common.SendError(c, http.StatusForbidden, "User is not active", common.CodeForbidden, nil)
		default:
			common.SendError(c, http.StatusInternalServerError, "Internal server error", common.CodeInternalError, nil)
		}
		return
	}

	// Log successful login
	go h.logLoginAttempt(c, response.User.Username, response.User.ID, true)

	// Set access token cookie
	c.SetCookie(
		"access_token",
		response.Token.AccessToken,
		int(response.Token.ExpiresIn),
		"/",   // path
		"",    // domain (empty for current domain)
		false, // secure (set to false for development)
		true,  // httpOnly
	)

	// Set refresh token cookie (7 days)
	c.SetCookie(
		"refresh_token",
		response.Token.RefreshToken,
		int(7*24*time.Hour.Seconds()), // 7 days
		"/",                           // path
		"",                            // domain (empty for current domain)
		false,                         // secure (set to false for development)
		true,                          // httpOnly
	)

	// Return user data only (tokens are in cookies)
	c.JSON(http.StatusOK, gin.H{
		"user": response.User,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Get user info from context (set by auth middleware)
	var userID uint
	var username string

	if uid, exists := c.Get("user_id"); exists {
		if uidUint, ok := uid.(uint); ok {
			userID = uidUint
		}
	}

	if uname, exists := c.Get("username"); exists {
		if unameStr, ok := uname.(string); ok {
			username = unameStr
		}
	}

	// Log logout action
	if userID > 0 {
		go h.logLogoutAction(c, userID, username)
	}

	// Clear access token cookie by setting it to expire immediately
	c.SetCookie(
		"access_token",
		"",
		-1,    // MaxAge -1 means delete immediately
		"/",   // path
		"",    // domain (empty for current domain)
		false, // secure (set to false for development)
		true,  // httpOnly
	)

	// Clear refresh token cookie
	c.SetCookie(
		"refresh_token",
		"",
		-1,    // MaxAge -1 means delete immediately
		"/",   // path
		"",    // domain (empty for current domain)
		false, // secure (set to false for development)
		true,  // httpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// logLoginAttempt logs login attempts (both successful and failed)
func (h *AuthHandler) logLoginAttempt(c *gin.Context, username string, userID uint, success bool) {
	if h.auditService == nil {
		return
	}

	action := "LOGIN_SUCCESS"
	if !success {
		action = "LOGIN_FAILED"
	}

	correlationID := ""
	if cid, exists := c.Get("correlation_id"); exists {
		if cidStr, ok := cid.(string); ok {
			correlationID = cidStr
		}
	}

	var uid *uint
	if success && userID > 0 {
		uid = &userID
	}

	req := &models.CreateAuditLogRequest{
		UserID:        uid,
		Username:      username,
		Action:        action,
		ResourceType:  "auth",
		ResourceID:    "",
		IPAddress:     c.ClientIP(),
		UserAgent:     c.Request.UserAgent(),
		CorrelationID: correlationID,
	}

	_ = h.auditService.Log(req)
}

// logLogoutAction logs logout actions
func (h *AuthHandler) logLogoutAction(c *gin.Context, userID uint, username string) {
	if h.auditService == nil {
		return
	}

	correlationID := ""
	if cid, exists := c.Get("correlation_id"); exists {
		if cidStr, ok := cid.(string); ok {
			correlationID = cidStr
		}
	}

	req := &models.CreateAuditLogRequest{
		UserID:        &userID,
		Username:      username,
		Action:        "LOGOUT",
		ResourceType:  "auth",
		ResourceID:    "",
		IPAddress:     c.ClientIP(),
		UserAgent:     c.Request.UserAgent(),
		CorrelationID: correlationID,
	}

	_ = h.auditService.Log(req)
}
