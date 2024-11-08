package migrations

import (
	"embed"
	"fmt"

	"github.com/BeautySync/BS_CatalogNode/pkg/logger"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

var migrationFiles embed.FS

type Migrator struct {
	migrate *migrate.Migrate
	logger  *logger.AsyncLogger
}

func New(dsn string, logger *logger.AsyncLogger) (*Migrator, error) {
	m, err := migrate.New(
		"./index.sql",
		dsn,
	)
	if err != nil {
		return nil, fmt.Errorf("creating migrator: %w", err)
	}

	return &Migrator{
		migrate: m,
		logger:  logger,
	}, nil
}

func (m *Migrator) Up() error {
	if err := m.migrate.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("applying migrations: %w", err)
	}

	m.logger.Info("migrations applied successfully", nil)
	return nil
}

func (m *Migrator) Down() error {
	if err := m.migrate.Down(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("rolling back migrations: %w", err)
	}

	m.logger.Info("migrations rolled back successfully", nil)
	return nil
}
