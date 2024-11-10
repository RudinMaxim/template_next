package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/RudinMaxim/template/pkg/logger"

	"github.com/golang-migrate/migrate/v4"
	pgx "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

var (
	ErrMigrationFailed = errors.New("migration failed")
	ErrNoMigrations    = errors.New("no migrations found")
)

type MigrationConfig struct {
	MigrationsPath   string        // Путь к файлам миграций
	TableName        string        // Имя таблицы для хранения состояния миграций
	LockTimeout      time.Duration // Таймаут для блокировки миграций
	StatementTimeout time.Duration // Таймаут для выполнения SQL-запросов
}

type MigrateLogger struct {
	logger *logger.Logger
}

func DefaultMigrationConfig() *MigrationConfig {
	return &MigrationConfig{
		MigrationsPath:   "migrations",
		TableName:        "schema_migrations",
		LockTimeout:      15 * time.Second,
		StatementTimeout: 30 * time.Second,
	}
}

type Migrator interface {
	Up(ctx context.Context) error
	Down(ctx context.Context) error
	Version() (uint, bool, error)
	Force(version int) error
}

type PostgresMigrator struct {
	client  *Client
	config  *MigrationConfig
	migrate *migrate.Migrate
	logger  *logger.Logger
}

func (c *Client) NewMigrator(ctx context.Context, cfg *MigrationConfig, logger *logger.Logger) (*PostgresMigrator, error) {
	if cfg == nil {
		cfg = DefaultMigrationConfig()
	}

	c.logger.Info("initializing database migrator",
		"migrations_path", cfg.MigrationsPath,
		"table_name", cfg.TableName,
	)

	db, err := c.db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	driver, err := pgx.WithInstance(db, &pgx.Config{
		MigrationsTable:  cfg.TableName,
		DatabaseName:     c.config.DBName,
		SchemaName:       "public",
		StatementTimeout: cfg.StatementTimeout,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create postgres driver: %w", err)
	}

	migrationSource := fmt.Sprintf("file://%s", cfg.MigrationsPath)
	c.logger.Debug("migration source path", "path", migrationSource)

	m, err := migrate.NewWithDatabaseInstance(
		migrationSource,
		"postgres",
		driver,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create migrator: %w", err)
	}

	m.Log = &MigrateLogger{logger: c.logger}

	return &PostgresMigrator{
		client:  c,
		config:  cfg,
		migrate: m,
		logger:  c.logger,
	}, nil
}

func (m *MigrateLogger) Printf(format string, v ...interface{}) {
	m.logger.Debug(fmt.Sprintf(format, v...))
}

func (m *MigrateLogger) Verbose() bool {
	return true
}

func (m *PostgresMigrator) Up(ctx context.Context) error {
	m.logger.Info("starting database migration up")

	if err := m.migrate.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			m.logger.Info("database is up to date")
			return nil
		}
		return fmt.Errorf("%w: %v", ErrMigrationFailed, err)
	}

	version, dirty, err := m.migrate.Version()
	if err != nil {
		return fmt.Errorf("failed to get migration version: %w", err)
	}

	m.logger.Info("database migration completed",
		"version", version,
		"dirty", dirty,
	)
	return nil
}

func (m *PostgresMigrator) Down(ctx context.Context) error {
	m.logger.Info("starting database migration down")

	if err := m.migrate.Down(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			m.logger.Info("no migrations to roll back")
			return nil
		}
		return fmt.Errorf("%w: %v", ErrMigrationFailed, err)
	}

	m.logger.Info("database migration rollback completed")
	return nil
}

func (m *PostgresMigrator) Version() (uint, bool, error) {
	return m.migrate.Version()
}

func (m *PostgresMigrator) Force(version int) error {
	return m.migrate.Force(version)
}

func (m *PostgresMigrator) Close() error {
	srcErr, dbErr := m.migrate.Close()
	if srcErr != nil || dbErr != nil {
		return fmt.Errorf("failed to close migrator: source: %v, database: %v", srcErr, dbErr)
	}
	return nil
}
