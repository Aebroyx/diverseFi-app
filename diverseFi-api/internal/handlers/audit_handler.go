package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
)

type AuditHandler struct {
	auditService *services.AuditService
}

func NewAuditHandler(auditService *services.AuditService) *AuditHandler {
	return &AuditHandler{
		auditService: auditService,
	}
}

// GetAuditLogs retrieves audit logs with filtering and pagination
// GET /api/audit/logs
func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	var params models.AuditLogQueryParams

	// Bind query parameters
	if err := c.ShouldBindQuery(&params); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid query parameters", common.CodeValidationError, err.Error())
		return
	}

	// Parse userID if provided
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		userID, err := strconv.ParseUint(userIDStr, 10, 32)
		if err != nil {
			common.SendError(c, http.StatusBadRequest, "Invalid user_id", common.CodeValidationError, err.Error())
			return
		}
		uid := uint(userID)
		params.UserID = &uid
	}

	// Parse date range if provided
	if startDateStr := c.Query("start_date"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			common.SendError(c, http.StatusBadRequest, "Invalid start_date format (expected RFC3339)", common.CodeValidationError, err.Error())
			return
		}
		params.StartDate = startDate
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			common.SendError(c, http.StatusBadRequest, "Invalid end_date format (expected RFC3339)", common.CodeValidationError, err.Error())
			return
		}
		params.EndDate = endDate
	}

	// Get audit logs
	result, err := h.auditService.GetAuditLogs(&params)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to retrieve audit logs", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Audit logs retrieved successfully", result)
}

// GetUserAuditLogs retrieves audit logs for a specific user
// GET /api/audit/logs/user/:userId
func (h *AuditHandler) GetUserAuditLogs(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid user ID", common.CodeValidationError, err.Error())
		return
	}

	// Get pagination parameters
	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Get audit logs for user
	result, err := h.auditService.GetUserAuditLogs(uint(userID), page, limit)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to retrieve user audit logs", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "User audit logs retrieved successfully", result)
}

// GetResourceAuditLogs retrieves audit logs for a specific resource
// GET /api/audit/logs/:resourceType/:resourceId
func (h *AuditHandler) GetResourceAuditLogs(c *gin.Context) {
	resourceType := c.Param("resourceType")
	resourceID := c.Param("resourceId")

	if resourceType == "" || resourceID == "" {
		common.SendError(c, http.StatusBadRequest, "Resource type and ID are required", common.CodeBadRequest, nil)
		return
	}

	// Get pagination parameters
	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Get audit logs for resource
	result, err := h.auditService.GetResourceAuditLogs(resourceType, resourceID, page, limit)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to retrieve resource audit logs", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Resource audit logs retrieved successfully", result)
}
