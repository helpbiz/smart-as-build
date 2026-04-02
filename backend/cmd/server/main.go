package main

import (
	"fmt"
	"log"

	"smart-as/internal/config"
	"smart-as/internal/fcm"
	"smart-as/internal/handlers"
	"smart-as/internal/middleware"
	"smart-as/internal/models"
	"smart-as/internal/repository"
	"smart-as/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Technician{},
		&models.RepairRequest{},
		&models.RepairCompletion{},
		&models.Admin{},
	); err != nil {
		log.Printf("Warning: Migration error (may be already migrated): %v", err)
	}

	// purchase_date가 NOT NULL로 생성된 경우 nullable로 변경 (관리자 접수 등록 대응)
	db.Exec("ALTER TABLE repair_requests ALTER COLUMN purchase_date DROP NOT NULL")

	// email unique index를 partial index로 교체: 빈 이메일로 여러 기사/고객 등록 가능하게
	db.Exec("DROP INDEX IF EXISTS idx_technicians_email")
	db.Exec("DROP INDEX IF EXISTS idx_users_email")
	db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_technicians_email ON technicians(email) WHERE email != '' AND deleted_at IS NULL")
	db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email != '' AND deleted_at IS NULL")

	fcmClient, err := fcm.NewClient(&cfg.FCM)
	if err != nil {
		log.Printf("Warning: FCM initialization failed: %v", err)
	}

	repo := repository.New(db)
	svc := service.New(repo, cfg, fcmClient)

	customerHandler := handlers.NewCustomerHandler(svc)
	technicianHandler := handlers.NewTechnicianHandler(svc)
	adminHandler := handlers.NewAdminHandler(svc)

	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	api := r.Group("/api/v1")
	{
		customer := api.Group("/customer")
		{
			customer.POST("/register", customerHandler.Register)
			customer.POST("/login", customerHandler.Login)
			customer.POST("/repair-requests", middleware.AuthMiddleware(svc), customerHandler.CreateRepairRequest)
			customer.POST("/repair-requests/with-photos", middleware.AuthMiddleware(svc), customerHandler.CreateRepairRequestWithPhotos)
			customer.POST("/upload-photo", middleware.AuthMiddleware(svc), customerHandler.UploadPhoto)
			customer.GET("/repair-requests", middleware.AuthMiddleware(svc), customerHandler.ListRepairRequests)
			customer.GET("/repair-requests/:id", middleware.AuthMiddleware(svc), customerHandler.GetRepairRequest)
			customer.PUT("/repair-requests/:id/fcm-token", middleware.AuthMiddleware(svc), customerHandler.UpdateFCMToken)
		}

		technician := api.Group("/technician")
		{
			technician.POST("/register", technicianHandler.Register)
			technician.POST("/login", technicianHandler.Login)
			technician.GET("/me", middleware.AuthMiddleware(svc), technicianHandler.GetMe)
			technician.GET("/repair-requests", middleware.AuthMiddleware(svc), technicianHandler.ListAvailableRequests)
			technician.POST("/repair-requests/:id/accept", middleware.AuthMiddleware(svc), technicianHandler.AcceptRequest)
			technician.GET("/assignments", middleware.AuthMiddleware(svc), technicianHandler.ListAssignments)
			technician.POST("/assignments/:id/start", middleware.AuthMiddleware(svc), technicianHandler.StartRepair)
			technician.POST("/assignments/:id/complete", middleware.AuthMiddleware(svc), technicianHandler.CompleteRepair)
			technician.PUT("/fcm-token", middleware.AuthMiddleware(svc), technicianHandler.UpdateFCMToken)
		}

		admin := api.Group("/admin")
		{
			admin.POST("/login", adminHandler.Login)
			admin.POST("/register", adminHandler.CreateAdmin)
			admin.GET("/dashboard", middleware.AuthMiddleware(svc), adminHandler.GetDashboard)
			admin.GET("/technicians", middleware.AuthMiddleware(svc), adminHandler.ListTechnicians)
			admin.PUT("/technicians/:id/approve", middleware.AuthMiddleware(svc), adminHandler.ApproveTechnician)
			admin.PUT("/technicians/:id/reject", middleware.AuthMiddleware(svc), adminHandler.RejectTechnician)
			admin.GET("/repair-requests", middleware.AuthMiddleware(svc), adminHandler.ListRepairRequests)
			admin.POST("/upload-photo", middleware.AuthMiddleware(svc), adminHandler.UploadPhoto)
			admin.POST("/repair-requests", middleware.AuthMiddleware(svc), adminHandler.AdminCreateRepairRequest)
			admin.PUT("/repair-requests/:id/assign", middleware.AuthMiddleware(svc), adminHandler.AdminAssignTechnician)
			admin.PUT("/repair-requests/:id/status", middleware.AuthMiddleware(svc), adminHandler.AdminUpdateRequestStatus)
			admin.POST("/technicians", middleware.AuthMiddleware(svc), adminHandler.AdminCreateTechnician)
			admin.DELETE("/technicians/:id", middleware.AuthMiddleware(svc), adminHandler.AdminDeleteTechnician)
			admin.GET("/statistics", middleware.AuthMiddleware(svc), adminHandler.GetStatistics)
			admin.GET("/export/excel", middleware.AuthMiddleware(svc), adminHandler.ExportExcel)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.Static("/uploads", "./uploads")
	r.Static("/assets", "./frontend/admin-web/dist/assets")
	r.StaticFile("/", "./frontend/admin-web/dist/index.html")
	r.NoRoute(func(c *gin.Context) {
		c.File("./frontend/admin-web/dist/index.html")
	})

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
