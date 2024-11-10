package redis

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/RudinMaxim/template/internal/config"
	"github.com/RudinMaxim/template/pkg/logger"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewClient(t *testing.T) {
	tests := []struct {
		name    string
		config  *config.RedisConfig
		wantErr bool
	}{
		{
			name:    "nil config",
			config:  nil,
			wantErr: true,
		},
		{
			name: "disabled redis",
			config: &config.RedisConfig{
				Enabled: false,
			},
			wantErr: true,
		},
		{
			name: "valid config",
			config: &config.RedisConfig{
				Host:         "localhost",
				Port:         "6379",
				Enabled:      true,
				PoolSize:     10,
				MinIdleConns: 5,
			},
			wantErr: false,
		},
	}

	logDir := "logs"
	os.MkdirAll(logDir, 0755)

	logFile := filepath.Join(logDir, "app.log")

	l, _ := logger.NewLogger(context.Background(), logFile, logger.DefaultOptions())

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := NewClient(context.Background(), tt.config, l)
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, client)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, client)
				client.Close()
			}
		})
	}
}

func TestClient_Operations(t *testing.T) {
	cfg := &config.RedisConfig{
		Host:         "localhost",
		Port:         "6379",
		Enabled:      true,
		PoolSize:     10,
		MinIdleConns: 5,
		DefaultTTL:   60,
		OrderTTL:     240,
	}

	logDir := "logs"
	os.MkdirAll(logDir, 0755)

	logFile := filepath.Join(logDir, "app.log")

	l, _ := logger.NewLogger(context.Background(), logFile, logger.DefaultOptions())

	client, err := NewClient(context.Background(), cfg, l)
	require.NoError(t, err)
	defer client.Close()

	ctx := context.Background()

	t.Run("Set and Get", func(t *testing.T) {
		key := "test_key"
		value := "test_value"

		err := client.Set(ctx, key, value, "default")
		require.NoError(t, err)

		got, err := client.Get(ctx, key)
		require.NoError(t, err)
		assert.Equal(t, value, got)
	})

	t.Run("Delete", func(t *testing.T) {
		key := "test_delete"
		value := "test_value"

		err := client.Set(ctx, key, value, "default")
		require.NoError(t, err)

		err = client.Delete(ctx, key)
		require.NoError(t, err)

		_, err = client.Get(ctx, key)
		assert.Error(t, err)
	})

	t.Run("SetNX", func(t *testing.T) {
		key := "test_setnx"
		value := "test_value"

		success, err := client.SetNX(ctx, key, value, "default")
		require.NoError(t, err)
		assert.True(t, success)

		success, err = client.SetNX(ctx, key, "new_value", "default")
		require.NoError(t, err)
		assert.False(t, success)

		got, err := client.Get(ctx, key)
		require.NoError(t, err)
		assert.Equal(t, value, got)
	})

	t.Run("Pipeline", func(t *testing.T) {
		err := client.Pipeline(ctx, func(pipe redis.Pipeliner) error {
			pipe.Set(ctx, "key1", "value1", time.Minute)
			pipe.Set(ctx, "key2", "value2", time.Minute)
			return nil
		})
		require.NoError(t, err)

		val1, err := client.Get(ctx, "key1")
		require.NoError(t, err)
		assert.Equal(t, "value1", val1)

		val2, err := client.Get(ctx, "key2")
		require.NoError(t, err)
		assert.Equal(t, "value2", val2)
	})

	t.Run("Health", func(t *testing.T) {
		err := client.Health(ctx)
		require.NoError(t, err)
	})
}
