package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type RateLimiterConfig struct {
	Limit      int           // Максимальное количество запросов
	WindowSize time.Duration // Временное окно
	Redis      *redis.Client
}

func RateLimiter(config RateLimiterConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := generateRateLimitKey(c)
		ctx := context.Background()

		// Инкрементируем счетчик запросов
		count, err := config.Redis.Incr(ctx, key).Result()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "rate limit error"})
			return
		}

		// Устанавливаем TTL при первом запросе
		if count == 1 {
			config.Redis.Expire(ctx, key, config.WindowSize)
		}

		// Проверяем лимит
		if count > int64(config.Limit) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
			})
			return
		}

		c.Next()
	}
}

func generateRateLimitKey(c *gin.Context) string {
	// Генерируем ключ на основе IP или user_id
	identifier := c.ClientIP()
	if userID, exists := c.Get("user_id"); exists {
		identifier = fmt.Sprintf("%v", userID)
	}
	return fmt.Sprintf("ratelimit:%s", identifier)
}
