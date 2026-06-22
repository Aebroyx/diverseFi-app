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

type MenuHandler struct {
	menuService *services.MenuService
	validate    *validator.Validate
}

func NewMenuHandler(menuService *services.MenuService) *MenuHandler {
	return &MenuHandler{
		menuService: menuService,
		validate:    validator.New(),
	}
}

// GetAllMenus handles GET /api/menus
func (h *MenuHandler) GetAllMenus(c *gin.Context) {
	var params pagination.QueryParams
	if err := params.Bind(c); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid query parameters", common.CodeInvalidRequest, err.Error())
		return
	}

	response, err := h.menuService.GetAllMenus(params)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch menus", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Menus fetched successfully", response)
}

// GetMenuTree handles GET /api/menus/tree
func (h *MenuHandler) GetMenuTree(c *gin.Context) {
	menus, err := h.menuService.GetMenuTree()
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch menu tree", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Menu tree fetched successfully", menus)
}

// GetUserMenus handles GET /api/menus/user
func (h *MenuHandler) GetUserMenus(c *gin.Context) {
	// Get user from context (set by auth middleware)
	userInterface, exists := c.Get("user")
	if !exists {
		common.SendError(c, http.StatusUnauthorized, "Unauthorized", common.CodeUnauthorized, nil)
		return
	}

	user, ok := userInterface.(models.RegisterResponse)
	if !ok {
		common.SendError(c, http.StatusInternalServerError, "Failed to get user from context", common.CodeInternalError, nil)
		return
	}

	// Get roleID from context
	roleIDInterface, exists := c.Get("roleID")
	if !exists {
		common.SendError(c, http.StatusInternalServerError, "Failed to get role from context", common.CodeInternalError, nil)
		return
	}

	roleID, ok := roleIDInterface.(uint)
	if !ok {
		common.SendError(c, http.StatusInternalServerError, "Failed to get role ID from context", common.CodeInternalError, nil)
		return
	}

	menus, err := h.menuService.GetUserMenus(user.ID, roleID)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch user menus", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "User menus fetched successfully", menus)
}

// GetMenuByID handles GET /api/menu/:id
func (h *MenuHandler) GetMenuByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid menu ID", common.CodeInvalidRequest, nil)
		return
	}

	menu, err := h.menuService.GetMenuByID(uint(id))
	if err != nil {
		if err.Error() == "menu not found" {
			common.SendError(c, http.StatusNotFound, "Menu not found", common.CodeNotFound, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to fetch menu", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Menu fetched successfully", menu)
}

// CreateMenu handles POST /api/menu/create
func (h *MenuHandler) CreateMenu(c *gin.Context) {
	var req models.CreateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	menu, err := h.menuService.CreateMenu(&req)
	if err != nil {
		if err.Error() == "parent menu not found" {
			common.SendError(c, http.StatusBadRequest, "Parent menu not found", common.CodeBadRequest, nil)
		} else {
			common.SendError(c, http.StatusInternalServerError, "Failed to create menu", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusCreated, "Menu created successfully", menu)
}

// UpdateMenu handles PUT /api/menu/:id
func (h *MenuHandler) UpdateMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid menu ID", common.CodeInvalidRequest, nil)
		return
	}

	var req models.UpdateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	menu, err := h.menuService.UpdateMenu(uint(id), &req)
	if err != nil {
		switch err.Error() {
		case "menu not found":
			common.SendError(c, http.StatusNotFound, "Menu not found", common.CodeNotFound, nil)
		case "parent menu not found":
			common.SendError(c, http.StatusBadRequest, "Parent menu not found", common.CodeBadRequest, nil)
		case "menu cannot be its own parent":
			common.SendError(c, http.StatusBadRequest, "Menu cannot be its own parent", common.CodeBadRequest, nil)
		default:
			common.SendError(c, http.StatusInternalServerError, "Failed to update menu", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Menu updated successfully", menu)
}

// DeleteMenu handles DELETE /api/menu/:id
func (h *MenuHandler) DeleteMenu(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid menu ID", common.CodeInvalidRequest, nil)
		return
	}

	if err := h.menuService.DeleteMenu(uint(id)); err != nil {
		switch err.Error() {
		case "menu not found":
			common.SendError(c, http.StatusNotFound, "Menu not found", common.CodeNotFound, nil)
		case "cannot delete menu with children":
			common.SendError(c, http.StatusBadRequest, "Cannot delete menu with children", common.CodeBadRequest, nil)
		default:
			common.SendError(c, http.StatusInternalServerError, "Failed to delete menu", common.CodeInternalError, err.Error())
		}
		return
	}

	common.SendSuccess(c, http.StatusOK, "Menu deleted successfully", nil)
}
