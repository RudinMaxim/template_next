package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/RudinMaxim/template/cmd/app"
)

func main() {
	application, cleanup, err := app.InitializeApp()
	if err != nil {
		log.Fatalf("Failed to initialize application: %v", err)
	}
	defer cleanup()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	if err := application.Run(); err != nil {
		log.Fatalf("Failed to start application: %v", err)
	}

	<-stop

	if err := application.Shutdown(); err != nil {
		log.Printf("Error during shutdown: %v", err)
	}
}
