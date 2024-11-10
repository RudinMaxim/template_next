package repository

import (
	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}
