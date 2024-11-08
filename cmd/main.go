package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/BeautySync/BS_CatalogNode/internal/api/category"
	"github.com/BeautySync/BS_CatalogNode/internal/api/service"
	"github.com/BeautySync/BS_CatalogNode/internal/api/tag"
	"github.com/BeautySync/BS_CatalogNode/internal/config"
	"github.com/BeautySync/BS_CatalogNode/internal/database"
	"github.com/BeautySync/BS_CatalogNode/internal/middleware"
	"github.com/BeautySync/BS_CatalogNode/internal/router"
	"github.com/BeautySync/BS_CatalogNode/pkg/logger"
	"github.com/gin-gonic/gin"
)

type application struct {
	ctx        context.Context
	cancel     context.CancelFunc
	config     *config.Config
	postgresDB *database.PostgresDB
	cache      *database.RedisCache
	router     *gin.Engine
	logger     *logger.AsyncLogger
}

func main() {
	if err := run(); err != nil {
		log.Fatalf("Application failed to start: %v", err)
	}
}

func run() error {
	app := &application{}

	if err := app.initialize(); err != nil {
		return fmt.Errorf("failed to initialize application: %w", err)
	}

	defer app.cleanup()

	return app.router.Run(":" + app.config.API.Port)
}

func (app *application) cleanup() {
	if app.logger != nil {
		if err := app.logger.Shutdown(); err != nil {
			fmt.Fprintf(os.Stderr, "Error shutting down logger: %v\n", err)
		}
	}

	if app.postgresDB != nil {
		if err := app.postgresDB.Close(); err != nil {
			fmt.Fprintf(os.Stderr, "Error closing database connection: %v\n", err)
		}
	}

	if app.cache != nil {
		if err := app.cache.Close(); err != nil {
			fmt.Fprintf(os.Stderr, "Error closing Redis connection: %v\n", err)
		}
	}

	if app.cancel != nil {
		app.cancel()
	}
}

func (app *application) initialize() error {
	if err := app.initContext(); err != nil {
		return fmt.Errorf("failed to initialize context: %w", err)
	}

	if err := app.initConfig(); err != nil {
		return fmt.Errorf("failed to initialize config: %w", err)
	}

	if err := app.initLogger(); err != nil {
		return fmt.Errorf("failed to initialize logger: %w", err)
	}

	if err := app.initDatabase(); err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}

	if err := app.initCache(); err != nil {
		return fmt.Errorf("failed to initialize cache: %w", err)
	}

	if err := app.initRouter(); err != nil {
		return fmt.Errorf("failed to initialize router: %w", err)
	}

	app.logger.Info("Application initialized successfully", nil)
	return nil
}

func (app *application) initContext() error {
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)

	app.ctx = ctx
	app.cancel = cancel

	return nil
}

func (app *application) initConfig() error {
	config, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	if err := config.Validate(); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	app.config = config

	if app.config.Node.Mode == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	return nil
}

func (app *application) initLogger() error {
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("failed to create log directory: %w", err)
	}

	logFile := filepath.Join(logDir, "app.log")

	logger, err := logger.NewAsyncLogger(
		app.ctx,
		app.cancel,
		logFile,
		1000,
		3,
		app.config.Node.Mode == "development",
	)
	if err != nil {
		return fmt.Errorf("failed to initialize logger: %w", err)
	}

	app.logger = logger
	app.logger.Info("Logger initialized", map[string]interface{}{
		"mode": app.config.Node.Mode,
	})

	return nil
}

func (app *application) initDatabase() error {
	postgresDB, err := database.NewPostgresDB(app.ctx, &app.config.Postgres, app.logger)
	if err != nil {
		return fmt.Errorf("could not initialize database connection: %w", err)
	}

	app.postgresDB = postgresDB

	// Инициализация миграций
	if app.config.Node.Mode == "development" {
		migrator := database.NewMigrator(app.postgresDB.DB(), app.logger)
		if err := migrator.RunMigrations(); err != nil {
			return fmt.Errorf("failed to run migrations: %w", err)
		}
	}

	return nil
}

func (app *application) initCache() error {
	redisCache, err := database.NewRedisCache(app.ctx, &app.config.Redis, app.logger)
	if err != nil {
		return fmt.Errorf("could not initialize redis connection: %w", err)
	}

	app.cache = redisCache
	return nil
}

func (app *application) initRouter() error {
	tagRepo := tag.NewRepository(app.postgresDB.DB())
	tagSvc := tag.NewService(*tagRepo)
	tagHandler := tag.NewHandler(*tagSvc)

	serviceRepo := service.NewRepository(app.postgresDB.DB())
	serviceSvc := service.NewService(serviceRepo)
	serviceHandler := service.NewHandler(serviceSvc)

	categoryRepo := category.NewRepository(app.postgresDB.DB())
	categorySvc := category.NewService(categoryRepo)
	categoryHandler := category.NewHandler(categorySvc)

	r := router.InitRouter(app.ctx, app.cache, categoryHandler, serviceHandler, tagHandler)

	if err := middleware.SetTrustedProxies(r); err != nil {
		app.logger.Error("Failed to set trusted proxies", map[string]interface{}{
			"error": err.Error(),
		})
		return fmt.Errorf("failed to set trusted proxies: %w", err)
	}

	app.router = r
	app.logger.Info("Router initialized", nil)

	return nil
}
