package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"smart-as/internal/models"
	"smart-as/internal/service"

	"github.com/gin-gonic/gin"
)

type CustomerHandler struct {
	svc *service.Service
}

func NewCustomerHandler(svc *service.Service) *CustomerHandler {
	return &CustomerHandler{svc: svc}
}

func (h *CustomerHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.svc.RegisterUser(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func (h *CustomerHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResp, err := h.svc.LoginUser(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

func (h *CustomerHandler) CreateRepairRequest(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req models.CreateRepairRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rr, err := h.svc.CreateRepairRequest(userID, &req, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, rr)
}

func (h *CustomerHandler) GetRepairRequest(c *gin.Context) {
	id := c.Param("id")
	requestID := parseUint(id)

	if requestID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	rr, err := h.svc.GetRepairRequestByID(requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, rr)
}

func (h *CustomerHandler) ListRepairRequests(c *gin.Context) {
	userID := c.GetUint("user_id")

	requests, err := h.svc.GetMyRepairRequests(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

func (h *CustomerHandler) UpdateFCMToken(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req models.UpdateFCMTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.UpdateUserFCMToken(userID, req.FCMToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "fcm token updated"})
}

func (h *CustomerHandler) UploadPhoto(c *gin.Context) {
	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), 0, ext)
	uploadDir := "./uploads"

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload directory"})
		return
	}

	filepath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":      "/uploads/" + filename,
		"filename": filename,
	})
}

func (h *CustomerHandler) CreateRepairRequestWithPhotos(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req models.CreateRepairRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	form, _ := c.MultipartForm()
	var photoURLs []string

	if form != nil && form.File["photos"] != nil {
		files := form.File["photos"]
		uploadDir := "./uploads"
		os.MkdirAll(uploadDir, 0755)

		for i, file := range files {
			ext := filepath.Ext(file.Filename)
			filename := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), i, ext)
			filepath := filepath.Join(uploadDir, filename)

			if err := c.SaveUploadedFile(file, filepath); err != nil {
				continue
			}
			photoURLs = append(photoURLs, "/uploads/"+filename)
		}
	}

	rr, err := h.svc.CreateRepairRequest(userID, &req, photoURLs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, rr)
}
