package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"gorm.io/gorm"
)

type RoleService struct {
	db     *gorm.DB
	config *config.Config
}

func NewRoleService(db *gorm.DB, config *config.Config) *RoleService {
	return &RoleService{
		db:     db,
		config: config,
	}
}

// GetAllRoles retrieves all roles with pagination
func (s *RoleService) GetAllRoles(params pagination.QueryParams) (*pagination.PaginatedResponse, error) {
	config := pagination.PaginationConfig{
		Model:         &models.Role{},
		BaseCondition: map[string]interface{}{},
		SearchFields:  []string{"name", "display_name", "description"},
		FilterFields: map[string]string{
			"name":       "name",
			"is_active":  "is_active",
			"is_default": "is_default",
		},
		SortFields:   []string{"name", "display_name", "created_at"},
		DefaultSort:  "created_at",
		DefaultOrder: "DESC",
	}

	paginator := pagination.NewPaginator(s.db)
	return paginator.Paginate(params, config)
}

// GetRoleByID retrieves a role by ID
func (s *RoleService) GetRoleByID(id uint) (*models.Role, error) {
	var role models.Role
	if err := s.db.First(&role, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("role not found")
		}
		return nil, err
	}
	return &role, nil
}

// GetRoleByName retrieves a role by name
func (s *RoleService) GetRoleByName(name string) (*models.Role, error) {
	var role models.Role
	if err := s.db.Where("name = ?", name).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("role not found")
		}
		return nil, err
	}
	return &role, nil
}

// GetDefaultRole retrieves the default role
func (s *RoleService) GetDefaultRole() (*models.Role, error) {
	var role models.Role
	if err := s.db.Where("is_default = ?", true).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Fallback to "user" role if no default is set
			return s.GetRoleByName("user")
		}
		return nil, err
	}
	return &role, nil
}

// CreateRole creates a new role
func (s *RoleService) CreateRole(req *models.CreateRoleRequest) (*models.RoleResponse, error) {
	// Check if role name already exists
	var existing models.Role
	if err := s.db.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		return nil, errors.New("role name already exists")
	}

	// If this role is set as default, unset other defaults
	if req.IsDefault {
		s.db.Model(&models.Role{}).Where("is_default = ?", true).Update("is_default", false)
	}

	role := models.Role{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		IsDefault:   req.IsDefault,
		IsActive:    true,
	}

	if err := s.db.Create(&role).Error; err != nil {
		return nil, err
	}

	return &models.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		IsDefault:   role.IsDefault,
		IsActive:    role.IsActive,
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}, nil
}

// UpdateRole updates an existing role
func (s *RoleService) UpdateRole(id uint, req *models.UpdateRoleRequest) (*models.RoleResponse, error) {
	var role models.Role
	if err := s.db.First(&role, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("role not found")
		}
		return nil, err
	}

	// Check if new name conflicts with existing role
	if req.Name != role.Name {
		var existing models.Role
		if err := s.db.Where("name = ? AND id != ?", req.Name, id).First(&existing).Error; err == nil {
			return nil, errors.New("role name already exists")
		}
	}

	// If this role is set as default, unset other defaults
	if req.IsDefault && !role.IsDefault {
		s.db.Model(&models.Role{}).Where("is_default = ? AND id != ?", true, id).Update("is_default", false)
	}

	// Update fields
	role.Name = req.Name
	role.DisplayName = req.DisplayName
	role.Description = req.Description
	role.IsDefault = req.IsDefault
	role.IsActive = req.IsActive

	if err := s.db.Save(&role).Error; err != nil {
		return nil, err
	}

	return &models.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		IsDefault:   role.IsDefault,
		IsActive:    role.IsActive,
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}, nil
}

// DeleteRole deletes a role (soft delete)
func (s *RoleService) DeleteRole(id uint) error {
	var role models.Role
	if err := s.db.First(&role, id).Error; err != nil {
		return errors.New("role not found")
	}

	// Prevent deletion of protected roles
	protectedRoles := []string{"root", "admin", "user"}
	if role.Name != "" {
		roleNameLower := strings.ToLower(role.Name)
		for _, protectedRole := range protectedRoles {
			if roleNameLower == protectedRole {
				return fmt.Errorf("cannot delete protected role: %s", role.Name)
			}
		}
	}

	// Prevent deletion of roles that have users assigned
	var userCount int64
	s.db.Model(&models.Users{}).Where("role_id = ?", id).Count(&userCount)
	if userCount > 0 {
		return fmt.Errorf("cannot delete role: %d users are assigned to this role", userCount)
	}

	// Prevent deletion of default role
	if role.IsDefault {
		return errors.New("cannot delete the default role")
	}

	return s.db.Delete(&role).Error
}

// GetActiveRoles retrieves all active roles (for dropdowns)
func (s *RoleService) GetActiveRoles() ([]models.RoleResponse, error) {
	var roles []models.Role
	if err := s.db.Where("is_active = ?", true).Order("name ASC").Find(&roles).Error; err != nil {
		return nil, err
	}

	response := make([]models.RoleResponse, len(roles))
	for i, role := range roles {
		response[i] = models.RoleResponse{
			ID:          role.ID,
			Name:        role.Name,
			DisplayName: role.DisplayName,
			Description: role.Description,
			IsDefault:   role.IsDefault,
			IsActive:    role.IsActive,
			CreatedAt:   role.CreatedAt,
			UpdatedAt:   role.UpdatedAt,
		}
	}

	return response, nil
}

// GetRoleMenus retrieves all menus assigned to a role with permissions
func (s *RoleService) GetRoleMenus(roleID uint) ([]models.RoleMenuResponse, error) {
	var roleMenus []models.RoleMenu
	if err := s.db.Preload("Menu").Where("role_id = ?", roleID).Find(&roleMenus).Error; err != nil {
		return nil, err
	}

	response := make([]models.RoleMenuResponse, len(roleMenus))
	for i, rm := range roleMenus {
		response[i] = models.RoleMenuResponse{
			ID:        rm.ID,
			RoleID:    rm.RoleID,
			MenuID:    rm.MenuID,
			CanRead:   rm.CanRead,
			CanWrite:  rm.CanWrite,
			CanUpdate: rm.CanUpdate,
			CanDelete: rm.CanDelete,
			Menu: models.MenuResponse{
				ID:         rm.Menu.ID,
				Name:       rm.Menu.Name,
				Path:       rm.Menu.Path,
				Icon:       rm.Menu.Icon,
				OrderIndex: rm.Menu.OrderIndex,
				ParentID:   rm.Menu.ParentID,
				IsActive:   rm.Menu.IsActive,
				CreatedAt:  rm.Menu.CreatedAt,
				UpdatedAt:  rm.Menu.UpdatedAt,
			},
			CreatedAt: rm.CreatedAt,
			UpdatedAt: rm.UpdatedAt,
		}
	}

	return response, nil
}

// AssignMenusToRole assigns menus to a role with permissions
func (s *RoleService) AssignMenusToRole(roleID uint, req *models.BulkAssignMenusRequest) ([]models.RoleMenuResponse, error) {
	// Verify role exists
	var role models.Role
	if err := s.db.First(&role, roleID).Error; err != nil {
		return nil, errors.New("role not found")
	}

	var createdMenus []models.RoleMenu

	for _, menuReq := range req.Menus {
		// Verify menu exists
		var menu models.Menu
		if err := s.db.First(&menu, menuReq.MenuID).Error; err != nil {
			return nil, fmt.Errorf("menu with ID %d not found", menuReq.MenuID)
		}

		// Check if assignment already exists
		var existing models.RoleMenu
		result := s.db.Where("role_id = ? AND menu_id = ?", roleID, menuReq.MenuID).First(&existing)

		if result.Error == gorm.ErrRecordNotFound {
			// Create new assignment
			roleMenu := models.RoleMenu{
				RoleID:    roleID,
				MenuID:    menuReq.MenuID,
				CanRead:   menuReq.CanRead,
				CanWrite:  menuReq.CanWrite,
				CanUpdate: menuReq.CanUpdate,
				CanDelete: menuReq.CanDelete,
			}
			if err := s.db.Create(&roleMenu).Error; err != nil {
				return nil, err
			}
			createdMenus = append(createdMenus, roleMenu)
		} else {
			// Update existing assignment
			existing.CanRead = menuReq.CanRead
			existing.CanWrite = menuReq.CanWrite
			existing.CanUpdate = menuReq.CanUpdate
			existing.CanDelete = menuReq.CanDelete
			if err := s.db.Save(&existing).Error; err != nil {
				return nil, err
			}
			createdMenus = append(createdMenus, existing)
		}
	}

	// Preload menus for response
	var roleMenus []models.RoleMenu
	menuIDs := make([]uint, len(req.Menus))
	for i, m := range req.Menus {
		menuIDs[i] = m.MenuID
	}
	s.db.Preload("Menu").Where("role_id = ? AND menu_id IN ?", roleID, menuIDs).Find(&roleMenus)

	response := make([]models.RoleMenuResponse, len(roleMenus))
	for i, rm := range roleMenus {
		response[i] = models.RoleMenuResponse{
			ID:        rm.ID,
			RoleID:    rm.RoleID,
			MenuID:    rm.MenuID,
			CanRead:   rm.CanRead,
			CanWrite:  rm.CanWrite,
			CanUpdate: rm.CanUpdate,
			CanDelete: rm.CanDelete,
			Menu: models.MenuResponse{
				ID:         rm.Menu.ID,
				Name:       rm.Menu.Name,
				Path:       rm.Menu.Path,
				Icon:       rm.Menu.Icon,
				OrderIndex: rm.Menu.OrderIndex,
				ParentID:   rm.Menu.ParentID,
				IsActive:   rm.Menu.IsActive,
				CreatedAt:  rm.Menu.CreatedAt,
				UpdatedAt:  rm.Menu.UpdatedAt,
			},
			CreatedAt: rm.CreatedAt,
			UpdatedAt: rm.UpdatedAt,
		}
	}

	return response, nil
}

// RemoveMenuFromRole removes a menu assignment from a role
func (s *RoleService) RemoveMenuFromRole(roleID uint, menuID uint) error {
	result := s.db.Where("role_id = ? AND menu_id = ?", roleID, menuID).Delete(&models.RoleMenu{})
	if result.RowsAffected == 0 {
		return errors.New("menu assignment not found")
	}
	return result.Error
}
