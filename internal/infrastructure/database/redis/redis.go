package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/RudinMaxim/template/internal/config"
	"github.com/RudinMaxim/template/pkg/logger"
	"github.com/redis/go-redis/v9"
)

type Client struct {
	client *redis.Client
	config *config.RedisConfig
	logger *logger.Logger
}

func NewClient(ctx context.Context, cfg *config.RedisConfig, logger *logger.Logger) (*Client, error) {
	logger.Info("initializing redis client")

	if cfg == nil {
		logger.Error("redis configuration is nil")
		return nil, fmt.Errorf("redis config is nil")
	}

	if !cfg.Enabled {
		logger.Warn("redis is disabled in configuration")
		return nil, fmt.Errorf("redis is disabled in configuration")
	}

	logger.Debug("creating redis client",
		"host", cfg.Host,
		"port", cfg.Port,
		"pool_size", cfg.PoolSize,
		"min_idle_conns", cfg.MinIdleConns,
	)

	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     cfg.PoolSize,
		MinIdleConns: cfg.MinIdleConns,
	})

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		logger.Error("failed to connect to redis", "error", err)
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	logger.Info("redis client successfully initialized")
	return &Client{
		client: client,
		config: cfg,
		logger: logger,
	}, nil
}

// Изменить при добовление новых типов ключей
func (c *Client) getTTL(keyType string) time.Duration {
	switch keyType {
	case "order":
		return time.Duration(c.config.OrderTTL) * time.Second
	default:
		return time.Duration(c.config.DefaultTTL) * time.Second
	}
}

func (c *Client) Set(ctx context.Context, key string, value interface{}, keyType string) error {
	ttl := c.getTTL(keyType)
	c.logger.Debug("setting redis key", "key", key, "type", keyType, "ttl", ttl)

	err := c.client.Set(ctx, key, value, ttl).Err()
	if err != nil {
		c.logger.Error("failed to set redis key", "key", key, "error", err)
	}
	return err
}

func (c *Client) Get(ctx context.Context, key string) (string, error) {
	c.logger.Debug("getting redis key", "key", key)

	result, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		c.logger.Debug("redis key not found", "key", key)
		return "", fmt.Errorf("key %s not found", key)
	}
	if err != nil {
		c.logger.Error("failed to get redis key", "key", key, "error", err)
	}
	return result, err
}

func (c *Client) Delete(ctx context.Context, key string) error {
	c.logger.Debug("deleting redis key", "key", key)

	err := c.client.Del(ctx, key).Err()
	if err != nil {
		c.logger.Error("failed to delete redis key", "key", key, "error", err)
	}
	return err
}

func (c *Client) SetNX(ctx context.Context, key string, value interface{}, keyType string) (bool, error) {
	ttl := c.getTTL(keyType)
	c.logger.Debug("attempting to set redis key if not exists", "key", key, "type", keyType, "ttl", ttl)

	result, err := c.client.SetNX(ctx, key, value, ttl).Result()
	if err != nil {
		c.logger.Error("failed to set redis key with NX", "key", key, "error", err)
	}
	return result, err
}

func (c *Client) Pipeline(ctx context.Context, fn func(redis.Pipeliner) error) error {
	c.logger.Debug("starting redis pipeline")

	pipe := c.client.Pipeline()
	if err := fn(pipe); err != nil {
		c.logger.Error("failed to execute pipeline function", "error", err)
		return err
	}

	_, err := pipe.Exec(ctx)
	if err != nil {
		c.logger.Error("failed to execute redis pipeline", "error", err)
	} else {
		c.logger.Debug("pipeline executed successfully")
	}
	return err
}

func (c *Client) Health(ctx context.Context) error {
	c.logger.Debug("checking redis health")

	err := c.client.Ping(ctx).Err()
	if err != nil {
		c.logger.Error("redis health check failed", "error", err)
	} else {
		c.logger.Debug("redis health check successful")
	}
	return err
}

func (c *Client) GetClient() *redis.Client {
	return c.client
}

func (c *Client) Close() error {
	c.logger.Info("closing redis connection")
	return c.client.Close()
}
