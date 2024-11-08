package middleware

import (
	"net/http"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
)

type CircuitBreaker struct {
	failureThreshold uint32
	resetTimeout     time.Duration
	failures         atomic.Uint32
	lastFailure      atomic.Int64
	isOpen           atomic.Bool
}

func NewCircuitBreaker(threshold uint32, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		failureThreshold: threshold,
		resetTimeout:     timeout,
	}
}

func (cb *CircuitBreaker) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cb.canRequest() {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"error": "service is temporarily unavailable",
			})
			return
		}

		c.Next()

		if len(c.Errors) > 0 {
			cb.recordFailure()
		}
	}
}

func (cb *CircuitBreaker) canRequest() bool {
	if !cb.isOpen.Load() {
		return true
	}

	lastFailureTime := time.Unix(0, cb.lastFailure.Load())
	if time.Since(lastFailureTime) > cb.resetTimeout {
		cb.isOpen.Store(false)
		cb.failures.Store(0)
		return true
	}
	return false
}

func (cb *CircuitBreaker) recordFailure() {
	failures := cb.failures.Add(1)
	if failures >= cb.failureThreshold {
		cb.isOpen.Store(true)
		cb.lastFailure.Store(time.Now().UnixNano())
	}
}
