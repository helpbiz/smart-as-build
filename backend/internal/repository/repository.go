package repository

import (
	"smart-as/internal/models"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// User operations

func (r *Repository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *Repository) GetUserByPhone(phone string) (*models.User, error) {
	var user models.User
	err := r.db.Where("phone = ?", phone).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) UpdateUserFCMToken(userID uint, token string) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("fcm_token", token).Error
}

// Technician operations

func (r *Repository) CreateTechnician(tech *models.Technician) error {
	return r.db.Create(tech).Error
}

func (r *Repository) GetTechnicianByPhone(phone string) (*models.Technician, error) {
	var tech models.Technician
	err := r.db.Where("phone = ?", phone).First(&tech).Error
	if err != nil {
		return nil, err
	}
	return &tech, nil
}

func (r *Repository) GetTechnicianByID(id uint) (*models.Technician, error) {
	var tech models.Technician
	err := r.db.First(&tech, id).Error
	if err != nil {
		return nil, err
	}
	return &tech, nil
}

func (r *Repository) GetApprovedTechnicians() ([]models.Technician, error) {
	var technicians []models.Technician
	err := r.db.Where("status = ?", "approved").Find(&technicians).Error
	return technicians, err
}

func (r *Repository) GetAllTechnicians() ([]models.Technician, error) {
	var technicians []models.Technician
	err := r.db.Find(&technicians).Error
	return technicians, err
}

func (r *Repository) UpdateTechnicianStatus(id uint, status string) error {
	return r.db.Model(&models.Technician{}).Where("id = ?", id).Update("status", status).Error
}

func (r *Repository) UpdateTechnicianFCMToken(techID uint, token string) error {
	return r.db.Model(&models.Technician{}).Where("id = ?", techID).Update("fcm_token", token).Error
}

// RepairRequest operations

func (r *Repository) CreateRepairRequest(req *models.RepairRequest) error {
	return r.db.Create(req).Error
}

func (r *Repository) GetRepairRequestByID(id uint) (*models.RepairRequest, error) {
	var req models.RepairRequest
	err := r.db.Preload("User").Preload("Technician").Preload("RepairCompletion").First(&req, id).Error
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *Repository) GetPendingRepairRequests() ([]models.RepairRequest, error) {
	var requests []models.RepairRequest
	err := r.db.Where("status = ?", "pending").Preload("User").Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *Repository) GetRepairRequestsByUserID(userID uint) ([]models.RepairRequest, error) {
	var requests []models.RepairRequest
	err := r.db.Where("user_id = ?", userID).Preload("Technician").Preload("RepairCompletion").Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *Repository) GetRepairRequestsByTechnicianID(techID uint) ([]models.RepairRequest, error) {
	var requests []models.RepairRequest
	err := r.db.Where("technician_id = ?", techID).Preload("User").Preload("RepairCompletion").Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *Repository) GetAssignedRepairRequests(techID uint) ([]models.RepairRequest, error) {
	var requests []models.RepairRequest
	err := r.db.Where("technician_id = ? AND status IN ?", techID, []string{"assigned", "repairing"}).Preload("User").Order("accepted_at DESC").Find(&requests).Error
	return requests, err
}

func (r *Repository) AssignTechnician(requestID, techID uint) error {
	return r.db.Model(&models.RepairRequest{}).Where("id = ? AND status = ?", requestID, "pending").
		Updates(map[string]interface{}{
			"technician_id": techID,
			"status":        "assigned",
		}).Error
}

func (r *Repository) UpdateRepairRequestStatus(id uint, status string) error {
	return r.db.Model(&models.RepairRequest{}).Where("id = ?", id).Update("status", status).Error
}

func (r *Repository) GetAllRepairRequests() ([]models.RepairRequest, error) {
	var requests []models.RepairRequest
	err := r.db.Preload("User").Preload("Technician").Preload("RepairCompletion").Order("created_at DESC").Find(&requests).Error
	return requests, err
}

// RepairCompletion operations

func (r *Repository) CreateRepairCompletion(comp *models.RepairCompletion) error {
	return r.db.Create(comp).Error
}

// Admin operations

func (r *Repository) CreateAdmin(admin *models.Admin) error {
	return r.db.Create(admin).Error
}

func (r *Repository) GetAdminByUsername(username string) (*models.Admin, error) {
	var admin models.Admin
	err := r.db.Where("username = ?", username).First(&admin).Error
	if err != nil {
		return nil, err
	}
	return &admin, nil
}

// Dashboard/Statistics

func (r *Repository) GetTodayRequestCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.RepairRequest{}).
		Where("DATE(created_at) = CURRENT_DATE").Count(&count).Error
	return count, err
}

func (r *Repository) GetTodayAssignedCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.RepairRequest{}).
		Where("DATE(accepted_at) = CURRENT_DATE AND status IN ?", []string{"assigned", "repairing", "completed"}).Count(&count).Error
	return count, err
}

func (r *Repository) GetTodayCompletedCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.RepairRequest{}).
		Where("DATE(updated_at) = CURRENT_DATE AND status = ?", "completed").Count(&count).Error
	return count, err
}

func (r *Repository) GetPendingRequestCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.RepairRequest{}).Where("status = ?", "pending").Count(&count).Error
	return count, err
}

func (r *Repository) GetTotalTechnicianCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.Technician{}).Count(&count).Error
	return count, err
}

func (r *Repository) GetApprovedTechnicianCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.Technician{}).Where("status = ?", "approved").Count(&count).Error
	return count, err
}

func (r *Repository) GetTotalRevenue() (int64, error) {
	var total int64
	err := r.db.Model(&models.RepairCompletion{}).Select("COALESCE(SUM(payment_amount), 0)").Scan(&total).Error
	return total, err
}

func (r *Repository) GetTechnicianStats() ([]models.TechnicianStat, error) {
	var stats []models.TechnicianStat
	err := r.db.Model(&models.RepairCompletion{}).
		Select("repair_completions.technician_id, technicians.name as technician_name, COUNT(*) as total_jobs, SUM(repair_completions.payment_amount) as total_revenue").
		Joins("JOIN technicians ON technicians.id = repair_completions.technician_id").
		Group("repair_completions.technician_id, technicians.name").
		Order("total_revenue DESC").
		Scan(&stats).Error
	return stats, err
}

func (r *Repository) GetMonthlyRevenue() ([]models.MonthlyStat, error) {
	var stats []models.MonthlyStat
	err := r.db.Model(&models.RepairCompletion{}).
		Select("TO_CHAR(completed_at, 'YYYY-MM') as month, SUM(payment_amount) as revenue, COUNT(*) as count").
		Group("TO_CHAR(completed_at, 'YYYY-MM')").
		Order("month DESC").
		Limit(12).
		Scan(&stats).Error
	return stats, err
}

func (r *Repository) GetRepairRequestsForExport() ([]models.RepairRequest, error) {
	var requests []models.RepairRequest
	err := r.db.
		Preload("User").
		Preload("Technician").
		Preload("RepairCompletion").
		Order("created_at ASC").
		Find(&requests).Error
	return requests, err
}
