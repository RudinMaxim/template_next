package servers

import (
	"net/http"

	"github.com/gorilla/websocket"
)

type WSServer struct {
	addr     string
	upgrader websocket.Upgrader
	handler  func(*websocket.Conn)
}

func NewWSServer(addr string, handler func(*websocket.Conn)) *WSServer {
	return &WSServer{
		addr: addr,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		handler: handler,
	}
}

func (s *WSServer) Start() error {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		conn, err := s.upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		go s.handler(conn)
	})
	return http.ListenAndServe(s.addr, nil)
}

func (s *WSServer) Stop() error {
	// WebSocket сервер не требует явной остановки.
	return nil
}
