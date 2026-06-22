package services

import (
	"encoding/json"
	"time"

	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/Aebroyx/diverseFi-api/internal/pagination"
	"gorm.io/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{
		db: db,
	}
}

// Log creates a new audit log entry
func (s *AuditService) Log(req *models.CreateAuditLogRequest) error {
	auditLog := &models.AuditLog{
		UserID:        req.UserID,
		Username:      req.Username,
		Action:        req.Action,
		ResourceType:  req.ResourceType,
		ResourceID:    req.ResourceID,
		OldValues:     req.OldValues,
		NewValues:     req.NewValues,
		IPAddress:     req.IPAddress,
		UserAgent:     req.UserAgent,
		CorrelationID: req.CorrelationID,
		Timestamp:     time.Now(),
	}

	return s.db.Create(auditLog).Error
}

// LogWithContext creates an audit log with structured old/new values
func (s *AuditService) LogWithContext(
	userID *uint,
	username string,
	action string,
	resourceType string,
	resourceID string,
	oldValues interface{},
	newValues interface{},
	ipAddress string,
	userAgent string,
	correlationID string,
) error {
	var oldValuesJSON, newValuesJSON string

	if oldValues != nil {
		if jsonBytes, err := json.Marshal(oldValues); err == nil {
			oldValuesJSON = string(jsonBytes)
		}
	}

	if newValues != nil {
		if jsonBytes, err := json.Marshal(newValues); err == nil {
			newValuesJSON = string(jsonBytes)
		}
	}

	return s.Log(&models.CreateAuditLogRequest{
		UserID:        userID,
		Username:      username,
		Action:        action,
		ResourceType:  resourceType,
		ResourceID:    resourceID,
		OldValues:     oldValuesJSON,
		NewValues:     newValuesJSON,
		IPAddress:     ipAddress,
		UserAgent:     userAgent,
		CorrelationID: correlationID,
	})
}

// GetAuditLogs retrieves audit logs with pagination and filtering
func (s *AuditService) GetAuditLogs(params *models.AuditLogQueryParams) (*pagination.PaginatedResponse, error) {
	query := s.db.Model(&models.AuditLog{})

	// Apply filters
	if params.UserID != nil {
		query = query.Where("user_id = ?", *params.UserID)
	}

	if params.Username != "" {
		query = query.Where("username ILIKE ?", "%"+params.Username+"%")
	}

	if params.Action != "" {
		query = query.Where("action = ?", params.Action)
	}

	if params.ResourceType != "" {
		query = query.Where("resource_type = ?", params.ResourceType)
	}

	if params.ResourceID != "" {
		query = query.Where("resource_id = ?", params.ResourceID)
	}

	if params.IPAddress != "" {
		query = query.Where("ip_address = ?", params.IPAddress)
	}

	if params.CorrelationID != "" {
		query = query.Where("correlation_id = ?", params.CorrelationID)
	}

	if !params.StartDate.IsZero() {
		query = query.Where("timestamp >= ?", params.StartDate)
	}

	if !params.EndDate.IsZero() {
		query = query.Where("timestamp <= ?", params.EndDate)
	}

	// Set default pagination
	if params.Page < 1 {
		params.Page = 1
	}
	if params.Limit < 1 {
		params.Limit = 20
	}
	if params.Limit > 100 {
		params.Limit = 100
	}

	// Set default sorting
	sortBy := "timestamp"
	if params.SortBy != "" {
		sortBy = params.SortBy
	}
	sortOrder := "DESC"
	if params.SortOrder != "" {
		sortOrder = params.SortOrder
	}

	// Apply sorting
	query = query.Order(sortBy + " " + sortOrder)

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Get paginated data
	var auditLogs []models.AuditLog
	offset := (params.Page - 1) * params.Limit

	if err := query.Preload("User").
		Limit(params.Limit).
		Offset(offset).
		Find(&auditLogs).Error; err != nil {
		return nil, err
	}

	// Convert to response format
	responses := make([]models.AuditLogResponse, len(auditLogs))
	for i, log := range auditLogs {
		responses[i] = models.AuditLogResponse{
			ID:            log.ID,
			UserID:        log.UserID,
			Username:      log.Username,
			Action:        log.Action,
			ResourceType:  log.ResourceType,
			ResourceID:    log.ResourceID,
			OldValues:     log.OldValues,
			NewValues:     log.NewValues,
			IPAddress:     log.IPAddress,
			UserAgent:     log.UserAgent,
			CorrelationID: log.CorrelationID,
			Timestamp:     log.Timestamp,
		}
	}

	totalPages := int((total + int64(params.Limit) - 1) / int64(params.Limit))

	return &pagination.PaginatedResponse{
		Data:       responses,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetUserAuditLogs retrieves audit logs for a specific user
func (s *AuditService) GetUserAuditLogs(userID uint, page, limit int) (*pagination.PaginatedResponse, error) {
	params := &models.AuditLogQueryParams{
		UserID: &userID,
		Page:   page,
		Limit:  limit,
	}
	return s.GetAuditLogs(params)
}

// GetResourceAuditLogs retrieves audit logs for a specific resource
func (s *AuditService) GetResourceAuditLogs(resourceType, resourceID string, page, limit int) (*pagination.PaginatedResponse, error) {
	params := &models.AuditLogQueryParams{
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Page:         page,
		Limit:        limit,
	}
	return s.GetAuditLogs(params)
}

// CleanupOldLogs removes audit logs older than specified days (should be run periodically)
func (s *AuditService) CleanupOldLogs(daysToKeep int) error {
	cutoffDate := time.Now().AddDate(0, 0, -daysToKeep)

	return s.db.Where("timestamp < ?", cutoffDate).
		Delete(&models.AuditLog{}).Error
}
