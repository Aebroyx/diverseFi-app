package handlers

import (
	"net/http"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/Aebroyx/diverseFi-api/internal/validators"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	userService *services.UserService
	validate    *validator.Validate
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	validate := validator.New()
	// Register custom validators
	if err := validators.RegisterCustomValidators(validate); err != nil {
		panic(err)
	}
	return &UserHandler{
		userService: userService,
		validate:    validate,
	}
}

// GetAllUsers handles GET /api/users
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	var params pagination.QueryParams
	if err := params.Bind(c); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid query parameters", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate query parameters
	if err := h.validate.Struct(params); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	// Get users with pagination, search, and filters
	response, err := h.userService.GetAllUsers(params)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to fetch users", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Users fetched successfully", response)
}

func (h *UserHandler) GetUserById(c *gin.Context) {
	user, err := h.userService.GetUserById(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	common.SendSuccess(c, http.StatusOK, "User fetched successfully", user)
}

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
	Details any    `json:"details,omitempty"`
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	// Create user
	user, err := h.userService.CreateUser(&req)
	if err != nil {
		switch err.Error() {
		case "username already exists":
			common.SendError(c, http.StatusConflict, "Username already exists", common.CodeUsernameExists, nil)
		case "email already exists":
			common.SendError(c, http.StatusConflict, "Email already exists", common.CodeEmailExists, nil)
		default:
			common.SendError(c, http.StatusInternalServerError, "Internal server error", common.CodeInternalError, nil)
		}
		return
	}

	common.SendSuccess(c, http.StatusCreated, "User created successfully", user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	// Update user
	user, err := h.userService.UpdateUser(c.Param("id"), &req)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Internal server error", common.CodeInternalError, nil)
		return
	}

	common.SendSuccess(c, http.StatusOK, "User updated successfully", user)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	user, err := h.userService.DeleteUser(c.Param("id"))
	if err != nil {
		// Check for specific error messages
		if err.Error() == "cannot delete root user" {
			common.SendError(c, http.StatusForbidden, "cannot delete root user", common.CodeForbidden, nil)
			return
		}
		common.SendError(c, http.StatusInternalServerError, "Internal server error", common.CodeInternalError, nil)
		return
	}

	common.SendSuccess(c, http.StatusOK, "User deleted successfully", user)
}

func (h *UserHandler) ResetUserPassword(c *gin.Context) {
	userID := c.Param("id")
	var req models.ResetUserPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Invalid request body", common.CodeInvalidRequest, err.Error())
		return
	}

	// Validate request
	if err := h.validate.Struct(req); err != nil {
		common.SendError(c, http.StatusBadRequest, "Validation failed", common.CodeValidationError, err.Error())
		return
	}

	user, err := h.userService.ResetUserPassword(userID, &req)
	if err != nil {
		switch err.Error() {
		case "invalid current password":
			common.SendError(c, http.StatusBadRequest, "Invalid current password", common.CodeBadRequest, nil)
		case "new password and confirm password do not match":
			common.SendError(c, http.StatusBadRequest, "New password and confirm password do not match", common.CodeValidationError, nil)
		default:
			common.SendError(c, http.StatusInternalServerError, "Internal server error", common.CodeInternalError, nil)
		}
		return
	}
	common.SendSuccess(c, http.StatusOK, "User password reset successfully", user)
}
