package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/BeautySync/BS_CatalogNode/pkg/errors"
	"github.com/BeautySync/BS_CatalogNode/pkg/logger"
	"github.com/jackc/pgx/v4/pgxpool"
)

type PostgresDB struct {
	pool   *pgxpool.Pool
	logger *logger.AsyncLogger
	config Config
}

func New(ctx context.Context, config Config, logger *logger.AsyncLogger) (*PostgresDB, error) {
	db := &PostgresDB{
		config: config,
		logger: logger,
	}

	if err := db.connect(ctx); err != nil {
		return nil, err
	}

	return db, nil
}

func (db *PostgresDB) connect(ctx context.Context) error {
	connString := db.buildConnectionString()

	poolConfig, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return errors.NewDatabaseError(err)
	}

	db.configurePool(poolConfig)

	for attempt := 1; attempt <= db.config.RetryAttempts; attempt++ {
		db.logger.Info("connecting to database",
			map[string]interface{}{
				"host":    db.config.Host,
				"attempt": attempt,
			},
		)

		if pool, err := db.attemptConnection(ctx, poolConfig); err == nil {
			db.pool = pool
			db.logger.Info("successfully connected to database", map[string]interface{}{})
			return nil
		} else if attempt == db.config.RetryAttempts {
			return errors.NewDatabaseError(err)
		}

		time.Sleep(db.config.RetryDelay * time.Duration(attempt))
	}

	return errors.NewDatabaseError(err)
}

func (db *PostgresDB) configurePool(config *pgxpool.Config) {
	config.MaxConns = int32(db.config.MaxOpenConns)
	config.MinConns = int32(db.config.MaxIdleConns)
	config.MaxConnLifetime = db.config.ConnMaxLifetime
	config.ConnConfig.ConnectTimeout = db.config.ConnTimeout
}

func (db *PostgresDB) attemptConnection(ctx context.Context, config *pgxpool.Config) (*pgxpool.Pool, error) {
	pool, err := pgxpool.ConnectConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}

func (db *PostgresDB) buildConnectionString() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		db.config.Host,
		db.config.Port,
		db.config.User,
		db.config.Password,
		db.config.DBName,
		db.config.SSLMode,
	)
}

func (db *PostgresDB) Pool() *pgxpool.Pool {
	return db.pool
}

func (db *PostgresDB) Close() {
	if db.pool != nil {
		db.pool.Close()
		db.logger.Info("database connection closed", map[string]interface{}{})
	}
}
