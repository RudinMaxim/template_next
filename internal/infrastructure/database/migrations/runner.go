package migrations

import (
	"context"
	"fmt"

	"github.com/BeautySync/BS_CatalogNode/pkg/logger"
)

type Runner struct {
	migrator *Migrator
	logger   *logger.AsyncLogger
}

func NewRunner(dsn string, logger *logger.AsyncLogger) (*Runner, error) {
	migrator, err := New(dsn, logger)
	if err != nil {
		return nil, err
	}

	return &Runner{
		migrator: migrator,
		logger:   logger,
	}, nil
}

func (r *Runner) Run(ctx context.Context) error {
	r.logger.Info("starting database migration", nil)

	if err := r.migrator.Up(); err != nil {
		return fmt.Errorf("running migrations: %w", err)
	}

	r.logger.Info("database migration completed successfully", nil)
	return nil
}
