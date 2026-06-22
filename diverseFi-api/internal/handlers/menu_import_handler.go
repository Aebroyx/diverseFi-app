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

type MenuImportHandler struct {
	menuImportService *services.MenuImportService
	validate          *validator.Validate
}

func NewMenuImportHandler(menuImportService *services.MenuImportService) *MenuImportHandler {
	return &MenuImportHandler{
		menuImportService: menuImportService,
		validate:          validator.New(),
	}
}

// ExportMenusToExcel handles GET /api/menus/export - returns Excel file
func (h *MenuImportHandler) ExportMenusToExcel(c *gin.Context) {
	// Get menus data
	menusData, err := h.menuImportService.GetMenusForExport()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch menus", common.CodeInternalError, err.Error())
		return
	}

	// Generate Excel file with excelize
	excelFile, err := h.menuImportService.GenerateMenusExcel(menusData.Menus)
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
	filename := fmt.Sprintf("menus-export-%s.xlsx", time.Now().Format("2006-01-02"))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Length", fmt.Sprintf("%d", buffer.Len()))

	// Send file
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// DownloadMenusTemplate handles GET /api/menus/template - returns template Excel file
func (h *MenuImportHandler) DownloadMenusTemplate(c *gin.Context) {
	// Generate template with excelize
	template, err := h.menuImportService.GenerateMenusTemplateExcel()
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
	c.Header("Content-Disposition", "attachment; filename=\"menus-import-template.xlsx\"")
	c.Header("Content-Length", fmt.Sprintf("%d", buffer.Len()))

	// Send file
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// ValidateMenuImport handles POST /api/menus/import/validate
func (h *MenuImportHandler) ValidateMenuImport(c *gin.Context) {
	var req models.ValidateMenuImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	response, err := h.menuImportService.ValidateMenuImport(&req)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to validate import data", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Validation completed", response)
}

// BulkMenuImport handles POST /api/menus/import
func (h *MenuImportHandler) BulkMenuImport(c *gin.Context) {
	var req models.BulkMenuImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	response, err := h.menuImportService.BulkMenuImport(&req)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to import menus", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Import completed", response)
}
