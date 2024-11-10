package app

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/RudinMaxim/template/internal/config"
	"github.com/RudinMaxim/template/internal/infrastructure/database/postgres"
	"github.com/RudinMaxim/template/internal/infrastructure/database/redis"
	"github.com/RudinMaxim/template/pkg/logger"
	"github.com/gin-gonic/gin"
)

type App struct {
	ctx      context.Context
	cancel   context.CancelFunc
	config   *config.Config
	logger   *logger.Logger
	postgres *postgres.Client
	redis    *redis.Client
	router   *gin.Engine
}

func NewApp(ctx context.Context, cfg *config.Config) *App {
	ctx, cancel := context.WithCancel(ctx)
	return &App{
		ctx:    ctx,
		cancel: cancel,
		config: cfg,
	}
}

func (a *App) Initialize() error {
	initializers := []func() error{
		a.initLogger,
		a.initPostgres,
		a.initRedis,
	}

	for _, init := range initializers {
		if err := init(); err != nil {
			return fmt.Errorf("initialization error: %w", err)
		}
	}

	a.logger.Info("Application initialized successfully")
	return nil
}

func (a *App) initLogger() error {
	logDir := a.config.Logger.Dir
	logFileName := a.config.Logger.FileName

	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("failed to create log directory: %w", err)
	}

	logFile := filepath.Join(logDir, logFileName)

	_, err := os.Stat(logFile)
	if os.IsNotExist(err) {
		file, err := os.Create(logFile)
		if err != nil {
			return fmt.Errorf("failed to create log file: %w", err)
		}
		file.Close()
	} else if err != nil {
		return fmt.Errorf("failed to check log file status: %w", err)
	}

	l, err := logger.NewLogger(a.ctx, logFile, logger.DefaultOptions())
	if err != nil {
		return fmt.Errorf("failed to initialize logger: %w", err)
	}

	a.logger = l
	return nil
}

func (a *App) initPostgres() error {
	dbConfig := config.PostgresConfig{
		Host:            a.config.Postgres.Host,
		Port:            a.config.Postgres.Port,
		User:            a.config.Postgres.User,
		Password:        a.config.Postgres.Password,
		DBName:          a.config.Postgres.DBName,
		MaxIdleConns:    a.config.Postgres.MaxIdleConns,
		MaxOpenConns:    a.config.Postgres.MaxOpenConns,
		ConnMaxLifetime: a.config.Postgres.ConnMaxLifetime,
		ConnMaxIdleTime: a.config.Postgres.ConnMaxIdleTime,
		RetryAttempts:   a.config.Postgres.RetryAttempts,
		RetryDelay:      a.config.Postgres.RetryDelay,
		SSLMode:         a.config.Postgres.SSLMode,
		Debug:           a.config.Postgres.Debug,
	}

	db, err := postgres.NewClient(a.ctx, &dbConfig, a.logger)
	if err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}

	a.postgres = db

	if a.config.Node.Mode == "development" {
		if err := a.runMigrations(); err != nil {
			return fmt.Errorf("failed to run migrations: %w", err)
		}
	}

	return nil
}

func (a *App) runMigrations() error {
	migrationCfg := &postgres.MigrationConfig{
		MigrationsPath:   "../migrations",
		TableName:        "schema_migrations",
		LockTimeout:      15 * time.Second,
		StatementTimeout: 30 * time.Second,
	}

	migrator, err := a.postgres.NewMigrator(a.ctx, migrationCfg, a.logger)
	if err != nil {
		log.Fatalf("Failed to create migrator: %v", err)
	}
	defer migrator.Close()

	if err := migrator.Up(a.ctx); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	version, dirty, err := migrator.Version()
	if err != nil {
		log.Fatalf("Failed to get migration version: %v", err)
	}

	log.Printf("Current migration version: %d, dirty: %v", version, dirty)

	return nil
}

func (a *App) initRedis() error {
	cacheConfig := config.RedisConfig{
		Host:         a.config.Redis.Host,
		Port:         a.config.Redis.Port,
		Password:     a.config.Redis.Password,
		DB:           a.config.Redis.DB,
		PoolSize:     a.config.Redis.PoolSize,
		MinIdleConns: a.config.Redis.MinIdleConns,
		Enabled:      a.config.Redis.Enabled,
		DefaultTTL:   a.config.Redis.DefaultTTL,
		OrderTTL:     a.config.Redis.OrderTTL,
	}

	cache, err := redis.NewClient(a.ctx, &cacheConfig, a.logger)
	if err != nil {
		return fmt.Errorf("failed to initialize redis: %w", err)
	}

	a.redis = cache
	return nil
}

func (a *App) Start() error {
	serverAddr := ":" + a.config.API.Port
	a.logger.Info(fmt.Sprintf("Starting server on %s", serverAddr))

	return a.router.Run(serverAddr)
}

func (a *App) Shutdown() error {
	a.logger.Info("Starting graceful shutdown")

	if err := a.postgres.Close(); err != nil {
		a.logger.Error("Error closing database connection", map[string]interface{}{
			"error": err.Error(),
		})
	}

	if err := a.redis.Close(); err != nil {
		a.logger.Error("Error closing redis connection", map[string]interface{}{
			"error": err.Error(),
		})
	}

	if err := a.logger.Shutdown(a.ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Error shutting down logger: %v\n", err)
	}

	a.cancel()
	return nil
}
