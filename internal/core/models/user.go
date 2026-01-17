package models

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID             int       `json:"id"`
	CompanyID      int       `json:"company_id"`
	Username       string    `json:"username"`
	Email          string    `json:"email"`
	PasswordHash   string    `json:"-"` // Never send password hash in JSON
	FullName       string    `json:"full_name"`
	Role           string    `json:"role"` // admin, manager, employee
	EmploymentType string    `json:"employment_type"`
	ShiftType      string    `json:"shift_type"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Company represents a business/company in the system
type Company struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// HashPassword hashes a plain text password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares a password with a hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ValidateRole checks if a role is valid
func ValidateRole(role string) bool {
	validRoles := map[string]bool{
		"admin":    true,
		"manager":  true,
		"employee": true,
	}
	return validRoles[role]
}

// GetUserByUsername retrieves a user by username
func GetUserByUsername(db *sql.DB, username string) (*User, error) {
	user := &User{}
	err := db.QueryRow(`
		SELECT id, company_id, username, email, password_hash, full_name, role, employment_type, shift_type, is_active, created_at, updated_at
		FROM users WHERE username = $1 AND is_active = true
	`, username).Scan(
		&user.ID, &user.CompanyID, &user.Username, &user.Email, &user.PasswordHash,
		&user.FullName, &user.Role, &user.EmploymentType, &user.ShiftType, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(db *sql.DB, id int) (*User, error) {
	user := &User{}
	err := db.QueryRow(`
		SELECT id, company_id, username, email, password_hash, full_name, role, employment_type, shift_type, is_active, created_at, updated_at
		FROM users WHERE id = $1 AND is_active = true
	`, id).Scan(
		&user.ID, &user.CompanyID, &user.Username, &user.Email, &user.PasswordHash,
		&user.FullName, &user.Role, &user.EmploymentType, &user.ShiftType, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}
