package postgres

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/RudinMaxim/template/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type TestDB struct {
	Client *Client
	Config *config.PostgresConfig
}

func SetupTestDB(t *testing.T) *TestDB {
	cfg := &config.PostgresConfig{
		Host:            "localhost",
		Port:            "5432",
		User:            "postgres",
		Password:        "postgres",
		DBName:          "test_db",
		MaxIdleConns:    10,
		MaxOpenConns:    100,
		ConnMaxLifetime: time.Hour,
		SSLMode:         "disable",
	}

	client, err := NewClient(context.Background(), cfg, nil)
	if err != nil {
		t.Fatalf("failed to create test database client: %v", err)
	}

	return &TestDB{
		Client: client,
		Config: cfg,
	}
}

func (tdb *TestDB) Cleanup(t *testing.T) {
	if err := tdb.Client.Close(); err != nil {
		t.Errorf("failed to close test database connection: %v", err)
	}
}

func TestNewClient(t *testing.T) {
	t.Run("successful connection", func(t *testing.T) {
		cfg := &config.PostgresConfig{
			Host:            "localhost",
			Port:            "5432",
			User:            "postgres",
			Password:        "postgres",
			DBName:          "test_db",
			MaxIdleConns:    10,
			MaxOpenConns:    100,
			ConnMaxLifetime: time.Hour,
			ConnMaxIdleTime: time.Hour,
			RetryAttempts:   3,
			RetryDelay:      time.Second,
			SSLMode:         "disable",
			Debug:           true,
		}

		client, err := NewClient(context.Background(), cfg, nil)
		require.NoError(t, err)
		require.NotNil(t, client)
		require.NotNil(t, client.db)

		err = client.Close()
		require.NoError(t, err)
	})

	t.Run("invalid config", func(t *testing.T) {
		testCases := []struct {
			name   string
			config *config.PostgresConfig
		}{
			{
				name:   "nil config",
				config: nil,
			},
			{
				name: "empty host",
				config: &config.PostgresConfig{
					Port:   "5432",
					User:   "postgres",
					DBName: "test_db",
				},
			},
			{
				name: "empty port",
				config: &config.PostgresConfig{
					Host:   "localhost",
					User:   "postgres",
					DBName: "test_db",
				},
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				client, err := NewClient(context.Background(), tc.config, nil)
				assert.Error(t, err)
				assert.Nil(t, client)
			})
		}
	})
}

func TestValidateConfig(t *testing.T) {
	t.Run("valid config", func(t *testing.T) {
		cfg := &config.PostgresConfig{
			Host:   "localhost",
			Port:   "5432",
			User:   "postgres",
			DBName: "test_db",
		}
		err := validateConfig(cfg)
		assert.NoError(t, err)
	})

	t.Run("invalid config", func(t *testing.T) {
		testCases := []struct {
			name   string
			config *config.PostgresConfig
		}{
			{
				name:   "nil config",
				config: nil,
			},
			{
				name:   "empty config",
				config: &config.PostgresConfig{},
			},
			{
				name: "missing port",
				config: &config.PostgresConfig{
					Host:   "localhost",
					User:   "postgres",
					DBName: "test_db",
				},
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				err := validateConfig(tc.config)
				assert.Error(t, err)
			})
		}
	})
}

func TestBuildDSN(t *testing.T) {
	cfg := &config.PostgresConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "secret",
		DBName:   "test_db",
		SSLMode:  "disable",
	}

	dsn := buildDSN(cfg)
	expected := "host=localhost user=postgres password=secret dbname=test_db port=5432 sslmode=disable TimeZone=UTC"
	assert.Equal(t, expected, dsn)
}

func TestClientHealth(t *testing.T) {
	cfg := &config.PostgresConfig{
		Host:            "localhost",
		Port:            "5432",
		User:            "postgres",
		Password:        "postgres",
		DBName:          "test_db",
		MaxIdleConns:    10,
		MaxOpenConns:    100,
		ConnMaxLifetime: time.Hour,
		SSLMode:         "disable",
	}

	client, err := NewClient(context.Background(), cfg, nil)
	require.NoError(t, err)
	defer client.Close()

	t.Run("successful health check", func(t *testing.T) {
		err := client.Health(context.Background())
		assert.NoError(t, err)
	})

	t.Run("health check with canceled context", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		err := client.Health(ctx)
		assert.Error(t, err)
	})
}

func TestClientTransaction(t *testing.T) {
	cfg := &config.PostgresConfig{
		Host:            "localhost",
		Port:            "5432",
		User:            "postgres",
		Password:        "postgres",
		DBName:          "test_db",
		MaxIdleConns:    10,
		MaxOpenConns:    100,
		ConnMaxLifetime: time.Hour,
		SSLMode:         "disable",
	}

	client, err := NewClient(context.Background(), cfg, nil)
	require.NoError(t, err)
	defer client.Close()

	t.Run("successful transaction", func(t *testing.T) {
		err := client.Transaction(context.Background(), func(tx *gorm.DB) error {
			return nil
		})
		assert.NoError(t, err)
	})

	t.Run("failed transaction", func(t *testing.T) {
		err := client.Transaction(context.Background(), func(tx *gorm.DB) error {
			return errors.New("transaction error")
		})
		assert.Error(t, err)
	})
}

func TestIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	cfg := &config.PostgresConfig{
		Host:            "localhost",
		Port:            "5432",
		User:            "postgres",
		Password:        "postgres",
		DBName:          "test_db",
		MaxIdleConns:    10,
		MaxOpenConns:    100,
		ConnMaxLifetime: time.Hour,
		SSLMode:         "disable",
	}

	ctx := context.Background()
	client, err := NewClient(ctx, cfg, nil)
	require.NoError(t, err)
	defer client.Close()

	t.Run("database operations", func(t *testing.T) {
		// Test your database operations here
		err := client.Transaction(ctx, func(tx *gorm.DB) error {
			// Perform test operations
			return nil
		})
		assert.NoError(t, err)
	})
}
