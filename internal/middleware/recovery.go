package middleware

import (
	"net/http"
	"runtime/debug"

	"github.com/RudinMaxim/template/pkg/logger"
	"github.com/gin-gonic/gin"
)

type RecoveryConfig struct {
	Logger *logger.Logger
}

func Recovery(config *RecoveryConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				stack := debug.Stack()

				config.Logger.Error("panic recovered",
					map[string]interface{}{
						"error":  err,
						"stack":  string(stack),
						"path":   c.Request.URL.Path,
						"method": c.Request.Method,
					},
				)

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error": "internal server error",
				})
			}
		}()

		c.Next()
	}
}
