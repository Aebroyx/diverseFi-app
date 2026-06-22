package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type EmailHandler struct {
	emailService *services.EmailService
	validate     *validator.Validate
}

func NewEmailHandler(emailService *services.EmailService) *EmailHandler {
	return &EmailHandler{
		emailService: emailService,
		validate:     validator.New(),
	}
}

// SendEmail handles POST /api/email/send
func (h *EmailHandler) SendEmail(c *gin.Context) {
	var req models.SendEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	// Get user info from context
	var userID *uint
	var username string

	if uid, exists := c.Get("user_id"); exists {
		id := uid.(uint)
		userID = &id
	}
	if uname, exists := c.Get("username"); exists {
		username = uname.(string)
	}

	// Get client IP
	ipAddress := c.ClientIP()

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	response, err := h.emailService.SendEmail(ctx, &req, userID, username, ipAddress)
	if err != nil {
		// Determine appropriate status code based on error
		statusCode := http.StatusInternalServerError
		errorCode := common.CodeInternalError

		switch {
		case err.Error() == "email service is disabled":
			statusCode = http.StatusServiceUnavailable
			errorCode = "EMAIL_DISABLED"
		case err.Error() == "rate limit exceeded: too many emails per minute",
			err.Error() == "rate limit exceeded: too many emails per hour":
			statusCode = http.StatusTooManyRequests
			errorCode = "RATE_LIMIT_EXCEEDED"
		case err.Error() == "template not found":
			statusCode = http.StatusNotFound
			errorCode = common.CodeNotFound
		case err.Error() == "subject is required when not using a template",
			err.Error() == "html_content or text_content is required when not using a template":
			statusCode = http.StatusBadRequest
			errorCode = common.CodeValidationError
		case err.Error() == "email service not configured: missing API key":
			statusCode = http.StatusServiceUnavailable
			errorCode = "EMAIL_NOT_CONFIGURED"
		}

		// If we have a partial response (log created but send failed), include it
		if response != nil {
			common.SendError(c, statusCode, err.Error(), errorCode, response)
			return
		}

		common.SendError(c, statusCode, err.Error(), errorCode, nil)
		return
	}

	common.SendSuccess(c, http.StatusOK, "Email sent successfully", response)
}

// GetEmailLogs handles GET /api/email/logs
func (h *EmailHandler) GetEmailLogs(c *gin.Context) {
	var params pagination.QueryParams
	if err := params.Bind(c); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid query parameters", common.CodeInvalidRequest, err.Error())
		return
	}

	response, err := h.emailService.GetEmailLogs(params)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch email logs", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Email logs fetched successfully", response)
}

// GetEmailLogByID handles GET /api/email/log/:id
func (h *EmailHandler) GetEmailLogByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid log ID", common.CodeInvalidRequest, nil)
		return
	}

	emailLog, err := h.emailService.GetEmailLogByID(uint(id))
	if err != nil {
		if err.Error() == "email log not found" {
			common.SendError(c, http.StatusNotFound, "Email log not found", common.CodeNotFound, nil)
			return
		}
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch email log", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Email log fetched successfully", h.emailService.ToLogResponse(emailLog))
}

// SendTestEmail handles POST /api/email/send-test
func (h *EmailHandler) SendTestEmail(c *gin.Context) {
	// Get user info from context
	var userID *uint
	var username string

	if uid, exists := c.Get("user_id"); exists {
		id := uid.(uint)
		userID = &id
	}
	if uname, exists := c.Get("username"); exists {
		username = uname.(string)
	}

	// Get client IP
	ipAddress := c.ClientIP()

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	response, err := h.emailService.SendTestEmail(ctx, userID, username, ipAddress)
	if err != nil {
		// Determine appropriate status code based on error
		statusCode := http.StatusInternalServerError
		errorCode := common.CodeInternalError

		switch {
		case err.Error() == "email service is disabled":
			statusCode = http.StatusServiceUnavailable
			errorCode = "EMAIL_DISABLED"
		case err.Error() == "rate limit exceeded: too many emails per minute",
			err.Error() == "rate limit exceeded: too many emails per hour":
			statusCode = http.StatusTooManyRequests
			errorCode = "RATE_LIMIT_EXCEEDED"
		case err.Error() == "email service not configured: missing API key":
			statusCode = http.StatusServiceUnavailable
			errorCode = "EMAIL_NOT_CONFIGURED"
		case err.Error() == "test email address not configured":
			statusCode = http.StatusServiceUnavailable
			errorCode = "TEST_EMAIL_NOT_CONFIGURED"
		}

		// If we have a partial response (log created but send failed), include it
		if response != nil {
			common.SendError(c, statusCode, err.Error(), errorCode, response)
			return
		}

		common.SendError(c, statusCode, err.Error(), errorCode, nil)
		return
	}

	common.SendSuccess(c, http.StatusOK, "Test email sent successfully", response)
}
