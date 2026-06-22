package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server config
	Environment string
	ServerPort  string
	ServerHost  string

	// Database config
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBSSLMode     string
	DBAutoMigrate bool

	// JWT config
	JWTSecret          string
	JWTExpiry          time.Duration
	RefreshTokenExpiry time.Duration

	// CORS config
	CORSAllowedOrigins string

	// Logging
	LogLevel string

	// Rate Limiting
	RateLimitEnabled   bool
	RateLimitPerIP     int
	RateLimitPerUser   int
	RateLimitWindow    time.Duration

	// Email config (Resend)
	ResendAPIKey          string
	EmailFromAddress      string
	EmailFromName         string
	EmailEnabled          bool
	EmailRateLimitPerMin  int
	EmailRateLimitPerHour int
	TestEmailAddress      string
}

// Load loads the configuration from environment variables
func Load() (*Config, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		return nil, fmt.Errorf("error loading .env file: %v", err)
	}

	// Parse JWT expiry duration
	jwtExpiry, err := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRY format: %v", err)
	}

	// Parse refresh token expiry duration
	refreshTokenExpiry, err := time.ParseDuration(getEnv("REFRESH_TOKEN_EXPIRY", "168h"))
	if err != nil {
		return nil, fmt.Errorf("invalid REFRESH_TOKEN_EXPIRY format: %v", err)
	}

	// Parse rate limit window duration
	rateLimitWindow, err := time.ParseDuration(getEnv("RATE_LIMIT_WINDOW", "1h"))
	if err != nil {
		return nil, fmt.Errorf("invalid RATE_LIMIT_WINDOW format: %v", err)
	}

	return &Config{
		// Server config
		Environment: getEnv("APP_ENV", "development"),
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		ServerHost:  getEnv("SERVER_HOST", "localhost"),

		// Database config
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "5432"),
		DBUser:        getEnv("DB_USER", "postgres"),
		DBPassword:    getEnv("DB_PASSWORD", ""),
		DBName:        getEnv("DB_NAME", "diversefi_db"),
		DBSSLMode:     getEnv("DB_SSL_MODE", "disable"),
		DBAutoMigrate: getEnv("DB_AUTO_MIGRATE", "true") == "true",

		// JWT config
		JWTSecret:          getEnv("JWT_SECRET", ""),
		JWTExpiry:          jwtExpiry,
		RefreshTokenExpiry: refreshTokenExpiry,

		// CORS config
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000"),

		// Logging
		LogLevel: getEnv("LOG_LEVEL", "debug"),

		// Rate Limiting
		RateLimitEnabled: getEnv("RATE_LIMIT_ENABLED", "true") == "true",
		RateLimitPerIP:   getEnvInt("RATE_LIMIT_PER_IP", 100),
		RateLimitPerUser: getEnvInt("RATE_LIMIT_PER_USER", 1000),
		RateLimitWindow:  rateLimitWindow,

		// Email config (Resend)
		ResendAPIKey:          getEnv("RESEND_API_KEY", ""),
		EmailFromAddress:      getEnv("EMAIL_FROM_ADDRESS", "noreply@localhost"),
		EmailFromName:         getEnv("EMAIL_FROM_NAME", "DiverseFi"),
		EmailEnabled:          getEnv("EMAIL_ENABLED", "false") == "true",
		EmailRateLimitPerMin:  getEnvInt("EMAIL_RATE_LIMIT_PER_MINUTE", 60),
		EmailRateLimitPerHour: getEnvInt("EMAIL_RATE_LIMIT_PER_HOUR", 500),
		TestEmailAddress:      getEnv("TEST_EMAIL_ADDRESS", "test@example.com"),
	}, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt gets an environment variable as int or returns a default value
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var intValue int
		if _, err := fmt.Sscanf(value, "%d", &intValue); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// Validate checks if the configuration is valid
func (c *Config) Validate() error {
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}

	if c.DBPassword == "" {
		return fmt.Errorf("DB_PASSWORD is required")
	}

	return nil
}

// GetDSN returns the database connection string
func (c *Config) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

// GetServerAddr returns the server address
func (c *Config) GetServerAddr() string {
	return fmt.Sprintf("%s:%s", c.ServerHost, c.ServerPort)
}
