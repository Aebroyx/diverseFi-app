package handlers

import (
	"net/http"
	"strconv"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type RightsAccessHandler struct {
	rightsAccessService *services.RightsAccessService
	validate            *validator.Validate
}

func NewRightsAccessHandler(rightsAccessService *services.RightsAccessService) *RightsAccessHandler {
	return &RightsAccessHandler{
		rightsAccessService: rightsAccessService,
		validate:            validator.New(),
	}
}

// GetUserRightsAccess handles GET /api/rights-access/user/:userId
func (h *RightsAccessHandler) GetUserRightsAccess(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid user ID", common.CodeInvalidRequest, nil)
		return
	}

	rightsAccess, err := h.rightsAccessService.GetUserRightsAccess(uint(userID))
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch rights access", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Rights access fetched successfully", rightsAccess)
}

// GetUserMenuRightsAccess handles GET /api/rights-access/user/:userId/menu/:menuId
func (h *RightsAccessHandler) GetUserMenuRightsAccess(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid user ID", common.CodeInvalidRequest, nil)
		return
	}

	menuID, err := strconv.ParseUint(c.Param("menuId"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid menu ID", common.CodeInvalidRequest, nil)
		return
	}

	rightsAccess, err := h.rightsAccessService.GetUserMenuRightsAccess(uint(userID), uint(menuID))
	if err != nil {
		if err.Error() == "rights access not found" {
			common.SendError(c, http.StatusNotFound, "Rights access not found", common.CodeNotFound, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to fetch rights access", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Rights access fetched successfully", rightsAccess)
}

// CreateOrUpdateRightsAccess handles POST /api/rights-access
func (h *RightsAccessHandler) CreateOrUpdateRightsAccess(c *gin.Context) {
	var req models.CreateRightsAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	rightsAccess, err := h.rightsAccessService.CreateOrUpdateRightsAccess(&req)
	if err != nil {
		switch err.Error() {
		case "user not found":
			common.SendError(c, http.StatusNotFound, "User not found", common.CodeNotFound, nil)
		case "menu not found":
			common.SendError(c, http.StatusNotFound, "Menu not found", common.CodeNotFound, nil)
		default:
			common.SendError(c, http.StatusInternalServerError, "Failed to create/update rights access", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Rights access saved successfully", rightsAccess)
}

// DeleteRightsAccess handles DELETE /api/rights-access/:id
func (h *RightsAccessHandler) DeleteRightsAccess(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid rights access ID", common.CodeInvalidRequest, nil)
		return
	}

	if err := h.rightsAccessService.DeleteRightsAccess(uint(id)); err != nil {
		if err.Error() == "rights access not found" {
			common.SendError(c, http.StatusNotFound, "Rights access not found", common.CodeNotFound, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to delete rights access", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Rights access deleted successfully", nil)
}

// BulkSaveUserRightsAccess handles POST /api/rights-access/user/:userId/bulk
func (h *RightsAccessHandler) BulkSaveUserRightsAccess(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid user ID", common.CodeInvalidRequest, nil)
		return
	}

	var req models.BulkUserRightsAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	rightsAccess, err := h.rightsAccessService.BulkSaveUserRightsAccess(uint(userID), &req)
	if err != nil {
		if err.Error() == "user not found" {
			common.SendError(c, http.StatusNotFound, "User not found", common.CodeNotFound, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to save rights access", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Rights access saved successfully", rightsAccess)
}

// DeleteAllUserRightsAccess handles DELETE /api/rights-access/user/:userId
func (h *RightsAccessHandler) DeleteAllUserRightsAccess(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid user ID", common.CodeInvalidRequest, nil)
		return
	}

	if err := h.rightsAccessService.DeleteAllUserRightsAccess(uint(userID)); err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to delete rights access", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "All rights access deleted successfully", nil)
}
