package models

import (
	"time"

	"gorm.io/gorm"
)

// ProductType represents the valid types of products
type ProductType string

const (
	ProductTypeGoods    ProductType = "Goods"
	ProductTypeServices ProductType = "Services"
)

// IsValid checks if the product type is valid
func (pt ProductType) IsValid() bool {
	switch pt {
	case ProductTypeGoods, ProductTypeServices:
		return true
	}
	return false
}

// String returns the string representation of the product type
func (pt ProductType) String() string {
	return string(pt)
}

type Products struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Name          string         `json:"name" gorm:"not null;size:255"`
	SKU           string         `json:"sku" gorm:"not null;size:255"`
	Description   string         `json:"description" gorm:"not null;size:255"`
	Price         float64        `json:"price" gorm:"not null"`
	Cost          float64        `json:"cost" gorm:"not null"`
	StockQuantity int            `json:"stock_qty" gorm:"not null"`
	Image         string         `json:"image" gorm:"not null;size:255"`
	Category      string         `json:"category" gorm:"not null;size:255"`
	Type          ProductType    `json:"type" gorm:"type:enum('Goods','Services');not null;default:'Goods'"`
	Status        string         `json:"status" gorm:"not null;size:255"`
	CreatedAt     time.Time      `json:"created_at"`
	CreatedBy     string         `json:"created_by" gorm:"not null;size:255"`
	UpdatedAt     time.Time      `json:"updated_at"`
	UpdatedBy     string         `json:"updated_by" gorm:"not null;size:255"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

// CreateProductRequest represents the request payload for creating a product
type CreateProductRequest struct {
	Name          string      `json:"name" validate:"required,max=255"`
	SKU           string      `json:"sku" validate:"required,max=255"`
	Description   string      `json:"description" validate:"required,max=255"`
	Price         float64     `json:"price" validate:"required,min=0"`
	Cost          float64     `json:"cost" validate:"required,min=0"`
	StockQuantity int         `json:"stock_qty" validate:"required,min=0"`
	Image         string      `json:"image" validate:"required,max=255"`
	Category      string      `json:"category" validate:"required,max=255"`
	Type          ProductType `json:"type" validate:"required,oneof=Goods Services"`
	Status        string      `json:"status" validate:"required,max=255"`
}

// UpdateProductRequest represents the request payload for updating a product
type UpdateProductRequest struct {
	Name          string      `json:"name" validate:"required,max=255"`
	SKU           string      `json:"sku" validate:"required,max=255"`
	Description   string      `json:"description" validate:"required,max=255"`
	Price         float64     `json:"price" validate:"required,min=0"`
	Cost          float64     `json:"cost" validate:"required,min=0"`
	StockQuantity int         `json:"stock_qty" validate:"required,min=0"`
	Image         string      `json:"image" validate:"required,max=255"`
	Category      string      `json:"category" validate:"required,max=255"`
	Type          ProductType `json:"type" validate:"required,oneof=Goods Services"`
	Status        string      `json:"status" validate:"required,max=255"`
}
