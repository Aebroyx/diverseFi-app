package services

import (
	"strings"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"gorm.io/gorm"
)

// PermissionService handles permission checking for API routes
type PermissionService struct {
	db          *gorm.DB
	menuService *MenuService
	cfg         *config.Config
}

// UserPermissions holds the effective permissions for a user
type UserPermissions struct {
	UserID      uint
	RoleID      uint
	Permissions map[string]models.EffectivePermissions // key: menu path
}

// NewPermissionService creates a new permission service instance
func NewPermissionService(db *gorm.DB, cfg *config.Config, menuService *MenuService) *PermissionService {
	return &PermissionService{
		db:          db,
		menuService: menuService,
		cfg:         cfg,
	}
}

// GetUserPermissions fetches all effective permissions for a user
// This uses menuService.GetUserMenus() which handles:
// 1. Role permissions (role_menus table)
// 2. User direct menus (user_menus table)
// 3. User overrides (rights_access table) where nil = inherit, true/false = explicit override
func (s *PermissionService) GetUserPermissions(userID, roleID uint) (*UserPermissions, error) {
	menus, err := s.menuService.GetUserMenus(userID, roleID)
	if err != nil {
		return nil, err
	}

	permissions := make(map[string]models.EffectivePermissions)

	// Flatten the tree structure and build permission map by path
	flattenMenuPermissions(menus, permissions)

	return &UserPermissions{
		UserID:      userID,
		RoleID:      roleID,
		Permissions: permissions,
	}, nil
}

// flattenMenuPermissions recursively flattens menu tree into a path->permissions map
func flattenMenuPermissions(menus []models.MenuWithPermissions, permissions map[string]models.EffectivePermissions) {
	for _, menu := range menus {
		if menu.Path != "" {
			permissions[menu.Path] = menu.Permissions
		}
		if len(menu.Children) > 0 {
			flattenMenuPermissions(menu.Children, permissions)
		}
	}
}

// CheckPermission verifies if the user has the required permission for a menu path
func (up *UserPermissions) CheckPermission(menuPath string, permType config.PermissionType) bool {
	perms, exists := up.Permissions[menuPath]
	if !exists {
		return false
	}

	switch permType {
	case config.PermissionRead:
		return perms.CanRead
	case config.PermissionWrite:
		return perms.CanWrite
	case config.PermissionUpdate:
		return perms.CanUpdate
	case config.PermissionDelete:
		return perms.CanDelete
	default:
		return false
	}
}

// FindRoutePermission finds the permission requirement for a given method and path
func FindRoutePermission(method, path string) (*config.RoutePermission, bool) {
	// Try exact match first
	key := method + ":" + path
	if perm, ok := config.RoutePermissions[key]; ok {
		return &perm, true
	}

	// Try prefix match for routes with parameters
	for routeKey, perm := range config.RoutePermissions {
		parts := strings.SplitN(routeKey, ":", 2)
		if len(parts) != 2 {
			continue
		}
		routeMethod := parts[0]
		routePath := parts[1]

		if routeMethod != method {
			continue
		}

		// Check if route path is a prefix (for parametric routes like /api/user/:id)
		if strings.HasSuffix(routePath, "/") && strings.HasPrefix(path, routePath) {
			return &perm, true
		}
	}

	return nil, false
}

// IsWhitelisted checks if a route is whitelisted (bypasses permission checks)
func IsWhitelisted(method, path string) bool {
	// Try exact match
	key := method + ":" + path
	if config.WhitelistedRoutes[key] {
		return true
	}

	// Try prefix match for routes with wildcards
	for routeKey := range config.WhitelistedRoutes {
		parts := strings.SplitN(routeKey, ":", 2)
		if len(parts) != 2 {
			continue
		}
		routeMethod := parts[0]
		routePath := parts[1]

		if routeMethod != method {
			continue
		}

		// Check if route path is a prefix (for routes like /api/search/)
		if strings.HasSuffix(routePath, "/") && strings.HasPrefix(path, routePath) {
			return true
		}
	}

	return false
}
