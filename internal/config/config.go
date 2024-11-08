package config

import (
	"fmt"
	"log"
	"os"

	"github.com/spf13/viper"
)

type Config struct {
	API  APIConfig  `mapstructure:"api"`
	Node NodeConfig `mapstructure:"node"`
}

type APIConfig struct {
	Port string `mapstructure:"port"`
	URL  string `mapstructure:"url"`
}

type NodeConfig struct {
	Mode string `mapstructure:"mode"`
}

type ConfigLoader struct {
	v *viper.Viper
}

func NewConfigLoader() *ConfigLoader {
	return &ConfigLoader{
		v: viper.New(),
	}
}

func LoadConfig() (*Config, error) {
	loader := NewConfigLoader()
	return loader.Load()
}

func (cl *ConfigLoader) Load() (*Config, error) {
	if err := cl.setDefaults(); err != nil {
		return nil, fmt.Errorf("error setting defaults: %w", err)
	}

	if err := cl.loadConfigFile(); err != nil {
		return nil, fmt.Errorf("error loading config file: %w", err)
	}

	var config Config
	if err := cl.v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

func (cl *ConfigLoader) setDefaults() error {
	cl.v.SetDefault("node.mode", getEnvOrDefault("NODE_MODE", "development"))

	// API defaults
	cl.v.SetDefault("api.port", getEnvOrDefault("API_PORT", "8080"))
	cl.v.SetDefault("api.url", getEnvOrDefault("API_URL", "http://localhost"))

	// Postgres defaults
	cl.v.SetDefault("postgres.host", getEnvOrDefault("POSTGRES_HOST", "localhost"))
	cl.v.SetDefault("postgres.port", getEnvOrDefault("POSTGRES_PORT", "5432"))
	cl.v.SetDefault("postgres.user", getEnvOrDefault("POSTGRES_USER", "postgres"))
	cl.v.SetDefault("postgres.password", getEnvOrDefault("POSTGRES_PASSWORD", ""))
	cl.v.SetDefault("postgres.dbname", getEnvOrDefault("POSTGRES_NAME", "beautysync"))
	cl.v.SetDefault("postgres.max_idle_conns", 10)
	cl.v.SetDefault("postgres.max_open_conns", 100)
	cl.v.SetDefault("postgres.conn_max_lifetime", 3600)
	cl.v.SetDefault("postgres.sslmode", "disable")

	// Redis defaults
	cl.v.SetDefault("redis.host", getEnvOrDefault("REDIS_HOST", "localhost"))
	cl.v.SetDefault("redis.port", getEnvOrDefault("REDIS_PORT", "6379"))
	cl.v.SetDefault("redis.password", getEnvOrDefault("REDIS_PASSWORD", ""))
	cl.v.SetDefault("redis.db", 0)
	cl.v.SetDefault("redis.pool_size", 10)
	cl.v.SetDefault("redis.min_idle_conns", 5)

	// Cache defaults
	cl.v.SetDefault("redis.default_ttl", 300)
	cl.v.SetDefault("redis.category_ttl", 3600)
	cl.v.SetDefault("redis.service_ttl", 1800)
	cl.v.SetDefault("redis.tag_ttl", 3600)
	cl.v.SetDefault("redis.enabled", true)

	return nil
}

func (cl *ConfigLoader) loadConfigFile() error {
	cl.v.SetConfigName("config")
	cl.v.SetConfigType("yaml")

	cl.v.AddConfigPath(".")
	cl.v.AddConfigPath("./config")
	cl.v.AddConfigPath("../config")

	cl.v.AutomaticEnv()

	if err := cl.v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("Config file not found. Creating default config file...")
			return cl.createDefaultConfigFile()
		}
		return fmt.Errorf("error reading config file: %w", err)
	}

	log.Printf("Using config file: %s", cl.v.ConfigFileUsed())
	return nil
}
func (cl *ConfigLoader) createDefaultConfigFile() error {
	if err := cl.v.SafeWriteConfig(); err != nil {
		return fmt.Errorf("error writing default config file: %w", err)
	}
	log.Println("Default config file created. Please edit it with your settings and restart the application.")
	return nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
