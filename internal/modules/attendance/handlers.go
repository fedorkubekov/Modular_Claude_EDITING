package attendance

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"modular-erp/internal/core/middleware"
	"modular-erp/pkg/utils"
)

// Handler handles HTTP requests for attendance module
type Handler struct {
	service *Service
}

// NewHandler creates a new attendance handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// ClockInRequest represents a clock-in request
type ClockInRequest struct {
	// No additional fields needed, user info comes from JWT
}

// ClockOutRequest represents a clock-out request
type ClockOutRequest struct {
	Notes string `json:"notes"`
}

// ClockIn handles employee clock-in
func (h *Handler) ClockIn(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	shift, err := h.service.ClockIn(claims.UserID, claims.CompanyID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Clocked in successfully",
		"shift":   shift,
	})
}

// ClockOut handles employee clock-out
func (h *Handler) ClockOut(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req ClockOutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	shift, err := h.service.ClockOut(claims.UserID, req.Notes)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Clocked out successfully",
		"shift":   shift,
	})
}

// GetMyShifts retrieves shifts for the authenticated user
func (h *Handler) GetMyShifts(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	shifts, err := h.service.GetMyShifts(claims.UserID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve shifts")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shifts": shifts,
		"count":  len(shifts),
	})
}

// GetActiveShift retrieves the active shift for the authenticated user
func (h *Handler) GetActiveShift(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	shift, err := h.service.GetMyActiveShift(claims.UserID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve active shift")
		return
	}

	if shift == nil {
		respondWithJSON(w, http.StatusOK, map[string]interface{}{
			"message": "No active shift",
			"shift":   nil,
		})
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shift": shift,
	})
}

// GetAllShifts retrieves all shifts for the company (manager/admin only)
func (h *Handler) GetAllShifts(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	// Parse date range (default to last 30 days)
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)

	if startStr := r.URL.Query().Get("start_date"); startStr != "" {
		if parsed, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = parsed
		}
	}

	if endStr := r.URL.Query().Get("end_date"); endStr != "" {
		if parsed, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = parsed.Add(24 * time.Hour) // Include the entire end date
		}
	}

	shifts, err := h.service.GetAllShifts(claims.CompanyID, startDate, endDate, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve shifts")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shifts":     shifts,
		"count":      len(shifts),
		"start_date": startDate.Format("2006-01-02"),
		"end_date":   endDate.Format("2006-01-02"),
	})
}

// GetReport generates attendance statistics (manager/admin only)
func (h *Handler) GetReport(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Parse date range (default to last 30 days)
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)

	if startStr := r.URL.Query().Get("start_date"); startStr != "" {
		if parsed, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = parsed
		}
	}

	if endStr := r.URL.Query().Get("end_date"); endStr != "" {
		if parsed, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = parsed.Add(24 * time.Hour)
		}
	}

	report, err := h.service.GetReport(claims.CompanyID, startDate, endDate)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate report")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"report":     report,
		"start_date": startDate.Format("2006-01-02"),
		"end_date":   endDate.Format("2006-01-02"),
	})
}

// Helper functions
func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}
