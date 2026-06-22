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

type RoleImportHandler struct {
	roleImportService *services.RoleImportService
	validate          *validator.Validate
}

func NewRoleImportHandler(roleImportService *services.RoleImportService) *RoleImportHandler {
	return &RoleImportHandler{
		roleImportService: roleImportService,
		validate:          validator.New(),
	}
}

// ExportRolesToExcel handles GET /api/roles/export - returns Excel file
func (h *RoleImportHandler) ExportRolesToExcel(c *gin.Context) {
	// Get roles data
	rolesData, err := h.roleImportService.GetRolesForExport()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch roles", common.CodeInternalError, err.Error())
		return
	}

	// Generate Excel file with excelize
	excelFile, err := h.roleImportService.GenerateRolesExcel(rolesData.Roles)
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
	filename := fmt.Sprintf("roles-export-%s.xlsx", time.Now().Format("2006-01-02"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Length", fmt.Sprintf("%d", buffer.Len()))

	// Send file
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// DownloadRolesTemplate handles GET /api/roles/template - returns template Excel file
func (h *RoleImportHandler) DownloadRolesTemplate(c *gin.Context) {
	// Generate template with excelize
	template, err := h.roleImportService.GenerateRolesTemplateExcel()
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
	c.Header("Content-Disposition", "attachment; filename=\"roles-import-template.xlsx\"")
	c.Header("Content-Length", fmt.Sprintf("%d", buffer.Len()))

	// Send file
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// ValidateRoleImport handles POST /api/roles/import/validate
func (h *RoleImportHandler) ValidateRoleImport(c *gin.Context) {
	var req models.ValidateRoleImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	response, err := h.roleImportService.ValidateRoleImport(&req)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to validate import data", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Validation completed", response)
}

// BulkRoleImport handles POST /api/roles/import
func (h *RoleImportHandler) BulkRoleImport(c *gin.Context) {
	var req models.BulkRoleImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	response, err := h.roleImportService.BulkRoleImport(&req)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to import roles", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Import completed", response)
}
