package handlers

import (
	"net/http"

	"github.com/Aebroyx/diverseFi-api/internal/common"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/services"
	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	searchService *services.SearchService
}

func NewSearchHandler(searchService *services.SearchService) *SearchHandler {
	return &SearchHandler{
		searchService: searchService,
	}
}

// GlobalSearch handles GET /api/search/global
func (h *SearchHandler) GlobalSearch(c *gin.Context) {
	query := c.Query("q")

	// Validate minimum query length
	if len(query) < 3 {
		common.SendError(c, http.StatusBadRequest, "Search query must be at least 3 characters", common.CodeBadRequest, nil)
		return
	}

	// Extract user context from middleware
	userInterface, exists := c.Get("user")
	if !exists {
		common.SendError(c, http.StatusUnauthorized, "User not found in context", common.CodeUnauthorized, nil)
		return
	}

	user, ok := userInterface.(models.RegisterResponse)
	if !ok {
		common.SendError(c, http.StatusInternalServerError, "Invalid user context", common.CodeInternalError, nil)
		return
	}

	roleIDInterface, exists := c.Get("roleID")
	if !exists {
		common.SendError(c, http.StatusUnauthorized, "Role ID not found in context", common.CodeUnauthorized, nil)
		return
	}

	roleID, ok := roleIDInterface.(uint)
	if !ok {
		common.SendError(c, http.StatusInternalServerError, "Invalid role ID in context", common.CodeInternalError, nil)
		return
	}

	// Perform search with permission filtering
	results, err := h.searchService.GlobalSearch(query, 5, user.ID, roleID, user.Role.Name)
	if err != nil {
		common.SendError(c, http.StatusInternalServerError, "Failed to perform search", common.CodeInternalError, err.Error())
		return
	}

	common.SendSuccess(c, http.StatusOK, "Search completed successfully", results)
}
