package pagination

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// JoinType represents the type of join
type JoinType string

const (
	LeftJoin  JoinType = "LEFT"
	InnerJoin JoinType = "INNER"
	RightJoin JoinType = "RIGHT"
)

// FilterOperator represents the type of filter operation
type FilterOperator string

const (
	OpEquals             FilterOperator = "equals"
	OpNotEquals          FilterOperator = "notEquals"
	OpContains           FilterOperator = "contains"
	OpNotContains        FilterOperator = "notContains"
	OpStartsWith         FilterOperator = "startsWith"
	OpEndsWith           FilterOperator = "endsWith"
	OpGreaterThan        FilterOperator = "greaterThan"
	OpLessThan           FilterOperator = "lessThan"
	OpGreaterThanOrEqual FilterOperator = "greaterThanOrEqual"
	OpLessThanOrEqual    FilterOperator = "lessThanOrEqual"
	OpIs                 FilterOperator = "is"
	OpIsNot              FilterOperator = "isNot"
	OpIsEmpty            FilterOperator = "isEmpty"
	OpIsNotEmpty         FilterOperator = "isNotEmpty"
)

// FilterCondition represents an advanced filter condition
type FilterCondition struct {
	ID       string         `json:"id"`
	Field    string         `json:"field"`
	Operator FilterOperator `json:"operator"`
	Value    string         `json:"value"`
	Logic    string         `json:"logic"` // "and" or "or"
}

// JoinConfig represents a join configuration
type JoinConfig struct {
	Table     string   // Table to join with
	Condition string   // Join condition
	Type      JoinType // Type of join (LEFT, INNER, RIGHT)
	Alias     string   // Optional alias for the joined table
}

// SelectField represents a field to select in the query
type SelectField struct {
	Field string // Field name or expression
	Alias string // Optional alias for the field
}

// QueryParams represents the common query parameters for pagination
type QueryParams struct {
	Page             int                    `json:"page" form:"page" binding:"min=1"`
	PageSize         int                    `json:"pageSize" form:"pageSize" binding:"min=1,max=100"`
	Search           string                 `json:"search" form:"search"`
	Filters          map[string]interface{} `json:"-" form:"-"` // Legacy filters (handled manually in Bind)
	FilterConditions []FilterCondition      `json:"-" form:"-"` // Advanced filter conditions (handled manually in Bind)
	SortBy           string                 `json:"sortBy" form:"sortBy"`
	SortDesc         bool                   `json:"sortDesc" form:"sortDesc"`
	Dates            map[string]DateRange   `json:"dates" form:"dates"`
}

// Custom binding for filters
func (qp *QueryParams) Bind(c *gin.Context) error {
	// Bind all standard query parameters (filters are excluded via form:"-" tag)
	if err := c.ShouldBindQuery(qp); err != nil {
		return err
	}

	// Check if we have advanced filters in JSON format
	filtersJSON := c.Query("filters")
	if filtersJSON != "" {
		// Try to parse as advanced filter conditions (new format)
		var conditions []FilterCondition
		if err := json.Unmarshal([]byte(filtersJSON), &conditions); err == nil {
			qp.FilterConditions = conditions
			return nil
		}
		// If parsing fails, it might be old format, continue to legacy handling
	}

	// Handle legacy filters separately (backward compatibility)
	// Look for filters[field]=value format in query string
	filters := make(map[string]interface{})
	for key, values := range c.Request.URL.Query() {
		if strings.HasPrefix(key, "filters[") && strings.HasSuffix(key, "]") {
			// Extract the field name from filters[field]
			field := key[8 : len(key)-1]
			if len(values) > 0 {
				filters[field] = values[0]
			}
		}
	}
	if len(filters) > 0 {
		qp.Filters = filters
	}

	return nil
}

// DateRange represents a date range filter
type DateRange struct {
	Start *time.Time `json:"start" form:"start"`
	End   *time.Time `json:"end" form:"end"`
}

// DateField represents a date field configuration
type DateField struct {
	Start string // Database column name for start date
	End   string // Database column name for end date
}

// PaginationConfig holds the configuration for pagination
type PaginationConfig struct {
	Model         interface{}            // The model to query (e.g., &models.Users{})
	BaseCondition map[string]interface{} // Base conditions (e.g., is_deleted = false)
	SearchFields  []string               // Fields to search in (e.g., ["name", "email", "username"])
	FilterFields  map[string]string      // Fields that can be filtered (e.g., {"role": "role"})
	DateFields    map[string]DateField   // Fields that are dates
	SortFields    []string               // Fields that can be sorted
	DefaultSort   string                 // Default sort field
	DefaultOrder  string                 // Default sort order ("ASC" or "DESC")
	Relations     []string               // Relations to preload
	Joins         []JoinConfig           // Joins to apply
	SelectFields  []SelectField          // Custom select fields
	GroupBy       []string               // Group by clauses
	Having        []string               // Having clauses
	Distinct      bool                   // Whether to use DISTINCT
	TableAlias    string                 // Alias for the main table
}

// PaginatedResponse represents the standard pagination response
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// Paginator handles the pagination logic
type Paginator struct {
	db *gorm.DB
}

// NewPaginator creates a new paginator instance
func NewPaginator(db *gorm.DB) *Paginator {
	return &Paginator{db: db}
}

// buildSelectClause builds the SELECT clause for the query
func (p *Paginator) buildSelectClause(config PaginationConfig) *gorm.DB {
	query := p.db.Model(config.Model)

	// Apply table alias if provided
	if config.TableAlias != "" {
		query = query.Table(fmt.Sprintf("%s AS %s",
			query.Statement.Table, config.TableAlias))
	}

	// Apply custom select fields if provided
	if len(config.SelectFields) > 0 {
		selectClause := make([]string, len(config.SelectFields))
		for i, field := range config.SelectFields {
			if field.Alias != "" {
				selectClause[i] = fmt.Sprintf("%s AS %s", field.Field, field.Alias)
			} else {
				selectClause[i] = field.Field
			}
		}
		query = query.Select(strings.Join(selectClause, ", "))
	}

	// Apply DISTINCT if needed
	if config.Distinct {
		query = query.Distinct()
	}

	return query
}

// buildJoinClause builds the JOIN clauses for the query
func (p *Paginator) buildJoinClause(query *gorm.DB, config PaginationConfig) *gorm.DB {
	for _, join := range config.Joins {
		joinClause := fmt.Sprintf("%s JOIN %s", join.Type, join.Table)
		if join.Alias != "" {
			joinClause += fmt.Sprintf(" AS %s", join.Alias)
		}
		joinClause += fmt.Sprintf(" ON %s", join.Condition)
		query = query.Joins(joinClause)
	}
	return query
}

// applyFilterCondition applies a single filter condition to the query
func (p *Paginator) applyFilterCondition(condition FilterCondition, dbField string) (string, []interface{}) {
	switch condition.Operator {
	case OpEquals, OpIs:
		return dbField + " = ?", []interface{}{condition.Value}
	case OpNotEquals, OpIsNot:
		return dbField + " != ?", []interface{}{condition.Value}
	case OpContains:
		return dbField + " ILIKE ?", []interface{}{"%" + condition.Value + "%"}
	case OpNotContains:
		return dbField + " NOT ILIKE ?", []interface{}{"%" + condition.Value + "%"}
	case OpStartsWith:
		return dbField + " ILIKE ?", []interface{}{condition.Value + "%"}
	case OpEndsWith:
		return dbField + " ILIKE ?", []interface{}{"%" + condition.Value}
	case OpGreaterThan:
		return dbField + " > ?", []interface{}{condition.Value}
	case OpLessThan:
		return dbField + " < ?", []interface{}{condition.Value}
	case OpGreaterThanOrEqual:
		return dbField + " >= ?", []interface{}{condition.Value}
	case OpLessThanOrEqual:
		return dbField + " <= ?", []interface{}{condition.Value}
	case OpIsEmpty:
		return "(" + dbField + " IS NULL OR " + dbField + " = '')", []interface{}{}
	case OpIsNotEmpty:
		return "(" + dbField + " IS NOT NULL AND " + dbField + " != '')", []interface{}{}
	default:
		return dbField + " = ?", []interface{}{condition.Value}
	}
}

// buildWhereClause builds the WHERE clause for the query
func (p *Paginator) buildWhereClause(query *gorm.DB, params QueryParams, config PaginationConfig) *gorm.DB {
	// Apply base conditions
	for field, value := range config.BaseCondition {
		query = query.Where(field+" = ?", value)
	}

	// Apply search if provided
	if params.Search != "" && len(config.SearchFields) > 0 {
		searchQuery := "%" + params.Search + "%"
		searchConditions := make([]string, len(config.SearchFields))
		searchArgs := make([]interface{}, len(config.SearchFields))

		for i, field := range config.SearchFields {
			searchConditions[i] = field + " ILIKE ?"
			searchArgs[i] = searchQuery
		}

		query = query.Where(strings.Join(searchConditions, " OR "), searchArgs...)
	}

	// Apply advanced filter conditions if provided
	if len(params.FilterConditions) > 0 {
		var whereClause strings.Builder
		var args []interface{}

		for i, condition := range params.FilterConditions {
			// Get the database field name
			dbField, ok := config.FilterFields[condition.Field]
			if !ok {
				continue
			}

			// Add logical operator (AND/OR) between conditions
			if i > 0 {
				if strings.ToUpper(condition.Logic) == "OR" {
					whereClause.WriteString(" OR ")
				} else {
					whereClause.WriteString(" AND ")
				}
			}

			// Apply the filter condition
			conditionSQL, conditionArgs := p.applyFilterCondition(condition, dbField)
			whereClause.WriteString("(" + conditionSQL + ")")
			args = append(args, conditionArgs...)
		}

		if whereClause.Len() > 0 {
			query = query.Where(whereClause.String(), args...)
		}
	} else {
		// Apply legacy filters (backward compatibility)
		for field, value := range params.Filters {
			if dbField, ok := config.FilterFields[field]; ok && value != nil {
				query = query.Where(dbField+" = ?", value)
			}
		}
	}

	// Apply date range filters if configured
	if len(config.DateFields) > 0 && len(params.Dates) > 0 {
		for field, dateRange := range params.Dates {
			if dbField, ok := config.DateFields[field]; ok {
				if dateRange.Start != nil {
					query = query.Where(dbField.Start+" >= ?", dateRange.Start)
				}
				if dateRange.End != nil {
					query = query.Where(dbField.End+" <= ?", dateRange.End)
				}
			}
		}
	}

	return query
}

// buildGroupByClause builds the GROUP BY and HAVING clauses
func (p *Paginator) buildGroupByClause(query *gorm.DB, config PaginationConfig) *gorm.DB {
	if len(config.GroupBy) > 0 {
		query = query.Group(strings.Join(config.GroupBy, ", "))
	}

	if len(config.Having) > 0 {
		query = query.Having(strings.Join(config.Having, " AND "))
	}

	return query
}

// Paginate executes the pagination query based on the provided parameters and config
func (p *Paginator) Paginate(params QueryParams, config PaginationConfig) (*PaginatedResponse, error) {
	// Set default values
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 {
		params.PageSize = 10
	}
	if params.SortBy == "" {
		params.SortBy = config.DefaultSort
	}
	if config.DefaultOrder == "" {
		config.DefaultOrder = "DESC"
	}

	// Build the query step by step
	query := p.buildSelectClause(config)
	query = p.buildJoinClause(query, config)
	query = p.buildWhereClause(query, params, config)
	query = p.buildGroupByClause(query, config)

	// Get total count
	var total int64
	countQuery := query.Session(&gorm.Session{})
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to get total count: %w", err)
	}

	// Apply sorting
	if params.SortBy != "" {
		// Validate sort field
		isValidSort := false
		for _, field := range config.SortFields {
			if field == params.SortBy {
				isValidSort = true
				break
			}
		}

		if !isValidSort {
			params.SortBy = config.DefaultSort
		}

		sortOrder := "ASC"
		if params.SortDesc {
			sortOrder = "DESC"
		}
		query = query.Order(fmt.Sprintf("%s %s", params.SortBy, sortOrder))
	}

	// Apply relations if any
	if len(config.Relations) > 0 {
		query = query.Preload(strings.Join(config.Relations, " "))
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	query = query.Offset(offset).Limit(params.PageSize)

	// Execute query
	// Create a slice of the model type
	modelType := reflect.TypeOf(config.Model).Elem()
	sliceType := reflect.SliceOf(modelType)
	result := reflect.MakeSlice(sliceType, 0, 0).Interface()

	if err := query.Find(&result).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch data: %w", err)
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(total) / float64(params.PageSize)))

	return &PaginatedResponse{
		Data:       result,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}
