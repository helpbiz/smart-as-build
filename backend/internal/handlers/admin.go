package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"smart-as/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

type AdminHandler struct {
	svc *service.Service
}

func NewAdminHandler(svc *service.Service) *AdminHandler {
	return &AdminHandler{svc: svc}
}

type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AdminHandler) Login(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResp, err := h.svc.LoginAdmin(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

func (h *AdminHandler) CreateAdmin(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.CreateAdmin(req.Username, req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "admin created"})
}

func (h *AdminHandler) GetDashboard(c *gin.Context) {
	stats, err := h.svc.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *AdminHandler) ListTechnicians(c *gin.Context) {
	technicians, err := h.svc.GetAllTechnicians()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, technicians)
}

func (h *AdminHandler) ApproveTechnician(c *gin.Context) {
	id := c.Param("id")
	techID := parseUint(id)

	if err := h.svc.ApproveTechnician(techID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "technician approved"})
}

func (h *AdminHandler) ListRepairRequests(c *gin.Context) {
	requests, err := h.svc.GetAllRepairRequests()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

func (h *AdminHandler) GetStatistics(c *gin.Context) {
	stats, err := h.svc.GetStatistics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *AdminHandler) ExportExcel(c *gin.Context) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "수리 요청 현황"

	headers := []string{
		"번호", "접수일", "고객명", "연락처", "주소",
		"제품명", "증상", "상태", "담당기사", "수리완료일",
		"수리내용", "사용부품", "결제금액", "결제방법",
	}

	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
	}

	style, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.SetRowStyle(sheetName, 1, 1, style)

	requests, err := h.svc.GetRepairRequestsForExport()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for idx, req := range requests {
		row := idx + 2

		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), req.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), req.CreatedAt.Format("2006-01-02 15:04"))
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), req.CustomerName)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), req.Phone)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), req.Address)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), req.ProductName)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), req.SymptomDescription)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), getStatusText(req.Status))

		if req.Technician != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), req.Technician.Name)
		} else {
			f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), "-")
		}

		if req.RepairCompletion != nil {
			f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), req.RepairCompletion.CompletedAt.Format("2006-01-02 15:04"))
			f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), req.RepairCompletion.RepairDetails)
			f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), req.RepairCompletion.PartsUsed)
			f.SetCellValue(sheetName, fmt.Sprintf("M%d", row), req.RepairCompletion.PaymentAmount)
			f.SetCellValue(sheetName, fmt.Sprintf("N%d", row), getPaymentMethodText(req.RepairCompletion.PaymentMethod))
		}
	}

	f.SetColWidth(sheetName, "A", "A", 6)
	f.SetColWidth(sheetName, "B", "B", 18)
	f.SetColWidth(sheetName, "C", "C", 12)
	f.SetColWidth(sheetName, "D", "D", 14)
	f.SetColWidth(sheetName, "E", "E", 30)
	f.SetColWidth(sheetName, "F", "F", 20)
	f.SetColWidth(sheetName, "G", "G", 25)
	f.SetColWidth(sheetName, "H", "H", 10)
	f.SetColWidth(sheetName, "I", "I", 12)
	f.SetColWidth(sheetName, "J", "J", 18)
	f.SetColWidth(sheetName, "K", "K", 30)
	f.SetColWidth(sheetName, "L", "L", 20)
	f.SetColWidth(sheetName, "M", "M", 12)
	f.SetColWidth(sheetName, "N", "N", 10)

	filename := fmt.Sprintf("smart_as_export_%s.xlsx", time.Now().Format("20060102_150405"))
	filepath := filepath.Join("/tmp", filename)

	if err := f.SaveAs(filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "application/octet-stream")
	c.File(filepath)
}

func getStatusText(status string) string {
	switch status {
	case "pending":
		return "대기"
	case "assigned":
		return "배정됨"
	case "repairing":
		return "수리중"
	case "completed":
		return "완료"
	default:
		return status
	}
}

func getPaymentMethodText(method string) string {
	switch method {
	case "card":
		return "카드"
	case "cash":
		return "현금"
	case "transfer":
		return "계좌이체"
	default:
		return method
	}
}
