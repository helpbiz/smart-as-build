package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"time"

	"smart-as/internal/config"
	"smart-as/internal/fcm"
	"smart-as/internal/models"
	"smart-as/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo   *repository.Repository
	config *config.Config
	fcm    *fcm.FCMClient
}

func New(repo *repository.Repository, cfg *config.Config, fcmClient *fcm.FCMClient) *Service {
	return &Service{repo: repo, config: cfg, fcm: fcmClient}
}

// User operations

func (s *Service) RegisterUser(req *models.RegisterRequest) (*models.User, error) {
	existing, _ := s.repo.GetUserByPhone(req.Phone)
	if existing != nil {
		return nil, errors.New("phone already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Phone:        req.Phone,
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) LoginUser(req *models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.repo.GetUserByPhone(req.Phone)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := s.generateToken(user.ID, "user")
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: user}, nil
}

func (s *Service) GetUserByID(id uint) (*models.User, error) {
	return s.repo.GetUserByID(id)
}

func (s *Service) UpdateUserFCMToken(userID uint, token string) error {
	return s.repo.UpdateUserFCMToken(userID, token)
}

// Technician operations

func (s *Service) RegisterTechnician(req *models.TechnicianRegisterRequest) (*models.Technician, error) {
	existing, _ := s.repo.GetTechnicianByPhone(req.Phone)
	if existing != nil {
		return nil, errors.New("phone already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	tech := &models.Technician{
		Phone:        req.Phone,
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Status:       "pending",
		ServiceArea:  req.ServiceArea,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
	}

	if err := s.repo.CreateTechnician(tech); err != nil {
		return nil, err
	}

	return tech, nil
}

func (s *Service) LoginTechnician(req *models.LoginRequest) (*models.AuthResponse, error) {
	tech, err := s.repo.GetTechnicianByPhone(req.Phone)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(tech.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Allow login for all statuses - pending technicians can login but will see approval message

	token, err := s.generateToken(tech.ID, "technician")
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: tech}, nil
}

func (s *Service) UpdateTechnicianFCMToken(techID uint, token string) error {
	return s.repo.UpdateTechnicianFCMToken(techID, token)
}

func (s *Service) GetTechnicianByID(id uint) (*models.Technician, error) {
	return s.repo.GetTechnicianByID(id)
}

func (s *Service) GetAllTechnicians() ([]models.Technician, error) {
	return s.repo.GetAllTechnicians()
}

func (s *Service) ApproveTechnician(id uint) error {
	return s.repo.UpdateTechnicianStatus(id, "approved")
}

func (s *Service) RejectTechnician(id uint) error {
	return s.repo.UpdateTechnicianStatus(id, "rejected")
}

// RepairRequest operations

func (s *Service) CreateRepairRequest(userID uint, req *models.CreateRepairRequest, photoURLs []string) (*models.RepairRequest, error) {
	photosJSON := "[]"
	if len(photoURLs) > 0 {
		if data, err := json.Marshal(photoURLs); err == nil {
			photosJSON = string(data)
		}
	}

	rr := &models.RepairRequest{
		UserID:             userID,
		ProductName:        req.ProductName,
		PurchaseDate:       req.PurchaseDate,
		CustomerName:       req.CustomerName,
		Phone:              req.Phone,
		Address:            req.Address,
		Latitude:           req.Latitude,
		Longitude:          req.Longitude,
		SymptomDescription: req.SymptomDescription,
		SymptomPhotos:      photosJSON,
		Status:             "pending",
	}

	if err := s.repo.CreateRepairRequest(rr); err != nil {
		return nil, err
	}

	go s.notifyTechniciansNewRequest(rr)

	return rr, nil
}

func (s *Service) GetRepairRequestByID(id uint) (*models.RepairRequest, error) {
	return s.repo.GetRepairRequestByID(id)
}

func (s *Service) GetMyRepairRequests(userID uint) ([]models.RepairRequest, error) {
	return s.repo.GetRepairRequestsByUserID(userID)
}

func (s *Service) GetAvailableRepairRequests(techID uint, techLat, techLon float64) ([]models.RepairRequest, error) {
	tech, err := s.repo.GetTechnicianByID(techID)
	if err != nil {
		return nil, errors.New("technician not found")
	}
	if tech.Status != "approved" {
		return nil, errors.New("승인된 기사만 요청을 조회할 수 있습니다")
	}

	requests, err := s.repo.GetPendingRepairRequests()
	if err != nil {
		return nil, err
	}

	return requests, nil
}

func (s *Service) AcceptRepairRequest(techID, requestID uint) error {
	tech, err := s.repo.GetTechnicianByID(techID)
	if err != nil || tech.Status != "approved" {
		return errors.New("승인된 기사만 요청을 수락할 수 있습니다")
	}

	req, err := s.repo.GetRepairRequestByID(requestID)
	if err != nil {
		return errors.New("request not found")
	}

	if req.Status != "pending" {
		return errors.New("request already assigned")
	}

	if err := s.repo.AssignTechnician(requestID, techID); err != nil {
		return errors.New("failed to assign - request may have been taken")
	}

	now := time.Now()
	req.AcceptedAt = &now

	go s.notifyCustomerRequestAccepted(req, techID)

	return nil
}

func (s *Service) GetMyAssignments(techID uint) ([]models.RepairRequest, error) {
	return s.repo.GetAssignedRepairRequests(techID)
}

func (s *Service) StartRepair(requestID uint) error {
	req, err := s.repo.GetRepairRequestByID(requestID)
	if err != nil {
		return errors.New("request not found")
	}

	if req.Status != "assigned" {
		return errors.New("request not in assigned state")
	}

	return s.repo.UpdateRepairRequestStatus(requestID, "repairing")
}

func (s *Service) CompleteRepair(techID, requestID uint, req *models.CompleteRepairRequest) error {
	repReq, err := s.repo.GetRepairRequestByID(requestID)
	if err != nil {
		return errors.New("request not found")
	}

	if repReq.TechnicianID == nil || *repReq.TechnicianID != techID {
		return errors.New("unauthorized")
	}

	if repReq.Status != "repairing" {
		return errors.New("request not in repairing state")
	}

	photosJSON := "[]"
	if len(req.CompletionPhotos) > 0 {
		if data, err := json.Marshal(req.CompletionPhotos); err == nil {
			photosJSON = string(data)
		}
	}

	completion := &models.RepairCompletion{
		RepairRequestID:  requestID,
		TechnicianID:     techID,
		RepairDetails:    req.RepairDetails,
		PartsUsed:        req.PartsUsed,
		PaymentAmount:    req.PaymentAmount,
		PaymentMethod:    req.PaymentMethod,
		CompletionPhotos: photosJSON,
		CompletedAt:      time.Now(),
	}

	if err := s.repo.CreateRepairCompletion(completion); err != nil {
		return err
	}

	if err := s.repo.UpdateRepairRequestStatus(requestID, "completed"); err != nil {
		return err
	}

	go s.notifyCustomerRequestCompleted(repReq.UserID, repReq.ProductName)

	return nil
}

// Admin operations

func (s *Service) LoginAdmin(username, password string) (*models.AuthResponse, error) {
	admin, err := s.repo.GetAdminByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token, err := s.generateToken(admin.ID, "admin")
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: admin}, nil
}

func (s *Service) CreateAdmin(username, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin := &models.Admin{
		Username:     username,
		PasswordHash: string(hashedPassword),
	}

	return s.repo.CreateAdmin(admin)
}

func (s *Service) GetDashboardStats() (*models.DashboardStats, error) {
	todayReq, _ := s.repo.GetTodayRequestCount()
	todayAssigned, _ := s.repo.GetTodayAssignedCount()
	todayCompleted, _ := s.repo.GetTodayCompletedCount()
	pending, _ := s.repo.GetPendingRequestCount()
	totalTech, _ := s.repo.GetTotalTechnicianCount()
	approvedTech, _ := s.repo.GetApprovedTechnicianCount()

	return &models.DashboardStats{
		TodayRequests:       todayReq,
		TodayAssigned:       todayAssigned,
		TodayCompleted:      todayCompleted,
		PendingRequests:     pending,
		TotalTechnicians:    totalTech,
		ApprovedTechnicians: approvedTech,
	}, nil
}

func (s *Service) GetAllRepairRequests() ([]models.RepairRequest, error) {
	return s.repo.GetAllRepairRequests()
}

func (s *Service) GetStatistics() (*models.Statistics, error) {
	totalRevenue, _ := s.repo.GetTotalRevenue()
	monthly, _ := s.repo.GetMonthlyRevenue()
	techStats, _ := s.repo.GetTechnicianStats()

	return &models.Statistics{
		TotalRevenue:    totalRevenue,
		MonthlyRevenue:  monthly,
		TechnicianStats: techStats,
	}, nil
}

func (s *Service) GetRepairRequestsForExport() ([]models.RepairRequest, error) {
	return s.repo.GetRepairRequestsForExport()
}

// JWT token generation

func (s *Service) generateToken(userID uint, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * time.Duration(s.config.JWT.ExpiryHours)).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWT.Secret))
}

func (s *Service) ValidateToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// Haversine formula for distance calculation

func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371

	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

func (s *Service) notifyTechniciansNewRequest(rr *models.RepairRequest) {
	if s.fcm == nil || !s.fcm.IsEnabled() {
		return
	}

	technicians, err := s.repo.GetApprovedTechnicians()
	if err != nil {
		return
	}

	var tokens []string
	for _, tech := range technicians {
		if tech.FCMToken != "" {
			tokens = append(tokens, tech.FCMToken)
		}
	}

	if len(tokens) == 0 {
		return
	}

	ctx := context.Background()
	title := "새 수리 요청"
	body := fmt.Sprintf("%s - %s", rr.ProductName, rr.Address)

	s.fcm.SendToMultiple(ctx, tokens, title, body, map[string]string{
		"type":       "new_request",
		"request_id": fmt.Sprintf("%d", rr.ID),
		"product":    rr.ProductName,
		"address":    rr.Address,
		"customer":   rr.CustomerName,
		"phone":      rr.Phone,
	})
}

func (s *Service) notifyCustomerRequestAccepted(req *models.RepairRequest, techID uint) {
	if s.fcm == nil || !s.fcm.IsEnabled() {
		return
	}

	user, err := s.repo.GetUserByID(req.UserID)
	if err != nil || user.FCMToken == "" {
		return
	}

	tech, err := s.repo.GetTechnicianByID(techID)
	if err != nil {
		return
	}

	ctx := context.Background()
	title := "수리 요청 수락"
	body := fmt.Sprintf("%s 기사가 수리를 수락했습니다.", tech.Name)

	s.fcm.SendNotification(ctx, user.FCMToken, title, body, map[string]string{
		"type":       "request_accepted",
		"request_id": fmt.Sprintf("%d", req.ID),
		"technician": tech.Name,
		"phone":      tech.Phone,
	})
}

func (s *Service) notifyCustomerRequestCompleted(userID uint, productName string) {
	if s.fcm == nil || !s.fcm.IsEnabled() {
		return
	}

	user, err := s.repo.GetUserByID(userID)
	if err != nil || user.FCMToken == "" {
		return
	}

	ctx := context.Background()
	title := "수리 완료"
	body := fmt.Sprintf("%s 수리가 완료되었습니다.", productName)

	s.fcm.SendNotification(ctx, user.FCMToken, title, body, map[string]string{
		"type":    "request_completed",
		"product": productName,
	})
}
