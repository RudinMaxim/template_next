package servers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HTTPServer struct {
	engine *gin.Engine
	addr   string
	server *http.Server
}

func NewHTTPServer(addr string, engine *gin.Engine) *HTTPServer {
	return &HTTPServer{
		engine: engine,
		addr:   addr,
		server: &http.Server{
			Addr:    addr,
			Handler: engine,
		},
	}
}

func (s *HTTPServer) Start() error {
	return s.server.ListenAndServe()
}

func (s *HTTPServer) Stop() error {
	return s.server.Shutdown(context.Background())
}
