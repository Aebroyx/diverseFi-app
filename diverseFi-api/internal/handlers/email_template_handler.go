package handlers

import (
	"net/http"
	"strconv"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type EmailTemplateHandler struct {
	templateService *services.EmailTemplateService
	validate        *validator.Validate
}

func NewEmailTemplateHandler(templateService *services.EmailTemplateService) *EmailTemplateHandler {
	return &EmailTemplateHandler{
		templateService: templateService,
		validate:        validator.New(),
	}
}

// GetAllTemplates handles GET /api/email-templates
func (h *EmailTemplateHandler) GetAllTemplates(c *gin.Context) {
	var params pagination.QueryParams
	if err := params.Bind(c); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid query parameters", common.CodeInvalidRequest, err.Error())
		return
	}

	response, err := h.templateService.GetAllTemplates(params)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch email templates", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Email templates fetched successfully", response)
}

// GetCategories handles GET /api/email-templates/categories
func (h *EmailTemplateHandler) GetCategories(c *gin.Context) {
	categories, err := h.templateService.GetCategories()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch categories", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Categories fetched successfully", categories)
}

// GetTemplateByID handles GET /api/email-template/:id
func (h *EmailTemplateHandler) GetTemplateByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid template ID", common.CodeInvalidRequest, nil)
		return
	}

	template, err := h.templateService.GetTemplateByID(uint(id))
	if err != nil {
		if err.Error() == "email template not found" {
			common.SendError(c, http.StatusNotFound, "Email template not found", common.CodeNotFound, nil)
			return
		}
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch email template", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Email template fetched successfully", h.templateService.ToResponse(template))
}

// CreateTemplate handles POST /api/email-template/create
func (h *EmailTemplateHandler) CreateTemplate(c *gin.Context) {
	var req models.CreateEmailTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		common.SendError(c, http.StatusUnauthorized, "User not authenticated", common.CodeUnauthorized, nil)
		return
	}

	template, err := h.templateService.CreateTemplate(&req, userID.(uint))
	if err != nil {
		if err.Error() == "template name already exists" {
			common.SendError(c, http.StatusConflict, "Template name already exists", common.CodeConflict, nil)
			return
		}
		common.SendError(c, http.StatusInternalServerError, "Failed to create email template", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusCreated, "Email template created successfully", h.templateService.ToResponse(template))
}

// UpdateTemplate handles PUT /api/email-template/:id
func (h *EmailTemplateHandler) UpdateTemplate(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid template ID", common.CodeInvalidRequest, nil)
		return
	}

	var req models.UpdateEmailTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		common.SendError(c, http.StatusUnauthorized, "User not authenticated", common.CodeUnauthorized, nil)
		return
	}

	template, err := h.templateService.UpdateTemplate(uint(id), &req, userID.(uint))
	if err != nil {
		if err.Error() == "email template not found" {
			common.SendError(c, http.StatusNotFound, "Email template not found", common.CodeNotFound, nil)
			return
		}
		common.SendError(c, http.StatusInternalServerError, "Failed to update email template", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Email template updated successfully", h.templateService.ToResponse(template))
}

// DeleteTemplate handles DELETE /api/email-template/:id
func (h *EmailTemplateHandler) DeleteTemplate(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid template ID", common.CodeInvalidRequest, nil)
		return
	}

	if err := h.templateService.DeleteTemplate(uint(id)); err != nil {
		if err.Error() == "email template not found" {
			common.SendError(c, http.StatusNotFound, "Email template not found", common.CodeNotFound, nil)
			return
		}
		common.SendError(c, http.StatusInternalServerError, "Failed to delete email template", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Email template deleted successfully", nil)
}
