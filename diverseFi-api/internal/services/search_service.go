package services

import (
	"sync"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"gorm.io/gorm"
)

type SearchService struct {
	db                *gorm.DB
	config            *config.Config
	permissionService *PermissionService
}

func NewSearchService(db *gorm.DB, config *config.Config, permissionService *PermissionService) *SearchService {
	return &SearchService{
		db:                db,
		config:            config,
		permissionService: permissionService,
	}
}

// GlobalSearch searches across users, roles, and menus with permission filtering
func (s *SearchService) GlobalSearch(query string, limit int, userID uint, roleID uint, roleName string) (*models.GlobalSearchResponse, error) {
	if limit <= 0 {
		limit = 5 // Default limit per category
	}

	var canReadUsers, canReadRoles, canReadMenus bool

	// Bypass permission checks for root and admin users
	if roleName == "root" || roleName == "admin" {
		canReadUsers = true
		canReadRoles = true
		canReadMenus = true
	} else {
		// Get user permissions for non-admin users
		userPermissions, err := s.permissionService.GetUserPermissions(userID, roleID)
		if err != nil {
			return nil, err
		}

		// Check permissions for each resource type
		canReadUsers = userPermissions.CheckPermission("/users-management", config.PermissionRead)
		canReadRoles = userPermissions.CheckPermission("/roles-management", config.PermissionRead)
		canReadMenus = userPermissions.CheckPermission("/menus-management", config.PermissionRead)
	}

	var wg sync.WaitGroup
	var usersErr, rolesErr, menusErr error

	response := &models.GlobalSearchResponse{
		Users: []models.SearchUser{},
		Roles: []models.SearchRole{},
		Menus: []models.SearchMenu{},
	}

	searchPattern := "%" + query + "%"

	// Search users in parallel (only if user has permission)
	if canReadUsers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			var users []models.Users
			usersErr = s.db.
				Where("is_deleted = ?", false).
				Where("name ILIKE ? OR email ILIKE ? OR username ILIKE ?", searchPattern, searchPattern, searchPattern).
				Limit(limit).
				Find(&users).Error

			if usersErr == nil {
				for _, u := range users {
					response.Users = append(response.Users, models.SearchUser{
						ID:       u.ID,
						Name:     u.Name,
						Email:    u.Email,
						Username: u.Username,
					})
				}
			}
		}()
	}

	// Search roles in parallel (only if user has permission)
	if canReadRoles {
		wg.Add(1)
		go func() {
			defer wg.Done()
			var roles []models.Role
			rolesErr = s.db.
				Where("name ILIKE ? OR display_name ILIKE ?", searchPattern, searchPattern).
				Limit(limit).
				Find(&roles).Error

			if rolesErr == nil {
				for _, r := range roles {
					response.Roles = append(response.Roles, models.SearchRole{
						ID:          r.ID,
						Name:        r.Name,
						DisplayName: r.DisplayName,
					})
				}
			}
		}()
	}

	// Search menus in parallel (only if user has permission)
	if canReadMenus {
		wg.Add(1)
		go func() {
			defer wg.Done()
			var menus []models.Menu
			menusErr = s.db.
				Where("is_active = ?", true).
				Where("name ILIKE ? OR path ILIKE ?", searchPattern, searchPattern).
				Limit(limit).
				Find(&menus).Error

			if menusErr == nil {
				for _, m := range menus {
					response.Menus = append(response.Menus, models.SearchMenu{
						ID:   m.ID,
						Name: m.Name,
						Path: m.Path,
						Icon: m.Icon,
					})
				}
			}
		}()
	}

	wg.Wait()

	// Return first error encountered
	if usersErr != nil {
		return nil, usersErr
	}
	if rolesErr != nil {
		return nil, rolesErr
	}
	if menusErr != nil {
		return nil, menusErr
	}

	return response, nil
}
