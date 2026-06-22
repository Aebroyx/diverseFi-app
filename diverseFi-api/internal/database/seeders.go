package database

import (
	"fmt"
	"log"

	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// RunSeeders runs all database seeders
// Note: Default roles are now seeded during migration (see migration.go)
// This function is available for additional seeding operations
func RunSeeders(db *gorm.DB) error {
	log.Println("Running additional database seeders...")

	// Seed default menus
	if err := SeedDefaultMenus(db); err != nil {
		log.Printf("Warning: Failed to seed default menus: %v", err)
	}

	// Seed default role-menu permissions
	if err := SeedDefaultRoleMenus(db); err != nil {
		log.Printf("Warning: Failed to seed default role-menu permissions: %v", err)
	}

	// Seed default root user with full permissions
	if err := SeedDefaultRootUser(db); err != nil {
		log.Printf("Warning: Failed to seed default root user: %v", err)
	}

	log.Println("Database seeders completed successfully")
	return nil
}

// SeedDefaultMenus seeds default menu items (optional - call manually if needed)
func SeedDefaultMenus(db *gorm.DB) error {
	// Step 1: Create parent menus (Dashboard and Configurations)
	parentMenus := []models.Menu{
		{
			Name:       "Dashboard",
			Path:       "/dashboard",
			Icon:       "HomeIcon",
			OrderIndex: 0,
			ParentID:   nil,
			IsActive:   true,
		},
		{
			Name:       "Configurations",
			Path:       "/user-management",
			Icon:       "CogIcon",
			OrderIndex: 1,
			ParentID:   nil,
			IsActive:   true,
		},
	}

	for _, menu := range parentMenus {
		var existing models.Menu
		result := db.Where("name = ? AND parent_id IS NULL", menu.Name).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&menu).Error; err != nil {
				return fmt.Errorf("failed to create menu %s: %w", menu.Name, err)
			}
			log.Printf("Created default menu: %s (ID: %d)", menu.Name, menu.ID)
		} else {
			log.Printf("Menu already exists: %s (ID: %d)", existing.Name, existing.ID)
		}
	}

	// Step 2: Get Configurations menu ID for child menus
	var configurationsMenu models.Menu
	if err := db.Where("name = ? AND parent_id IS NULL", "Configurations").First(&configurationsMenu).Error; err != nil {
		return fmt.Errorf("failed to find Configurations menu: %w", err)
	}

	// Step 3: Create child menus under Configurations
	childMenus := []models.Menu{
		{
			Name:       "Users Management",
			Path:       "/users-management",
			Icon:       "UsersIcon",
			OrderIndex: 0,
			ParentID:   &configurationsMenu.ID,
			IsActive:   true,
		},
		{
			Name:       "Roles Management",
			Path:       "/roles-management",
			Icon:       "ShieldCheckIcon",
			OrderIndex: 1,
			ParentID:   &configurationsMenu.ID,
			IsActive:   true,
		},
		{
			Name:       "Menu Management",
			Path:       "/menus-management",
			Icon:       "Squares2X2Icon",
			OrderIndex: 2,
			ParentID:   &configurationsMenu.ID,
			IsActive:   true,
		},
		{
			Name:       "Audit Logs",
			Path:       "/audit-logs",
			Icon:       "Clipboard",
			OrderIndex: 100,
			ParentID:   &configurationsMenu.ID,
			IsActive:   true,
		},
		{
			Name:       "Email Logs",
			Path:       "/email-logs",
			Icon:       "Envelope",
			OrderIndex: 101,
			ParentID:   &configurationsMenu.ID,
			IsActive:   true,
		},
	}

	for _, menu := range childMenus {
		var existing models.Menu
		result := db.Where("name = ? AND parent_id = ?", menu.Name, configurationsMenu.ID).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&menu).Error; err != nil {
				return fmt.Errorf("failed to create menu %s: %w", menu.Name, err)
			}
			log.Printf("Created default menu: %s (ID: %d, Parent: %d)", menu.Name, menu.ID, configurationsMenu.ID)
		} else {
			log.Printf("Menu already exists: %s (ID: %d, Parent: %d)", existing.Name, existing.ID, *existing.ParentID)
		}
	}

	return nil
}

// SeedDefaultRoleMenus seeds default role-menu permissions for root, admin, and user roles
func SeedDefaultRoleMenus(db *gorm.DB) error {
	log.Println("Seeding default role-menu permissions...")

	// Step 1: Get all roles
	roles := []string{"root", "admin", "user"}
	roleMap := make(map[string]models.Role)

	for _, roleName := range roles {
		var role models.Role
		if err := db.Where("name = ?", roleName).First(&role).Error; err != nil {
			log.Printf("Warning: Role '%s' not found, skipping: %v", roleName, err)
			continue
		}
		roleMap[roleName] = role
		log.Printf("Found role: %s (ID: %d)", roleName, role.ID)
	}

	// Step 2: Get all menus
	var menus []models.Menu
	if err := db.Order("order_index ASC").Find(&menus).Error; err != nil {
		return fmt.Errorf("failed to fetch menus: %w", err)
	}
	log.Printf("Found %d menus", len(menus))

	// Step 3: Define permissions per role
	type RolePermissions struct {
		MenuFilter func(models.Menu) bool // Function to filter which menus this role can access
		CanRead    bool
		CanWrite   bool
		CanUpdate  bool
		CanDelete  bool
	}

	rolePermissions := map[string]RolePermissions{
		"root": {
			MenuFilter: func(m models.Menu) bool { return true }, // All menus
			CanRead:    true,
			CanWrite:   true,
			CanUpdate:  true,
			CanDelete:  true,
		},
		"admin": {
			MenuFilter: func(m models.Menu) bool { return true }, // All menus
			CanRead:    true,
			CanWrite:   true,
			CanUpdate:  true,
			CanDelete:  true,
		},
		"user": {
			MenuFilter: func(m models.Menu) bool {
				// User can only access Dashboard
				return m.Name == "Dashboard"
			},
			CanRead:   true,
			CanWrite:  false,
			CanUpdate: false,
			CanDelete: false,
		},
	}

	// Step 4: Create role-menu associations
	createdCount := 0
	skippedCount := 0

	for roleName, permissions := range rolePermissions {
		role, exists := roleMap[roleName]
		if !exists {
			continue
		}

		for _, menu := range menus {
			// Check if this menu should be accessible to this role
			if !permissions.MenuFilter(menu) {
				continue
			}

			// Check if role-menu entry already exists
			var existingRoleMenu models.RoleMenu
			result := db.Where("role_id = ? AND menu_id = ?", role.ID, menu.ID).First(&existingRoleMenu)

			if result.Error == gorm.ErrRecordNotFound {
				// Create new role-menu entry
				roleMenu := models.RoleMenu{
					RoleID:    role.ID,
					MenuID:    menu.ID,
					CanRead:   permissions.CanRead,
					CanWrite:  permissions.CanWrite,
					CanUpdate: permissions.CanUpdate,
					CanDelete: permissions.CanDelete,
				}

				if err := db.Create(&roleMenu).Error; err != nil {
					log.Printf("Warning: Failed to create role-menu for %s - %s: %v", roleName, menu.Name, err)
					continue
				}

				createdCount++
				log.Printf("Created role-menu: %s -> %s (R:%t, W:%t, U:%t, D:%t)",
					roleName, menu.Name,
					permissions.CanRead, permissions.CanWrite,
					permissions.CanUpdate, permissions.CanDelete)
			} else if result.Error != nil {
				log.Printf("Warning: Failed to check existing role-menu for %s - %s: %v", roleName, menu.Name, result.Error)
			} else {
				skippedCount++
				log.Printf("Role-menu already exists: %s -> %s", roleName, menu.Name)
			}
		}
	}

	log.Printf("Role-menu seeding completed: %d created, %d skipped", createdCount, skippedCount)
	return nil
}

// SeedDefaultRootUser creates a default root user with full permissions for all menus
func SeedDefaultRootUser(db *gorm.DB) error {
	// Step 1: Check if root user already exists
	var existingUser models.Users
	result := db.Where("username = ?", "root").First(&existingUser)
	if result.Error != gorm.ErrRecordNotFound {
		if result.Error == nil {
			log.Printf("Root user already exists (ID: %d)", existingUser.ID)
			return nil
		}
		return fmt.Errorf("failed to check for existing root user: %w", result.Error)
	}

	// Step 2: Get root role
	var rootRole models.Role
	if err := db.Where("name = ?", "root").First(&rootRole).Error; err != nil {
		return fmt.Errorf("failed to find root role: %w", err)
	}

	// Step 3: Hash the default password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("P@ssw0rd"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Step 4: Create root user
	rootUser := models.Users{
		Username: "root",
		Email:    "root@localhost",
		Password: string(hashedPassword),
		Name:     "Root User",
		RoleID:   rootRole.ID,
	}

	if err := db.Create(&rootUser).Error; err != nil {
		return fmt.Errorf("failed to create root user: %w", err)
	}

	log.Printf("Created default root user (ID: %d, Username: root, Password: P@ssw0rd)", rootUser.ID)
	log.Printf("Root user will inherit full permissions from 'root' role via role_menus table")

	return nil
}
