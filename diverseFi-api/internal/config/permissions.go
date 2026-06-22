package config

// PermissionType represents the type of permission required for an action
type PermissionType string

const (
	PermissionRead   PermissionType = "read"
	PermissionWrite  PermissionType = "write"
	PermissionUpdate PermissionType = "update"
	PermissionDelete PermissionType = "delete"
)

// RoutePermission defines the permission requirement for a route
type RoutePermission struct {
	MenuPath   string
	Permission PermissionType
}

// RoutePermissions maps "METHOD:path_prefix" to permission requirements
var RoutePermissions = map[string]RoutePermission{
	// User management
	"GET:/api/users":    {MenuPath: "/users-management", Permission: PermissionRead},
	"GET:/api/user/":    {MenuPath: "/users-management", Permission: PermissionRead},
	"POST:/api/user/":   {MenuPath: "/users-management", Permission: PermissionWrite},
	"PUT:/api/user/":    {MenuPath: "/users-management", Permission: PermissionUpdate},
	"DELETE:/api/user/": {MenuPath: "/users-management", Permission: PermissionDelete},

	// Role management
	"GET:/api/roles":    {MenuPath: "/roles-management", Permission: PermissionRead},
	"GET:/api/role/":    {MenuPath: "/roles-management", Permission: PermissionRead},
	"POST:/api/role/":   {MenuPath: "/roles-management", Permission: PermissionWrite},
	"PUT:/api/role/":    {MenuPath: "/roles-management", Permission: PermissionUpdate},
	"DELETE:/api/role/": {MenuPath: "/roles-management", Permission: PermissionDelete},

	// Menu management
	"GET:/api/menus":    {MenuPath: "/menus-management", Permission: PermissionRead},
	"GET:/api/menu/":    {MenuPath: "/menus-management", Permission: PermissionRead},
	"POST:/api/menu/":   {MenuPath: "/menus-management", Permission: PermissionWrite},
	"PUT:/api/menu/":    {MenuPath: "/menus-management", Permission: PermissionUpdate},
	"DELETE:/api/menu/": {MenuPath: "/menus-management", Permission: PermissionDelete},

	// Rights access (inherits users-management permissions)
	"GET:/api/rights-access/":    {MenuPath: "/users-management", Permission: PermissionRead},
	"POST:/api/rights-access":    {MenuPath: "/users-management", Permission: PermissionWrite},
	"DELETE:/api/rights-access/": {MenuPath: "/users-management", Permission: PermissionDelete},
}

// WhitelistedRoutes contains routes that bypass permission checks
// These routes are accessible to any authenticated user
var WhitelistedRoutes = map[string]bool{
	"GET:/api/me":           true,
	"POST:/api/auth/logout": true,
	"GET:/api/menus/user":   true,
	"GET:/api/menus/tree":   true,
	"GET:/api/roles/active": true,
}
