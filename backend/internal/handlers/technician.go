package handlers

import (
	"net/http"
	"strconv"

	"smart-as/internal/models"
	"smart-as/internal/service"

	"github.com/gin-gonic/gin"
)

type TechnicianHandler struct {
	svc *service.Service
}

func NewTechnicianHandler(svc *service.Service) *TechnicianHandler {
	return &TechnicianHandler{svc: svc}
}

func (h *TechnicianHandler) Register(c *gin.Context) {
	var req models.TechnicianRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tech, err := h.svc.RegisterTechnician(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tech)
}

func (h *TechnicianHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResp, err := h.svc.LoginTechnician(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

func (h *TechnicianHandler) GetMe(c *gin.Context) {
	techID := c.GetUint("user_id")

	tech, err := h.svc.GetTechnicianByID(techID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "technician not found"})
		return
	}

	c.JSON(http.StatusOK, tech)
}

func (h *TechnicianHandler) ListAvailableRequests(c *gin.Context) {
	techID := c.GetUint("user_id")
	latStr := c.Query("latitude")
	lonStr := c.Query("longitude")

	var lat, lon float64
	if latStr != "" {
		lat, _ = strconv.ParseFloat(latStr, 64)
	}
	if lonStr != "" {
		lon, _ = strconv.ParseFloat(lonStr, 64)
	}

	requests, err := h.svc.GetAvailableRepairRequests(techID, lat, lon)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

func (h *TechnicianHandler) AcceptRequest(c *gin.Context) {
	techID := c.GetUint("user_id")

	id := c.Param("id")
	requestID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.svc.AcceptRepairRequest(techID, uint(requestID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "request accepted"})
}

func (h *TechnicianHandler) ListAssignments(c *gin.Context) {
	techID := c.GetUint("user_id")

	requests, err := h.svc.GetMyAssignments(techID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

func (h *TechnicianHandler) StartRepair(c *gin.Context) {
	id := c.Param("id")
	requestID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.svc.StartRepair(uint(requestID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "repair started"})
}

func (h *TechnicianHandler) CompleteRepair(c *gin.Context) {
	techID := c.GetUint("user_id")

	id := c.Param("id")
	requestID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req models.CompleteRepairRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.CompleteRepair(techID, uint(requestID), &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "repair completed"})
}

func (h *TechnicianHandler) UpdateFCMToken(c *gin.Context) {
	techID := c.GetUint("user_id")

	var req models.UpdateFCMTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.UpdateTechnicianFCMToken(techID, req.FCMToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "fcm token updated"})
}
