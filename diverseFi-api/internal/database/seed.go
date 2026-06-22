package database

import (
	"fmt"
	"log"

	"github.com/diverseFi/diverseFi-api/internal/config"
	"github.com/diverseFi/diverseFi-api/internal/domain/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func seedDefaultRootUser(db *gorm.DB, cfg *config.Config) error {
	if cfg.SeedRootUsername == "" || cfg.SeedRootPassword == "" {
		log.Println("Skipping default root user seed: SEED_ROOT_PASSWORD is not set")
		return nil
	}

	var count int64
	if err := db.Model(&models.Users{}).Where("username = ?", cfg.SeedRootUsername).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check for default root user: %w", err)
	}
	if count > 0 {
		return nil
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.SeedRootPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash default root user password: %w", err)
	}

	user := models.Users{
		Username: cfg.SeedRootUsername,
		Email:    cfg.SeedRootEmail,
		Password: string(hashedPassword),
		Name:     cfg.SeedRootName,
		Role:     "admin",
	}

	if err := db.Create(&user).Error; err != nil {
		return fmt.Errorf("failed to create default root user: %w", err)
	}

	log.Printf("Created default root user %q with admin role", cfg.SeedRootUsername)
	return nil
}
