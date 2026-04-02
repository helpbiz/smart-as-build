package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a customer
type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Phone        string         `gorm:"uniqueIndex;not null" json:"phone"`
	Name         string         `gorm:"not null" json:"name"`
	Email        string         `gorm:"uniqueIndex" json:"email,omitempty"`
	PasswordHash string         `gorm:"not null" json:"-"`
	FCMToken     string         `json:"fcm_token,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// Technician represents an A/S repair technician
type Technician struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Phone        string         `gorm:"uniqueIndex;not null" json:"phone"`
	Name         string         `gorm:"not null" json:"name"`
	Email        string         `gorm:"uniqueIndex" json:"email,omitempty"`
	PasswordHash string         `gorm:"not null" json:"-"`
	FCMToken     string         `json:"fcm_token,omitempty"`
	Status       string         `gorm:"not null;default:pending" json:"status"` // pending, approved, suspended
	ServiceArea  string         `json:"service_area,omitempty"`
	Latitude     float64        `json:"latitude"`
	Longitude    float64        `json:"longitude"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// RepairRequest represents an A/S service request
type RepairRequest struct {
	ID                   uint           `gorm:"primaryKey" json:"id"`
	UserID               *uint          `gorm:"index" json:"user_id,omitempty"`
	TechnicianID         *uint          `gorm:"index" json:"technician_id,omitempty"`
	ProductName          string         `gorm:"not null" json:"product_name"`
	PurchaseDate         time.Time      `json:"purchase_date"`
	CustomerName         string         `gorm:"not null" json:"customer_name"`
	Phone                string         `gorm:"not null" json:"phone"`
	Address              string         `gorm:"not null" json:"address"`
	Latitude             float64        `json:"latitude"`
	Longitude            float64        `json:"longitude"`
	SymptomDescription   string         `gorm:"type:text" json:"symptom_description"`
	SymptomPhotos        string         `gorm:"type:jsonb" json:"symptom_photos"` // JSON array of URLs
	Status               string         `gorm:"not null;default:pending" json:"status"` // pending, assigned, repairing, completed
	AcceptedAt           *time.Time     `json:"accepted_at,omitempty"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-"`
	
	User         *User         `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Technician   *Technician   `gorm:"foreignKey:TechnicianID" json:"technician,omitempty"`
	RepairCompletion *RepairCompletion `gorm:"foreignKey:RepairRequestID" json:"repair_completion,omitempty"`
}

// RepairCompletion represents completed repair details
type RepairCompletion struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	RepairRequestID  uint      `gorm:"not null;uniqueIndex" json:"repair_request_id"`
	TechnicianID     uint      `gorm:"not null" json:"technician_id"`
	RepairDetails    string    `gorm:"type:text" json:"repair_details"`
	PartsUsed        string    `gorm:"type:text" json:"parts_used"`
	PaymentAmount    int       `gorm:"not null" json:"payment_amount"` // in won
	PaymentMethod    string    `gorm:"not null" json:"payment_method"` // card, cash, transfer
	CompletionPhotos string    `gorm:"type:jsonb" json:"completion_photos"` // JSON array of URLs
	CompletedAt      time.Time `json:"completed_at"`
	
	RepairRequest *RepairRequest `gorm:"foreignKey:RepairRequestID" json:"-"`
	Technician    *Technician    `gorm:"foreignKey:TechnicianID" json:"technician,omitempty"`
}

// Admin represents an admin user
type Admin struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;not null" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// Request/Response DTOs

type RegisterRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  interface{} `json:"user"`
}

type CreateRepairRequest struct {
	ProductName        string    `json:"product_name" binding:"required"`
	PurchaseDate       time.Time `json:"purchase_date" binding:"required"`
	CustomerName       string    `json:"customer_name" binding:"required"`
	Phone              string    `json:"phone" binding:"required"`
	Address            string    `json:"address" binding:"required"`
	Latitude           float64   `json:"latitude"`
	Longitude          float64   `json:"longitude"`
	SymptomDescription string    `json:"symptom_description"`
	SymptomPhotos      []string  `json:"symptom_photos"`
}

type CompleteRepairRequest struct {
	RepairDetails    string   `json:"repair_details" binding:"required"`
	PartsUsed        string   `json:"parts_used"`
	PaymentAmount    int      `json:"payment_amount" binding:"required"`
	PaymentMethod    string   `json:"payment_method" binding:"required"`
	CompletionPhotos []string `json:"completion_photos"`
}

type TechnicianRegisterRequest struct {
	Phone       string  `json:"phone" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Email       string  `json:"email"`
	Password    string  `json:"password" binding:"required,min=6"`
	ServiceArea string  `json:"service_area"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

type UpdateFCMTokenRequest struct {
	FCMToken string `json:"fcm_token" binding:"required"`
}

type AdminCreateRepairRequestDTO struct {
	ProductName        string `json:"product_name" binding:"required"`
	CustomerName       string `json:"customer_name" binding:"required"`
	Phone              string `json:"phone" binding:"required"`
	Address            string `json:"address" binding:"required"`
	SymptomDescription string `json:"symptom_description"`
}

type AdminAssignRequestDTO struct {
	TechnicianID uint `json:"technician_id" binding:"required"`
}

type AdminUpdateStatusDTO struct {
	Status string `json:"status" binding:"required"`
}

type DashboardStats struct {
	TodayRequests   int64 `json:"today_requests"`
	TodayAssigned   int64 `json:"today_assigned"`
	TodayCompleted  int64 `json:"today_completed"`
	PendingRequests int64 `json:"pending_requests"`
	TotalTechnicians int64 `json:"total_technicians"`
	ApprovedTechnicians int64 `json:"approved_technicians"`
}

type Statistics struct {
	TotalRevenue     int64                   `json:"total_revenue"`
	MonthlyRevenue   []MonthlyStat           `json:"monthly_revenue"`
	TechnicianStats  []TechnicianStat        `json:"technician_stats"`
}

type MonthlyStat struct {
	Month   string `json:"month"`
	Revenue int64  `json:"revenue"`
	Count   int64  `json:"count"`
}

type TechnicianStat struct {
	TechnicianID   uint   `json:"technician_id"`
	TechnicianName string `json:"technician_name"`
	TotalJobs      int64  `json:"total_jobs"`
	TotalRevenue   int64  `json:"total_revenue"`
}
