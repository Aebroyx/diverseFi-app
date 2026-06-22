package services

import (
	"errors"
	"sort"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"gorm.io/gorm"
)

type MenuService struct {
	db     *gorm.DB
	config *config.Config
}

func NewMenuService(db *gorm.DB, config *config.Config) *MenuService {
	return &MenuService{
		db:     db,
		config: config,
	}
}

// GetAllMenus retrieves all menus with pagination
func (s *MenuService) GetAllMenus(params pagination.QueryParams) (*pagination.PaginatedResponse, error) {
	config := pagination.PaginationConfig{
		Model:         &models.Menu{},
		BaseCondition: map[string]interface{}{},
		SearchFields:  []string{"name", "path"},
		FilterFields: map[string]string{
			"name":      "name",
			"path":      "path",
			"is_active": "is_active",
			"parent_id": "parent_id",
		},
		SortFields:   []string{"name", "order_index", "created_at"},
		DefaultSort:  "order_index",
		DefaultOrder: "ASC",
	}

	paginator := pagination.NewPaginator(s.db)
	return paginator.Paginate(params, config)
}

// GetMenuByID retrieves a menu by ID
func (s *MenuService) GetMenuByID(id uint) (*models.Menu, error) {
	var menu models.Menu
	if err := s.db.Preload("Children").First(&menu, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("menu not found")
		}
		return nil, err
	}
	return &menu, nil
}

// GetMenuTree retrieves all menus as a tree structure
func (s *MenuService) GetMenuTree() ([]models.MenuResponse, error) {
	var menus []models.Menu
	if err := s.db.Where("is_active = ?", true).Order("order_index ASC").Find(&menus).Error; err != nil {
		return nil, err
	}

	return buildMenuTree(menus, nil), nil
}

// buildMenuTree builds a tree structure from flat menu list
func buildMenuTree(menus []models.Menu, parentID *uint) []models.MenuResponse {
	var result []models.MenuResponse

	for _, menu := range menus {
		// Check if this menu belongs to the current parent
		if (parentID == nil && menu.ParentID == nil) || (parentID != nil && menu.ParentID != nil && *parentID == *menu.ParentID) {
			menuResp := models.MenuResponse{
				ID:         menu.ID,
				Name:       menu.Name,
				Path:       menu.Path,
				Icon:       menu.Icon,
				OrderIndex: menu.OrderIndex,
				ParentID:   menu.ParentID,
				IsActive:   menu.IsActive,
				CreatedAt:  menu.CreatedAt,
				UpdatedAt:  menu.UpdatedAt,
				Children:   buildMenuTree(menus, &menu.ID),
			}
			result = append(result, menuResp)
		}
	}

	return result
}

// GetUserMenus retrieves menus accessible by a user with effective permissions
func (s *MenuService) GetUserMenus(userID uint, roleID uint) ([]models.MenuWithPermissions, error) {
	// Get menus from role
	var roleMenus []models.RoleMenu
	if err := s.db.Preload("Menu").Where("role_id = ?", roleID).Find(&roleMenus).Error; err != nil {
		return nil, err
	}

	// Get direct user menus
	var userMenus []models.UserMenu
	if err := s.db.Preload("Menu").Where("user_id = ?", userID).Find(&userMenus).Error; err != nil {
		return nil, err
	}

	// Get user permission overrides
	var rightsAccess []models.RightsAccess
	if err := s.db.Where("user_id = ?", userID).Find(&rightsAccess).Error; err != nil {
		return nil, err
	}

	// Create map for quick lookup of overrides
	overrideMap := make(map[uint]models.RightsAccess)
	for _, ra := range rightsAccess {
		overrideMap[ra.MenuID] = ra
	}

	// Build menu map with permissions
	menuMap := make(map[uint]models.MenuWithPermissions)

	// Add menus from role with default permissions
	for _, rm := range roleMenus {
		if !rm.Menu.IsActive {
			continue
		}

		permissions := models.EffectivePermissions{
			CanRead:   rm.CanRead,
			CanWrite:  rm.CanWrite,
			CanUpdate: rm.CanUpdate,
			CanDelete: rm.CanDelete,
		}

		// Apply user overrides if exist
		if override, ok := overrideMap[rm.MenuID]; ok {
			if override.CanRead != nil {
				permissions.CanRead = *override.CanRead
			}
			if override.CanWrite != nil {
				permissions.CanWrite = *override.CanWrite
			}
			if override.CanUpdate != nil {
				permissions.CanUpdate = *override.CanUpdate
			}
			if override.CanDelete != nil {
				permissions.CanDelete = *override.CanDelete
			}
		}

		menuMap[rm.MenuID] = models.MenuWithPermissions{
			ID:          rm.Menu.ID,
			Name:        rm.Menu.Name,
			Path:        rm.Menu.Path,
			Icon:        rm.Menu.Icon,
			OrderIndex:  rm.Menu.OrderIndex,
			ParentID:    rm.Menu.ParentID,
			IsActive:    rm.Menu.IsActive,
			Permissions: permissions,
		}
	}

	// Add direct user menus (with default read permission if not already in map)
	for _, um := range userMenus {
		if !um.Menu.IsActive {
			continue
		}

		if _, exists := menuMap[um.MenuID]; !exists {
			permissions := models.EffectivePermissions{
				CanRead:   true, // Default for direct assignment
				CanWrite:  false,
				CanUpdate: false,
				CanDelete: false,
			}

			// Apply user overrides if exist
			if override, ok := overrideMap[um.MenuID]; ok {
				if override.CanRead != nil {
					permissions.CanRead = *override.CanRead
				}
				if override.CanWrite != nil {
					permissions.CanWrite = *override.CanWrite
				}
				if override.CanUpdate != nil {
					permissions.CanUpdate = *override.CanUpdate
				}
				if override.CanDelete != nil {
					permissions.CanDelete = *override.CanDelete
				}
			}

			menuMap[um.MenuID] = models.MenuWithPermissions{
				ID:          um.Menu.ID,
				Name:        um.Menu.Name,
				Path:        um.Menu.Path,
				Icon:        um.Menu.Icon,
				OrderIndex:  um.Menu.OrderIndex,
				ParentID:    um.Menu.ParentID,
				IsActive:    um.Menu.IsActive,
				Permissions: permissions,
			}
		}
	}

	// Add menus that have user overrides granting read access, even if not in role
	// This allows users to see menus they have explicit read permission for via overrides
	for _, override := range rightsAccess {
		// Only include if menu is not already in map and override explicitly grants read access
		if _, exists := menuMap[override.MenuID]; !exists && override.CanRead != nil && *override.CanRead {
			// Fetch the menu details
			var menu models.Menu
			if err := s.db.First(&menu, override.MenuID).Error; err != nil {
				continue // Skip if menu doesn't exist
			}

			if !menu.IsActive {
				continue // Skip inactive menus
			}

			// Build permissions from override (only non-nil values are set)
			permissions := models.EffectivePermissions{
				CanRead:   false, // Default to false, will be set by override
				CanWrite:  false,
				CanUpdate: false,
				CanDelete: false,
			}

			if override.CanRead != nil {
				permissions.CanRead = *override.CanRead
			}
			if override.CanWrite != nil {
				permissions.CanWrite = *override.CanWrite
			}
			if override.CanUpdate != nil {
				permissions.CanUpdate = *override.CanUpdate
			}
			if override.CanDelete != nil {
				permissions.CanDelete = *override.CanDelete
			}

			// Only add if canRead is true (explicit grant)
			if permissions.CanRead {
				menuMap[override.MenuID] = models.MenuWithPermissions{
					ID:          menu.ID,
					Name:        menu.Name,
					Path:        menu.Path,
					Icon:        menu.Icon,
					OrderIndex:  menu.OrderIndex,
					ParentID:    menu.ParentID,
					IsActive:    menu.IsActive,
					Permissions: permissions,
				}
			}
		}
	}

	// Convert map to slice and filter out menus without read permission
	result := make([]models.MenuWithPermissions, 0, len(menuMap))
	for _, menu := range menuMap {
		// Only include menus where user has read permission
		if menu.Permissions.CanRead {
			result = append(result, menu)
		}
	}

	// Sort by order_index
	sort.Slice(result, func(i, j int) bool {
		return result[i].OrderIndex < result[j].OrderIndex
	})

	// Build tree structure
	return buildMenuWithPermissionsTree(result, nil), nil
}

// buildMenuWithPermissionsTree builds a tree structure from flat menu list with permissions
func buildMenuWithPermissionsTree(menus []models.MenuWithPermissions, parentID *uint) []models.MenuWithPermissions {
	var result []models.MenuWithPermissions

	for _, menu := range menus {
		if (parentID == nil && menu.ParentID == nil) || (parentID != nil && menu.ParentID != nil && *parentID == *menu.ParentID) {
			menu.Children = buildMenuWithPermissionsTree(menus, &menu.ID)
			result = append(result, menu)
		}
	}

	return result
}

// CreateMenu creates a new menu
func (s *MenuService) CreateMenu(req *models.CreateMenuRequest) (*models.MenuResponse, error) {
	// Validate parent exists if provided
	if req.ParentID != nil {
		var parent models.Menu
		if err := s.db.First(&parent, *req.ParentID).Error; err != nil {
			return nil, errors.New("parent menu not found")
		}
	}

	menu := models.Menu{
		Name:       req.Name,
		Path:       req.Path,
		Icon:       req.Icon,
		OrderIndex: req.OrderIndex,
		ParentID:   req.ParentID,
		IsActive:   req.IsActive,
	}

	if err := s.db.Create(&menu).Error; err != nil {
		return nil, err
	}

	return &models.MenuResponse{
		ID:         menu.ID,
		Name:       menu.Name,
		Path:       menu.Path,
		Icon:       menu.Icon,
		OrderIndex: menu.OrderIndex,
		ParentID:   menu.ParentID,
		IsActive:   menu.IsActive,
		CreatedAt:  menu.CreatedAt,
		UpdatedAt:  menu.UpdatedAt,
	}, nil
}

// UpdateMenu updates an existing menu
func (s *MenuService) UpdateMenu(id uint, req *models.UpdateMenuRequest) (*models.MenuResponse, error) {
	var menu models.Menu
	if err := s.db.First(&menu, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("menu not found")
		}
		return nil, err
	}

	// Validate parent exists if provided and prevent circular reference
	if req.ParentID != nil {
		if *req.ParentID == id {
			return nil, errors.New("menu cannot be its own parent")
		}
		var parent models.Menu
		if err := s.db.First(&parent, *req.ParentID).Error; err != nil {
			return nil, errors.New("parent menu not found")
		}
	}

	// Update fields
	menu.Name = req.Name
	menu.Path = req.Path
	menu.Icon = req.Icon
	menu.OrderIndex = req.OrderIndex
	menu.ParentID = req.ParentID
	menu.IsActive = req.IsActive

	if err := s.db.Save(&menu).Error; err != nil {
		return nil, err
	}

	return &models.MenuResponse{
		ID:         menu.ID,
		Name:       menu.Name,
		Path:       menu.Path,
		Icon:       menu.Icon,
		OrderIndex: menu.OrderIndex,
		ParentID:   menu.ParentID,
		IsActive:   menu.IsActive,
		CreatedAt:  menu.CreatedAt,
		UpdatedAt:  menu.UpdatedAt,
	}, nil
}

// DeleteMenu deletes a menu (soft delete)
func (s *MenuService) DeleteMenu(id uint) error {
	var menu models.Menu
	if err := s.db.First(&menu, id).Error; err != nil {
		return errors.New("menu not found")
	}

	// Check if menu has children
	var childCount int64
	s.db.Model(&models.Menu{}).Where("parent_id = ?", id).Count(&childCount)
	if childCount > 0 {
		return errors.New("cannot delete menu with children")
	}

	// Delete related role_menus and user_menus
	s.db.Where("menu_id = ?", id).Delete(&models.RoleMenu{})
	s.db.Where("menu_id = ?", id).Delete(&models.UserMenu{})
	s.db.Where("menu_id = ?", id).Delete(&models.RightsAccess{})

	return s.db.Delete(&menu).Error
}
