package database

import (
	"fmt"
	"log"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB wraps the gorm.DB instance
type DB struct {
	*gorm.DB
}

// NewConnection creates a new database connection
func NewConnection(cfg *config.Config) (*DB, error) {
	// Configure GORM logger
	gormLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			LogLevel: logger.Info,
		},
	)

	// Open database connection
	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	return &DB{db}, nil
}

// Initialize runs migrations and seeders based on configuration
func (db *DB) Initialize(cfg *config.Config) error {
	// Check if auto-migration is enabled
	if !cfg.DBAutoMigrate {
		log.Println("Auto-migration is disabled (DB_AUTO_MIGRATE=false)")
		return nil
	}

	log.Println("Auto-migration is enabled")

	// Run auto-migrations
	if err := RunMigrations(db.DB); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Run seeders
	if err := RunSeeders(db.DB); err != nil {
		return fmt.Errorf("failed to run seeders: %w", err)
	}

	return nil
}
