package servers

import "sync"

type Server interface {
	Start() error
	Stop() error
}

type Manager struct {
	servers []Server
}

func NewManager() *Manager {
	return &Manager{}
}

func (m *Manager) AddServer(server Server) {
	m.servers = append(m.servers, server)
}

func (m *Manager) StartAll() error {
	var wg sync.WaitGroup
	for _, server := range m.servers {
		wg.Add(1)
		go func(s Server) {
			defer wg.Done()
			if err := s.Start(); err != nil {
				// Логируем ошибку
			}
		}(server)
	}
	wg.Wait()
	return nil
}

func (m *Manager) StopAll() error {
	for _, server := range m.servers {
		if err := server.Stop(); err != nil {
			// Логируем ошибку
		}
	}
	return nil
}
