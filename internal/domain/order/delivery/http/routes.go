package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		order := api.Group("/orders")
		{
			order.GET("/", getOrdersHandler)
			order.POST("/", createOrderHandler)
		}
	}
}

func getOrdersHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "List of orders",
	})
}

func createOrderHandler(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{
		"message": "Order created",
	})
}
