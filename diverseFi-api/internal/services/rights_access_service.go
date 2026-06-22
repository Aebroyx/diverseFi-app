package services

import (
	"errors"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"gorm.io/gorm"
)

type RightsAccessService struct {
	db     *gorm.DB
	config *config.Config
}

func NewRightsAccessService(db *gorm.DB, config *config.Config) *RightsAccessService {
	return &RightsAccessService{
		db:     db,
		config: config,
	}
}

// GetUserRightsAccess retrieves all permission overrides for a user
func (s *RightsAccessService) GetUserRightsAccess(userID uint) ([]models.RightsAccessResponse, error) {
	var rightsAccess []models.RightsAccess
	if err := s.db.Preload("Menu").Where("user_id = ?", userID).Find(&rightsAccess).Error; err != nil {
		return nil, err
	}

	response := make([]models.RightsAccessResponse, len(rightsAccess))
	for i, ra := range rightsAccess {
		response[i] = models.RightsAccessResponse{
			ID:        ra.ID,
			UserID:    ra.UserID,
			MenuID:    ra.MenuID,
			CanRead:   ra.CanRead,
			CanWrite:  ra.CanWrite,
			CanUpdate: ra.CanUpdate,
			CanDelete: ra.CanDelete,
			Menu: models.MenuResponse{
				ID:         ra.Menu.ID,
				Name:       ra.Menu.Name,
				Path:       ra.Menu.Path,
				Icon:       ra.Menu.Icon,
				OrderIndex: ra.Menu.OrderIndex,
				ParentID:   ra.Menu.ParentID,
				IsActive:   ra.Menu.IsActive,
				CreatedAt:  ra.Menu.CreatedAt,
				UpdatedAt:  ra.Menu.UpdatedAt,
			},
			CreatedAt: ra.CreatedAt,
			UpdatedAt: ra.UpdatedAt,
		}
	}

	return response, nil
}

// GetUserMenuRightsAccess retrieves permission override for a specific user-menu combination
func (s *RightsAccessService) GetUserMenuRightsAccess(userID uint, menuID uint) (*models.RightsAccessResponse, error) {
	var ra models.RightsAccess
	if err := s.db.Preload("Menu").Where("user_id = ? AND menu_id = ?", userID, menuID).First(&ra).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("rights access not found")
		}
		return nil, err
	}

	return &models.RightsAccessResponse{
		ID:        ra.ID,
		UserID:    ra.UserID,
		MenuID:    ra.MenuID,
		CanRead:   ra.CanRead,
		CanWrite:  ra.CanWrite,
		CanUpdate: ra.CanUpdate,
		CanDelete: ra.CanDelete,
		Menu: models.MenuResponse{
			ID:         ra.Menu.ID,
			Name:       ra.Menu.Name,
			Path:       ra.Menu.Path,
			Icon:       ra.Menu.Icon,
			OrderIndex: ra.Menu.OrderIndex,
			ParentID:   ra.Menu.ParentID,
			IsActive:   ra.Menu.IsActive,
			CreatedAt:  ra.Menu.CreatedAt,
			UpdatedAt:  ra.Menu.UpdatedAt,
		},
		CreatedAt: ra.CreatedAt,
		UpdatedAt: ra.UpdatedAt,
	}, nil
}

// CreateOrUpdateRightsAccess creates or updates a permission override
func (s *RightsAccessService) CreateOrUpdateRightsAccess(req *models.CreateRightsAccessRequest) (*models.RightsAccessResponse, error) {
	// Verify user exists
	var user models.Users
	if err := s.db.First(&user, req.UserID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	// Verify menu exists
	var menu models.Menu
	if err := s.db.First(&menu, req.MenuID).Error; err != nil {
		return nil, errors.New("menu not found")
	}

	// Check if override already exists
	var existing models.RightsAccess
	result := s.db.Where("user_id = ? AND menu_id = ?", req.UserID, req.MenuID).First(&existing)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new override
		ra := models.RightsAccess{
			UserID:    req.UserID,
			MenuID:    req.MenuID,
			CanRead:   req.CanRead,
			CanWrite:  req.CanWrite,
			CanUpdate: req.CanUpdate,
			CanDelete: req.CanDelete,
		}
		if err := s.db.Create(&ra).Error; err != nil {
			return nil, err
		}

		// Reload with menu
		s.db.Preload("Menu").First(&ra, ra.ID)

		return &models.RightsAccessResponse{
			ID:        ra.ID,
			UserID:    ra.UserID,
			MenuID:    ra.MenuID,
			CanRead:   ra.CanRead,
			CanWrite:  ra.CanWrite,
			CanUpdate: ra.CanUpdate,
			CanDelete: ra.CanDelete,
			Menu: models.MenuResponse{
				ID:         ra.Menu.ID,
				Name:       ra.Menu.Name,
				Path:       ra.Menu.Path,
				Icon:       ra.Menu.Icon,
				OrderIndex: ra.Menu.OrderIndex,
				ParentID:   ra.Menu.ParentID,
				IsActive:   ra.Menu.IsActive,
				CreatedAt:  ra.Menu.CreatedAt,
				UpdatedAt:  ra.Menu.UpdatedAt,
			},
			CreatedAt: ra.CreatedAt,
			UpdatedAt: ra.UpdatedAt,
		}, nil
	}

	// Update existing override
	existing.CanRead = req.CanRead
	existing.CanWrite = req.CanWrite
	existing.CanUpdate = req.CanUpdate
	existing.CanDelete = req.CanDelete

	if err := s.db.Save(&existing).Error; err != nil {
		return nil, err
	}

	// Reload with menu
	s.db.Preload("Menu").First(&existing, existing.ID)

	return &models.RightsAccessResponse{
		ID:        existing.ID,
		UserID:    existing.UserID,
		MenuID:    existing.MenuID,
		CanRead:   existing.CanRead,
		CanWrite:  existing.CanWrite,
		CanUpdate: existing.CanUpdate,
		CanDelete: existing.CanDelete,
		Menu: models.MenuResponse{
			ID:         existing.Menu.ID,
			Name:       existing.Menu.Name,
			Path:       existing.Menu.Path,
			Icon:       existing.Menu.Icon,
			OrderIndex: existing.Menu.OrderIndex,
			ParentID:   existing.Menu.ParentID,
			IsActive:   existing.Menu.IsActive,
			CreatedAt:  existing.Menu.CreatedAt,
			UpdatedAt:  existing.Menu.UpdatedAt,
		},
		CreatedAt: existing.CreatedAt,
		UpdatedAt: existing.UpdatedAt,
	}, nil
}

// DeleteRightsAccess deletes a permission override by ID
func (s *RightsAccessService) DeleteRightsAccess(id uint) error {
	result := s.db.Delete(&models.RightsAccess{}, id)
	if result.RowsAffected == 0 {
		return errors.New("rights access not found")
	}
	return result.Error
}

// BulkSaveUserRightsAccess saves/updates multiple permission overrides for a user
func (s *RightsAccessService) BulkSaveUserRightsAccess(userID uint, req *models.BulkUserRightsAccessRequest) ([]models.RightsAccessResponse, error) {
	// Verify user exists
	var user models.Users
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	// Step 1: Deduplicate permissions by menu_id (keep last occurrence)
	// This prevents duplicate key violations if frontend sends duplicates
	uniquePerms := make(map[uint]models.UserMenuPermission)
	for _, perm := range req.Permissions {
		uniquePerms[perm.MenuID] = perm
	}

	// Convert back to slice
	deduplicatedPerms := make([]models.UserMenuPermission, 0, len(uniquePerms))
	for _, perm := range uniquePerms {
		deduplicatedPerms = append(deduplicatedPerms, perm)
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Step 2: Delete ALL existing rights access for this user (hard delete)
	// Use Unscoped() to perform a hard delete instead of soft delete
	// This is necessary because the unique constraint idx_user_menu_rights
	// doesn't exclude soft-deleted records, causing duplicate key violations
	if err := tx.Unscoped().Where("user_id = ?", userID).Delete(&models.RightsAccess{}).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Step 3: Insert all new permissions
	for _, perm := range deduplicatedPerms {
		// Verify menu exists
		var menu models.Menu
		if err := tx.First(&menu, perm.MenuID).Error; err != nil {
			tx.Rollback()
			return nil, errors.New("menu not found: " + string(rune(perm.MenuID)))
		}

		// Create new rights access record
		ra := models.RightsAccess{
			UserID:    userID,
			MenuID:    perm.MenuID,
			CanRead:   perm.CanRead,
			CanWrite:  perm.CanWrite,
			CanUpdate: perm.CanUpdate,
			CanDelete: perm.CanDelete,
		}
		if err := tx.Create(&ra).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// Return updated rights
	return s.GetUserRightsAccess(userID)
}

// DeleteAllUserRightsAccess deletes all permission overrides for a user
func (s *RightsAccessService) DeleteAllUserRightsAccess(userID uint) error {
	return s.db.Where("user_id = ?", userID).Delete(&models.RightsAccess{}).Error
}
