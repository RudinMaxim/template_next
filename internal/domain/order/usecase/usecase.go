package usecase

type UseCase struct {
	repo *Repository
}

func NewService(repo *Repository) UseCase {
	return UseCase{repo: repo}
}
