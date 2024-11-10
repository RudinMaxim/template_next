package usecase

import "github.com/RudinMaxim/template/internal/domain/order/repository"

type UseCase struct {
	repo *repository.OrderRepository
}

func NewService(repo *repository.OrderRepository) UseCase {
	return UseCase{repo: repo}
}
