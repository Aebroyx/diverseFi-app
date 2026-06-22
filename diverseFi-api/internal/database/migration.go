package database

import (
	"fmt"
	"log"

	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"gorm.io/gorm"
)

// RunMigrations runs all database migrations in the correct order
// Models are migrated in dependency order to ensure foreign keys are created properly
func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Step 1: Migrate independent tables first (no FK dependencies)
	log.Println("Step 1: Migrating Role and Menu tables...")
	if err := db.AutoMigrate(&models.Role{}, &models.Menu{}); err != nil {
		return fmt.Errorf("failed to migrate Role/Menu: %w", err)
	}

	// Step 2: Seed default roles BEFORE adding FK constraint to users
	log.Println("Step 2: Seeding default roles...")
	if err := seedDefaultRoles(db); err != nil {
		return fmt.Errorf("failed to seed default roles: %w", err)
	}

	// Step 3: Update existing users to have valid role_id
	log.Println("Step 3: Updating existing users with default role...")
	if err := updateExistingUsersRole(db); err != nil {
		log.Printf("Warning: Failed to update existing users: %v", err)
	}

	// Step 4: Now migrate Users table with FK constraint
	log.Println("Step 4: Migrating Users table with foreign key...")
	if err := db.AutoMigrate(&models.Users{}); err != nil {
		return fmt.Errorf("failed to migrate Users: %w", err)
	}

	// Step 5: Migrate pivot/relationship tables
	log.Println("Step 5: Migrating relationship tables...")
	relationshipModels := []interface{}{
		&models.RoleMenu{},
		&models.UserMenu{},
		&models.RightsAccess{},
	}
	if err := db.AutoMigrate(relationshipModels...); err != nil {
		return fmt.Errorf("failed to migrate relationship tables: %w", err)
	}

	// Step 6: Migrate RefreshToken and AuditLog tables
	log.Println("Step 6: Migrating RefreshToken and AuditLog tables...")
	securityModels := []interface{}{
		&models.RefreshToken{},
		&models.AuditLog{},
	}
	if err := db.AutoMigrate(securityModels...); err != nil {
		return fmt.Errorf("failed to migrate security tables: %w", err)
	}

	// Step 7: Migrate Email tables
	log.Println("Step 7: Migrating Email tables...")
	emailModels := []interface{}{
		&models.EmailTemplate{},
		&models.EmailLog{},
	}
	if err := db.AutoMigrate(emailModels...); err != nil {
		return fmt.Errorf("failed to migrate email tables: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// updateExistingUsersRole updates users with invalid role_id to default role
func updateExistingUsersRole(db *gorm.DB) error {
	// Get default role
	var defaultRole models.Role
	if err := db.Where("is_default = ?", true).First(&defaultRole).Error; err != nil {
		// Fallback to user role if no default is set
		if err := db.Where("name = ?", "user").First(&defaultRole).Error; err != nil {
			return fmt.Errorf("default role not found: %w", err)
		}
	}

	// Update users with invalid RoleID
	result := db.Model(&models.Users{}).
		Where("role_id = 0 OR role_id IS NULL").
		Update("role_id", defaultRole.ID)

	if result.RowsAffected > 0 {
		log.Printf("Updated %d existing users to default role (ID: %d)", result.RowsAffected, defaultRole.ID)
	}

	return nil
}

// seedDefaultRoles creates default roles if they don't exist
func seedDefaultRoles(db *gorm.DB) error {
	defaultRoles := []models.Role{
		{
			Name:        "root",
			DisplayName: "Root",
			Description: "Super administrator with unrestricted access",
			IsDefault:   false,
			IsActive:    true,
		},
		{
			Name:        "admin",
			DisplayName: "Administrator",
			Description: "Full system access",
			IsDefault:   false,
			IsActive:    true,
		},
		{
			Name:        "user",
			DisplayName: "User",
			Description: "Standard user access",
			IsDefault:   true,
			IsActive:    true,
		},
	}

	for _, role := range defaultRoles {
		var existing models.Role
		result := db.Where("name = ?", role.Name).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&role).Error; err != nil {
				return fmt.Errorf("failed to create role %s: %w", role.Name, err)
			}
			log.Printf("Created default role: %s (ID: %d)", role.Name, role.ID)
		} else {
			log.Printf("Role already exists: %s (ID: %d)", existing.Name, existing.ID)
		}
	}

	return nil
}

// AddModel is a helper function to add new models to migration
// Usage: Call this in RunMigrations when adding new models
// Example:
//   modelsToMigrate := []interface{}{
//       &models.Role{},
//       &models.Menu{},
//       &models.Users{},
//       &models.NewModel{}, // Add new models here
//   }
