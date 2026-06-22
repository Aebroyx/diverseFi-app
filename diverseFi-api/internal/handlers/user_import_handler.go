package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserImportHandler struct {
	userImportService *services.UserImportService
	validate          *validator.Validate
}

func NewUserImportHandler(userImportService *services.UserImportService) *UserImportHandler {
	return &UserImportHandler{
		userImportService: userImportService,
		validate:          validator.New(),
	}
}

// ExportUsersToExcel handles GET /api/users/export - returns Excel file
func (h *UserImportHandler) ExportUsersToExcel(c *gin.Context) {
	// Get users data
	usersData, err := h.userImportService.GetUsersForExport()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch users", common.CodeInternalError, err.Error())
		return
	}

	// Generate Excel file with excelize
	excelFile, err := h.userImportService.GenerateUsersExcel(usersData.Users)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to generate Excel file", common.CodeInternalError, err.Error())
		return
	}

	// Write to buffer
	buffer, err := excelFile.WriteToBuffer()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to write Excel file", common.CodeInternalError, err.Error())
		return
	}

	// Set headers for file download
	filename := fmt.Sprintf("users-export-%s.xlsx", time.Now().Format("2006-01-02"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Length", fmt.Sprintf("%d", buffer.Len()))

	// Send file
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// DownloadTemplate handles GET /api/users/template - returns template Excel file
func (h *UserImportHandler) DownloadTemplate(c *gin.Context) {
	// Generate template with excelize
	template, err := h.userImportService.GenerateTemplateExcel()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to generate template", common.CodeInternalError, err.Error())
		return
	}

	// Write to buffer
	buffer, err := template.WriteToBuffer()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to write template", common.CodeInternalError, err.Error())
		return
	}

	// Set headers
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename=\"users-import-template.xlsx\"")
	c.Header("Content-Length", fmt.Sprintf("%d", buffer.Len()))

	// Send file
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// ValidateImport handles POST /api/users/import/validate
func (h *UserImportHandler) ValidateImport(c *gin.Context) {
	var req models.ValidateImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	response, err := h.userImportService.ValidateImport(&req)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to validate import data", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Validation completed", response)
}

// BulkImport handles POST /api/users/import
func (h *UserImportHandler) BulkImport(c *gin.Context) {
	var req models.BulkImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	response, err := h.userImportService.BulkImport(&req)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to import users", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Import completed", response)
}
