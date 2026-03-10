package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        string    `gorm:"type:uuid;primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Name      string    `gorm:"not null" json:"name"`
	Password  string    `gorm:"not null" json:"-"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Project struct {
	ID          string         `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `json:"description"`
	UserID      string         `gorm:"type:uuid;not null;index" json:"userId"`
	User        User           `gorm:"foreignKey:UserID" json:"-"`
	Endpoints   []MockEndpoint `gorm:"foreignKey:ProjectID" json:"endpoints"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

type MockEndpoint struct {
	ID              string  `gorm:"type:uuid;primaryKey" json:"id"`
	ProjectID       string  `gorm:"type:uuid;not null;index" json:"projectId"`
	Project         Project `gorm:"foreignKey:ProjectID" json:"-"`
	Path            string  `gorm:"not null" json:"path"`
	Method          string  `gorm:"not null" json:"method"`
	StatusCode      int     `gorm:"not null;default:200" json:"statusCode"`
	ResponseHeaders string  `gorm:"type:text" json:"responseHeaders"` // Stored as JSON string
	ResponseBody    string  `gorm:"type:text" json:"responseBody"`    // Stored as JSON string

	// Advanced Simulation
	DelayMs         *int   `json:"delayMs"`
	RateLimitTokens *int   `json:"rateLimitTokens"`             // e.g. 10 requests
	RateLimitWindow *int   `json:"rateLimitWindow"`             // e.g. per 60 seconds
	AuthHeader      string `gorm:"type:text" json:"authHeader"` // e.g. "Bearer token123"

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Ensure UUID gets generated before create
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		u.ID = uuid.NewString()
	}
	return
}

func (p *Project) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == "" {
		p.ID = uuid.NewString()
	}
	return
}

func (m *MockEndpoint) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return
}
