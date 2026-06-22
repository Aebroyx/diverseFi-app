package services

import (
	"errors"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/config"
	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"github.com/golang-jwt/jwt/v5"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	db           *gorm.DB
	config       *config.Config
	tokenService *TokenService
}

// UserQueryParams represents the query parameters for user listing
type UserQueryParams struct {
	Page     int    `json:"page" form:"page" binding:"min=1"`
	PageSize int    `json:"pageSize" form:"pageSize" binding:"min=1,max=100"`
	Search   string `json:"search" form:"search"`
	RoleID   uint   `json:"role_id" form:"role_id"`
	SortBy   string `json:"sortBy" form:"sortBy" binding:"omitempty,oneof=name email role_id created_at"`
	SortDesc bool   `json:"sortDesc" form:"sortDesc"`
}

// UserListResponse represents the paginated response for user listing
type UserListResponse struct {
	Data       []models.Users `json:"data"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"pageSize"`
	TotalPages int            `json:"totalPages"`
}

func NewUserService(db *gorm.DB, config *config.Config, tokenService *TokenService) *UserService {
	return &UserService{
		db:           db,
		config:       config,
		tokenService: tokenService,
	}
}

// Register creates a new user with the provided registration data
func (s *UserService) Register(req *models.RegisterRequest) (*models.RegisterResponse, error) {
	// Check if username already exists
	var existingUser models.Users
	if err := s.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return nil, errors.New("username already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Check if email already exists
	if err := s.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("email already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Get default role
	var defaultRole models.Role
	if err := s.db.Where("is_default = ?", true).First(&defaultRole).Error; err != nil {
		// Fallback to user role if no default
		if err := s.db.Where("name = ?", "user").First(&defaultRole).Error; err != nil {
			return nil, errors.New("default role not found")
		}
	}

	// Create new user with RoleID
	user := models.Users{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		RoleID:   defaultRole.ID,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	// Preload role for response
	s.db.Preload("Role").First(&user, user.ID)

	// Return user data without password
	return &models.RegisterResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Name:     user.Name,
		IsActive: user.IsActive,
		Role: models.RoleResponse{
			ID:          user.Role.ID,
			Name:        user.Role.Name,
			DisplayName: user.Role.DisplayName,
			Description: user.Role.Description,
			IsDefault:   user.Role.IsDefault,
			IsActive:    user.Role.IsActive,
			CreatedAt:   user.Role.CreatedAt,
			UpdatedAt:   user.Role.UpdatedAt,
		},
	}, nil
}

// Login authenticates a user and returns tokens
// Deprecated: Use LoginWithContext instead
func (s *UserService) Login(req *models.LoginRequest) (*models.LoginResponse, error) {
	return s.LoginWithContext(req, "", "")
}

// LoginWithContext authenticates a user and returns tokens with IP and UserAgent tracking
func (s *UserService) LoginWithContext(req *models.LoginRequest, ipAddress, userAgent string) (*models.LoginResponse, error) {
	// Find user by username with role preloaded
	var user models.Users
	if err := s.db.Preload("Role").Where("username = ?", req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid username or password")
		}
		return nil, err
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid username or password")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("user is not active")
	}

	// Generate access token (JWT)
	accessToken, accessExp, err := s.generateToken(user, s.config.JWTExpiry)
	if err != nil {
		return nil, err
	}

	// Create refresh token in database (if tokenService is available)
	var refreshTokenStr string
	if s.tokenService != nil {
		refreshToken, err := s.tokenService.CreateRefreshToken(user.ID, ipAddress, userAgent)
		if err != nil {
			return nil, err
		}
		refreshTokenStr = refreshToken.Token
	} else {
		// Fallback to JWT-based refresh token for backward compatibility
		refreshTokenStr, _, err = s.generateToken(user, s.config.RefreshTokenExpiry)
		if err != nil {
			return nil, err
		}
	}

	// Create response
	return &models.LoginResponse{
		User: models.RegisterResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Name:     user.Name,
			IsActive: user.IsActive,
			Role: models.RoleResponse{
				ID:          user.Role.ID,
				Name:        user.Role.Name,
				DisplayName: user.Role.DisplayName,
				Description: user.Role.Description,
				IsDefault:   user.Role.IsDefault,
				IsActive:    user.Role.IsActive,
				CreatedAt:   user.Role.CreatedAt,
				UpdatedAt:   user.Role.UpdatedAt,
			},
		},
		Token: models.TokenResponse{
			AccessToken:  accessToken,
			RefreshToken: refreshTokenStr,
			TokenType:    "Bearer",
			ExpiresIn:    int64(time.Until(accessExp).Seconds()),
		},
	}, nil
}

// generateToken generates a JWT token for the user
func (s *UserService) generateToken(user models.Users, expiry time.Duration) (string, time.Time, error) {
	expirationTime := time.Now().Add(expiry)
	claims := &models.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RoleID:   user.RoleID,
		RoleName: user.Role.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "diversefi-api",
			Subject:   user.Username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

// GetAllUsers retrieves users with pagination, search, and filters
func (s *UserService) GetAllUsers(params pagination.QueryParams) (*pagination.PaginatedResponse, error) {
	config := pagination.PaginationConfig{
		Model: &models.Users{},
		BaseCondition: map[string]interface{}{
			"is_deleted": false,
		},
		SearchFields: []string{"name", "email", "username"},
		FilterFields: map[string]string{
			"role_id":    "role_id",
			"name":       "name",
			"email":      "email",
			"username":   "username",
			"created_at": "created_at",
			"updated_at": "updated_at",
		},
		DateFields: map[string]pagination.DateField{
			"created_at": {
				Start: "created_at",
				End:   "created_at",
			},
			"updated_at": {
				Start: "updated_at",
				End:   "updated_at",
			},
		},
		SortFields: []string{
			"name",
			"email",
			"role_id",
			"created_at",
			"updated_at",
		},
		DefaultSort:  "created_at",
		DefaultOrder: "DESC",
		Relations:    []string{"Role"},
	}

	paginator := pagination.NewPaginator(s.db)
	return paginator.Paginate(params, config)
}

func (s *UserService) GetUserById(id string) (models.Users, error) {
	var user models.Users
	if err := s.db.Preload("Role").Where("id = ?", id).First(&user).Error; err != nil {
		return models.Users{}, err
	}
	return user, nil
}

// CreateUser creates a new user with the provided data
func (s *UserService) CreateUser(req *models.CreateUserRequest) (*models.CreateUserResponse, error) {
	// Check if username already exists
	var existingUser models.Users
	if err := s.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return nil, errors.New("username already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Check if email already exists
	if err := s.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("email already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Validate role exists
	var role models.Role
	if err := s.db.First(&role, req.RoleID).Error; err != nil {
		return nil, errors.New("invalid role")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Validate IsActive is provided
	if req.IsActive == nil {
		return nil, errors.New("is_active is required")
	}

	// Create new user
	user := models.Users{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		RoleID:   req.RoleID,
		IsActive: *req.IsActive,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	// Preload role for response
	s.db.Preload("Role").First(&user, user.ID)

	// Return user data without password
	return &models.CreateUserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Name:     user.Name,
		IsActive: user.IsActive,
		Role: models.RoleResponse{
			ID:          user.Role.ID,
			Name:        user.Role.Name,
			DisplayName: user.Role.DisplayName,
			Description: user.Role.Description,
			IsDefault:   user.Role.IsDefault,
			IsActive:    user.Role.IsActive,
			CreatedAt:   user.Role.CreatedAt,
			UpdatedAt:   user.Role.UpdatedAt,
		},
		CreatedAt: user.CreatedAt,
	}, nil
}

func (s *UserService) UpdateUser(id string, req *models.UpdateUserRequest) (*models.Users, error) {
	var user models.Users
	if err := s.db.Preload("Role").Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}

	// Validate role exists if being changed
	if req.RoleID != user.RoleID {
		var role models.Role
		if err := s.db.First(&role, req.RoleID).Error; err != nil {
			return nil, errors.New("invalid role")
		}
	}

	// Validate IsActive is provided
	if req.IsActive == nil {
		return nil, errors.New("is_active is required")
	}

	// Update user fields
	user.Username = req.Username
	user.Email = req.Email
	user.Name = req.Name
	user.RoleID = req.RoleID
	user.IsActive = *req.IsActive

	// Only update password if provided
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashedPassword)
	}

	// Update user - use Select to explicitly specify fields to update (including is_active even when false)
	fieldsToUpdate := []string{"username", "email", "name", "role_id", "is_active"}
	if req.Password != "" {
		fieldsToUpdate = append(fieldsToUpdate, "password")
	}

	if err := s.db.Model(&user).Select(fieldsToUpdate).Updates(&user).Error; err != nil {
		return nil, err
	}

	// Reload with role
	s.db.Preload("Role").First(&user, user.ID)

	return &user, nil
}

func (s *UserService) DeleteUser(id string) (*models.Users, error) {
	var user models.Users
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		// First, get the user to verify it exists
		if err := tx.Where("id = ?", id).First(&user).Error; err != nil {
			return err
		}

		// Prevent deletion of root user only
		if user.Username == "root" || user.Email == "root@localhost" {
			return errors.New("cannot delete root user")
		}

		// Mark as deleted (in addition to Gorm's soft delete)
		if err := tx.Model(&models.Users{}).Where("id = ?", id).Updates(map[string]interface{}{
			"is_deleted": true,
		}).Error; err != nil {
			return err
		}

		// Soft delete the user (sets deleted_at)
		if err := tx.Where("id = ?", id).Delete(&user).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) ResetUserPassword(id string, req *models.ResetUserPasswordRequest) (*models.Users, error) {
	var user models.Users
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		return nil, errors.New("invalid current password")
	}

	// Verify new password and confirm password
	if req.NewPassword != req.ConfirmPassword {
		return nil, errors.New("new password and confirm password do not match")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Update user password
	user.Password = string(hashedPassword)

	// Update user
	if err := s.db.Model(&user).Updates(&user).Error; err != nil {
		return nil, err
	}

	// Reload with role
	s.db.Preload("Role").First(&user, user.ID)

	return &user, nil
}
