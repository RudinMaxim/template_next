package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/RudinMaxim/template/internal/config"
	"github.com/RudinMaxim/template/pkg/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	ErrInvalidConfig    = errors.New("invalid postgres configuration")
	ErrConnectionFailed = errors.New("failed to connect to database")
)

type Client struct {
	db     *gorm.DB
	config *config.PostgresConfig
	logger *logger.Logger
}

func NewClient(ctx context.Context, cfg *config.PostgresConfig, logger *logger.Logger) (*Client, error) {
	logger.Info("initializing postgres client")

	if err := validateConfig(cfg); err != nil {
		logger.Error("postgres config validation failed", "error", err)
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	if cfg.Debug {
		logger.Debug("postgres debug mode enabled")
	}

	dsn := buildDSN(cfg)
	logger.Debug("attempting database connection", "host", cfg.Host, "database", cfg.DBName)

	db, err := connectWithRetry(dsn, cfg, logger)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		logger.Error("failed to get database instance", "error", err)
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	configureConnectionPool(sqlDB, cfg)
	logger.Debug("configured connection pool",
		"max_idle", cfg.MaxIdleConns,
		"max_open", cfg.MaxOpenConns,
		"max_lifetime", cfg.ConnMaxLifetime,
	)

	client := &Client{
		db:     db,
		config: cfg,
		logger: logger,
	}

	if err := client.Health(ctx); err != nil {
		logger.Error("health check failed", "error", err)
		return nil, fmt.Errorf("health check failed: %w", err)
	}

	logger.Info("postgres client successfully initialized")
	return client, nil
}

func validateConfig(cfg *config.PostgresConfig) error {
	if cfg == nil {
		return ErrInvalidConfig
	}

	if cfg.Host == "" || cfg.Port == "" || cfg.User == "" || cfg.DBName == "" {
		return fmt.Errorf("%w: missing required fields", ErrInvalidConfig)
	}

	return nil
}

func buildDSN(cfg *config.PostgresConfig) string {
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		cfg.Host, cfg.User, cfg.Password, cfg.DBName, cfg.Port, cfg.SSLMode,
	)
}

func connectWithRetry(dsn string, cfg *config.PostgresConfig, logger *logger.Logger) (*gorm.DB, error) {
	var db *gorm.DB
	var lastErr error

	for attempt := 1; attempt <= cfg.RetryAttempts; attempt++ {
		logger.Debug("attempting database connection", "attempt", attempt)

		db, lastErr = gorm.Open(postgres.Open(dsn))
		if lastErr == nil {
			logger.Info("successfully connected to database", "attempt", attempt)
			return db, nil
		}

		if attempt < cfg.RetryAttempts {
			logger.Warn("connection attempt failed, retrying",
				"attempt", attempt,
				"error", lastErr,
				"retry_delay", cfg.RetryDelay,
			)
			time.Sleep(cfg.RetryDelay)
			continue
		}
	}

	return nil, fmt.Errorf("failed to connect after %d attempts: %w", cfg.RetryAttempts, lastErr)
}

func configureConnectionPool(sqlDB *sql.DB, cfg *config.PostgresConfig) {
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)
}

func (c *Client) DB() *gorm.DB {
	return c.db
}

func (c *Client) Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	c.logger.Debug("starting database transaction")
	err := c.db.WithContext(ctx).Transaction(fn)
	if err != nil {
		c.logger.Error("transaction failed", "error", err)
	} else {
		c.logger.Debug("transaction completed successfully")
	}
	return err
}

func (c *Client) Close() error {
	c.logger.Info("closing postgres connection")
	sqlDB, err := c.db.DB()
	if err != nil {
		c.logger.Error("failed to get database instance for closing", "error", err)
		return fmt.Errorf("failed to get database instance: %w", err)
	}
	return sqlDB.Close()
}

func (c *Client) Health(ctx context.Context) error {
	c.logger.Debug("checking database health")
	sqlDB, err := c.db.DB()
	if err != nil {
		c.logger.Error("health check failed - couldn't get database instance", "error", err)
		return fmt.Errorf("failed to get database instance: %w", err)
	}
	err = sqlDB.PingContext(ctx)
	if err != nil {
		c.logger.Error("health check failed - ping failed", "error", err)
	} else {
		c.logger.Debug("health check successful")
	}
	return err
}
