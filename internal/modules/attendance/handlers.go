package attendance

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
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

	// Parse filters
	filters := parseShiftFiltersFromRequest(r)

	shifts, err := h.service.GetMyShifts(claims.UserID, filters, limit, offset)
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

	// Parse filters
	filters := parseShiftFiltersFromRequest(r)

	shifts, err := h.service.GetAllShifts(claims.CompanyID, startDate, endDate, filters, limit, offset)
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

// GetEmployees retrieves all employees for the company (manager/admin only)
func (h *Handler) GetEmployees(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	employees, err := h.service.GetEmployeesWithStats(claims.CompanyID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve employees")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"employees": employees,
		"count":     len(employees),
	})
}

// UpdateEmployeeSchedule updates an employee's employment type and shift (manager/admin only)
func (h *Handler) UpdateEmployeeSchedule(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get employee ID from URL path
	employeeIDStr := r.URL.Query().Get("id")
	if employeeIDStr == "" {
		respondWithError(w, http.StatusBadRequest, "Employee ID is required")
		return
	}

	employeeID, err := strconv.Atoi(employeeIDStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid employee ID")
		return
	}

	var req struct {
		EmploymentType string `json:"employment_type"`
		ShiftType      string `json:"shift_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate employment type
	validEmploymentTypes := map[string]bool{
		"Full-Time": true,
		"Part-Time": true,
		"Seasonal":  true,
		"Temporary": true,
		"On-Call":   true,
	}
	if !validEmploymentTypes[req.EmploymentType] {
		respondWithError(w, http.StatusBadRequest, "Invalid employment type")
		return
	}

	// Validate shift type
	validShiftTypes := map[string]bool{
		"First Shift":  true,
		"Second Shift": true,
		"Third Shift":  true,
	}
	if !validShiftTypes[req.ShiftType] {
		respondWithError(w, http.StatusBadRequest, "Invalid shift type")
		return
	}

	err = h.service.UpdateEmployeeSchedule(claims.CompanyID, employeeID, req.EmploymentType, req.ShiftType)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Employee schedule updated successfully",
	})
}

// GetWeekShifts retrieves all shifts for a specific week (manager/admin only)
func (h *Handler) GetWeekShifts(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	weekStartStr := r.URL.Query().Get("week_start")
	if weekStartStr == "" {
		respondWithError(w, http.StatusBadRequest, "week_start parameter is required")
		return
	}

	weekStart, err := time.Parse("2006-01-02", weekStartStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid date format")
		return
	}

	shifts, err := h.service.GetWeekShifts(claims.CompanyID, weekStart)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to retrieve shifts")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"shifts": shifts,
		"count":  len(shifts),
	})
}

// AssignShiftRequest represents a request to assign a shift
type AssignShiftRequest struct {
	UserID   int    `json:"user_id"`
	ClockIn  string `json:"clock_in"`
	ClockOut string `json:"clock_out"`
}

// AssignShift assigns a shift to an employee (manager/admin only)
func (h *Handler) AssignShift(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req AssignShiftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	clockIn, err := time.Parse(time.RFC3339, req.ClockIn)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid clock_in time format")
		return
	}

	clockOut, err := time.Parse(time.RFC3339, req.ClockOut)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid clock_out time format")
		return
	}

	shift, err := h.service.AssignShift(claims.CompanyID, req.UserID, clockIn, clockOut)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Shift assigned successfully",
		"shift":   shift,
	})
}

// UpdateShiftRequest represents a request to update a shift
type UpdateShiftRequest struct {
	ClockIn  string `json:"clock_in"`
	ClockOut string `json:"clock_out"`
}

// UpdateShift updates an existing shift (manager/admin only)
func (h *Handler) UpdateShift(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	shiftIDStr := r.URL.Query().Get("id")
	if shiftIDStr == "" {
		respondWithError(w, http.StatusBadRequest, "Shift ID is required")
		return
	}

	shiftID, err := strconv.Atoi(shiftIDStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid shift ID")
		return
	}

	var req UpdateShiftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	clockIn, err := time.Parse(time.RFC3339, req.ClockIn)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid clock_in time format")
		return
	}

	clockOut, err := time.Parse(time.RFC3339, req.ClockOut)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid clock_out time format")
		return
	}

	err = h.service.UpdateShift(claims.CompanyID, shiftID, clockIn, clockOut)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Shift updated successfully",
	})
}

// DeleteShift deletes a shift (manager/admin only)
func (h *Handler) DeleteShift(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserClaimsKey).(*utils.Claims)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	shiftIDStr := r.URL.Query().Get("id")
	if shiftIDStr == "" {
		respondWithError(w, http.StatusBadRequest, "Shift ID is required")
		return
	}

	shiftID, err := strconv.Atoi(shiftIDStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid shift ID")
		return
	}

	err = h.service.DeleteShift(claims.CompanyID, shiftID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Shift deleted successfully",
	})
}

// parseShiftFiltersFromRequest parses filter parameters from HTTP request
func parseShiftFiltersFromRequest(r *http.Request) *ShiftFilters {
	filters := &ShiftFilters{}
	query := r.URL.Query()

	// Parse user IDs (comma-separated)
	if userIDsStr := query.Get("user_ids"); userIDsStr != "" {
		ids := strings.Split(userIDsStr, ",")
		for _, idStr := range ids {
			if id, err := strconv.Atoi(strings.TrimSpace(idStr)); err == nil {
				filters.UserIDs = append(filters.UserIDs, id)
			}
		}
	}

	// Parse roles (comma-separated)
	if rolesStr := query.Get("roles"); rolesStr != "" {
		filters.Roles = strings.Split(rolesStr, ",")
		// Trim whitespace
		for i := range filters.Roles {
			filters.Roles[i] = strings.TrimSpace(filters.Roles[i])
		}
	}

	// Parse statuses (comma-separated)
	if statusesStr := query.Get("statuses"); statusesStr != "" {
		filters.Statuses = strings.Split(statusesStr, ",")
		// Trim whitespace
		for i := range filters.Statuses {
			filters.Statuses[i] = strings.TrimSpace(filters.Statuses[i])
		}
	}

	// Parse notes search
	filters.NotesSearch = query.Get("notes_search")

	// Parse clock_in time range
	if clockInFromStr := query.Get("clock_in_from"); clockInFromStr != "" {
		if t, err := time.Parse(time.RFC3339, clockInFromStr); err == nil {
			filters.ClockInFrom = &t
		}
	}
	if clockInToStr := query.Get("clock_in_to"); clockInToStr != "" {
		if t, err := time.Parse(time.RFC3339, clockInToStr); err == nil {
			filters.ClockInTo = &t
		}
	}

	// Parse clock_out time range
	if clockOutFromStr := query.Get("clock_out_from"); clockOutFromStr != "" {
		if t, err := time.Parse(time.RFC3339, clockOutFromStr); err == nil {
			filters.ClockOutFrom = &t
		}
	}
	if clockOutToStr := query.Get("clock_out_to"); clockOutToStr != "" {
		if t, err := time.Parse(time.RFC3339, clockOutToStr); err == nil {
			filters.ClockOutTo = &t
		}
	}

	// Parse duration range
	if minHoursStr := query.Get("duration_min_hours"); minHoursStr != "" {
		if hours, err := strconv.Atoi(minHoursStr); err == nil {
			filters.DurationMinHours = hours
		}
	}
	if minMinsStr := query.Get("duration_min_mins"); minMinsStr != "" {
		if mins, err := strconv.Atoi(minMinsStr); err == nil {
			filters.DurationMinMins = mins
		}
	}
	if maxHoursStr := query.Get("duration_max_hours"); maxHoursStr != "" {
		if hours, err := strconv.Atoi(maxHoursStr); err == nil {
			filters.DurationMaxHours = hours
		}
	}
	if maxMinsStr := query.Get("duration_max_mins"); maxMinsStr != "" {
		if mins, err := strconv.Atoi(maxMinsStr); err == nil {
			filters.DurationMaxMins = mins
		}
	}

	return filters
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
