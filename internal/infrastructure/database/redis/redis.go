package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/BeautySync/BS_CatalogNode/pkg/errors"
	"github.com/BeautySync/BS_CatalogNode/pkg/logger"
	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	client *redis.Client
	logger *logger.AsyncLogger
}

type CacheItem struct {
	Value      interface{}
	Expiration time.Duration
}

func New(ctx context.Context, config Config, logger *logger.AsyncLogger) (*RedisCache, error) {
	cache := &RedisCache{
		logger: logger,
	}

	if err := cache.connect(ctx, config); err != nil {
		return nil, err
	}

	return cache, nil
}

func (c *RedisCache) connect(ctx context.Context, config Config) error {
	c.client = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", config.Host, config.Port),
		Password: config.Password,
		DB:       config.DB,
		PoolSize: config.PoolSize,
	})

	if err := c.client.Ping(ctx).Err(); err != nil {
		return errors.NewCacheError(err)
	}

	c.logger.Info("successfully connected to redis", nil)
	return nil
}

func (c *RedisCache) Set(ctx context.Context, key string, item CacheItem) error {
	value, err := json.Marshal(item.Value)
	if err != nil {
		return errors.NewCacheError(err)
	}

	if err := c.client.Set(ctx, key, value, item.Expiration).Err(); err != nil {
		return errors.NewCacheError(err)
	}

	return nil
}

func (c *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	value, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return errors.NewCacheError(err)
		}
		return errors.NewCacheError(err)
	}

	if err := json.Unmarshal(value, dest); err != nil {
		return errors.NewCacheError(err)
	}

	return nil
}

func (c *RedisCache) Delete(ctx context.Context, pattern string) error {
	iter := c.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		if err := c.client.Del(ctx, iter.Val()).Err(); err != nil {
			c.logger.Error("failed to delete key",
				map[string]interface{}{
					"key":   iter.Val(),
					"error": err,
				})
		}
	}

	if err := iter.Err(); err != nil {
		return errors.NewCacheError(err)
	}

	return nil
}
