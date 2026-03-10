package database

import (
	"log"

	"github.com/muhadif/mockinaja/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(dsn string) {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(&models.User{}, &models.Project{}, &models.MockEndpoint{})
	if err != nil {
		log.Fatalf("Failed to migrate database schema: %v", err)
	}

	log.Println("Database connection established and migrations run.")
}
