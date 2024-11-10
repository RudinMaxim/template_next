package app

import (
	"github.com/google/wire"
)

var commonSet = wire.NewSet()

var serviceSet = wire.NewSet()

var serverSet = wire.NewSet()

func InitializeApp() (*App, func(), error) {
	panic(wire.Build(
		commonSet,
		serviceSet,
		serverSet,
		NewApp,
	))
}
