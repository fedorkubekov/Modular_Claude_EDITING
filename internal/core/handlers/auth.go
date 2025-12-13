package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"modular-erp/internal/core/models"
	"modular-erp/pkg/utils"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	db        *sql.DB
	jwtSecret string
	jwtExpiry int
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *sql.DB, jwtSecret string, jwtExpiry int) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
	}
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	CompanyName string `json:"company_name"` // For new companies
	CompanyID   int    `json:"company_id"`   // For existing companies
	Username    string `json:"username"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	FullName    string `json:"full_name"`
	Role        string `json:"role"` // admin, manager, employee
}

// Login handles user login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Username == "" || req.Password == "" {
		respondWithError(w, http.StatusBadRequest, "Username and password are required")
		return
	}

	// Get user from database
	user, err := models.GetUserByUsername(h.db, req.Username)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Check password
	if !models.CheckPasswordHash(req.Password, user.PasswordHash) {
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate JWT token
	token, err := utils.GenerateToken(
		user.ID,
		user.CompanyID,
		user.Username,
		user.Role,
		h.jwtSecret,
		h.jwtExpiry,
	)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondWithJSON(w, http.StatusOK, LoginResponse{
		Token: token,
		User:  user,
	})
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" {
		respondWithError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	if !models.ValidateRole(req.Role) {
		respondWithError(w, http.StatusBadRequest, "Invalid role. Must be: admin, manager, or employee")
		return
	}

	// Hash password
	passwordHash, err := models.HashPassword(req.Password)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process password")
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer tx.Rollback()

	companyID := req.CompanyID

	// Create company if needed (when registering first admin user)
	if req.CompanyName != "" && req.Role == "admin" {
		err = tx.QueryRow(`
			INSERT INTO companies (name, created_at, updated_at)
			VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			RETURNING id
		`, req.CompanyName).Scan(&companyID)

		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to create company")
			return
		}
	} else if companyID == 0 {
		respondWithError(w, http.StatusBadRequest, "Company ID or Company Name is required")
		return
	}

	// Create user
	var userID int
	err = tx.QueryRow(`
		INSERT INTO users (company_id, username, email, password_hash, full_name, role, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`, companyID, req.Username, req.Email, passwordHash, req.FullName, req.Role).Scan(&userID)

	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Username or email already exists")
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Get the created user
	user, err := models.GetUserByID(h.db, userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "User created but failed to retrieve")
		return
	}

	// Generate token
	token, err := utils.GenerateToken(
		user.ID,
		user.CompanyID,
		user.Username,
		user.Role,
		h.jwtSecret,
		h.jwtExpiry,
	)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondWithJSON(w, http.StatusCreated, LoginResponse{
		Token: token,
		User:  user,
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
