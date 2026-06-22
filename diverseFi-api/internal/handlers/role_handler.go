package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type RoleHandler struct {
	roleService *services.RoleService
	validate    *validator.Validate
}

func NewRoleHandler(roleService *services.RoleService) *RoleHandler {
	return &RoleHandler{
		roleService: roleService,
		validate:    validator.New(),
	}
}

// GetAllRoles handles GET /api/roles
func (h *RoleHandler) GetAllRoles(c *gin.Context) {
	var params pagination.QueryParams
	if err := params.Bind(c); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid query parameters", common.CodeInvalidRequest, err.Error())
		return
	}

	response, err := h.roleService.GetAllRoles(params)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch roles", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Roles fetched successfully", response)
}

// GetActiveRoles handles GET /api/roles/active (for dropdowns)
func (h *RoleHandler) GetActiveRoles(c *gin.Context) {
	roles, err := h.roleService.GetActiveRoles()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch roles", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Active roles fetched successfully", roles)
}

// GetRoleByID handles GET /api/role/:id
func (h *RoleHandler) GetRoleByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid role ID", common.CodeInvalidRequest, nil)
		return
	}

	role, err := h.roleService.GetRoleByID(uint(id))
	if err != nil {
		if err.Error() == "role not found" {
			common.SendError(c, http.StatusNotFound, "Role not found", common.CodeNotFound, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to fetch role", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Role fetched successfully", role)
}

// CreateRole handles POST /api/role/create
func (h *RoleHandler) CreateRole(c *gin.Context) {
	var req models.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	role, err := h.roleService.CreateRole(&req)
	if err != nil {
		if err.Error() == "role name already exists" {
			common.SendError(c, http.StatusConflict, "Role name already exists", common.CodeConflict, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to create role", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusCreated, "Role created successfully", role)
}

// UpdateRole handles PUT /api/role/:id
func (h *RoleHandler) UpdateRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid role ID", common.CodeInvalidRequest, nil)
		return
	}

	var req models.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	role, err := h.roleService.UpdateRole(uint(id), &req)
	if err != nil {
		switch err.Error() {
		case "role not found":
			common.SendError(c, http.StatusNotFound, "Role not found", common.CodeNotFound, nil)
		case "role name already exists":
			common.SendError(c, http.StatusConflict, "Role name already exists", common.CodeConflict, nil)
		default:
			common.SendError(c, http.StatusInternalServerError, "Failed to update role", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Role updated successfully", role)
}

// DeleteRole handles DELETE /api/role/:id
func (h *RoleHandler) DeleteRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid role ID", common.CodeInvalidRequest, nil)
		return
	}

	if err := h.roleService.DeleteRole(uint(id)); err != nil {
		errMsg := err.Error()
		switch {
		case errMsg == "role not found":
			common.SendError(c, http.StatusNotFound, "Role not found", common.CodeNotFound, nil)
		case errMsg == "cannot delete the default role":
			common.SendError(c, http.StatusBadRequest, "Cannot delete the default role", common.CodeBadRequest, nil)
		default:
			// Check if it's a protected role error
			if strings.Contains(errMsg, "cannot delete protected role") {
				common.SendError(c, http.StatusForbidden, errMsg, common.CodeForbidden, nil)
			} else {
				common.SendError(c, http.StatusBadRequest, errMsg, common.CodeBadRequest, nil)
			}
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Role deleted successfully", nil)
}

// GetRoleMenus handles GET /api/role/:id/menus
func (h *RoleHandler) GetRoleMenus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid role ID", common.CodeInvalidRequest, nil)
		return
	}

	menus, err := h.roleService.GetRoleMenus(uint(id))
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch role menus", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Role menus fetched successfully", menus)
}

// AssignMenusToRole handles POST /api/role/:id/menus
func (h *RoleHandler) AssignMenusToRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid role ID", common.CodeInvalidRequest, nil)
		return
	}

	var req models.BulkAssignMenusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	menus, err := h.roleService.AssignMenusToRole(uint(id), &req)
	if err != nil {
		if err.Error() == "role not found" {
			common.SendError(c, http.StatusNotFound, "Role not found", common.CodeNotFound, nil)
		} else {
			common.SendError(c, http.StatusBadRequest, err.Error(), common.CodeBadRequest, nil)
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Menus assigned to role successfully", menus)
}

// RemoveMenuFromRole handles DELETE /api/role/:id/menus/:menuId
func (h *RoleHandler) RemoveMenuFromRole(c *gin.Context) {
	roleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid role ID", common.CodeInvalidRequest, nil)
		return
	}

	menuID, err := strconv.ParseUint(c.Param("menuId"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid menu ID", common.CodeInvalidRequest, nil)
		return
	}

	if err := h.roleService.RemoveMenuFromRole(uint(roleID), uint(menuID)); err != nil {
		if err.Error() == "menu assignment not found" {
			common.SendError(c, http.StatusNotFound, "Menu assignment not found", common.CodeNotFound, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to remove menu from role", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Menu removed from role successfully", nil)
}
