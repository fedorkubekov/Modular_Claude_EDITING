package attendance

import (
	"database/sql"
	"errors"
	"strconv"
	"time"

	"github.com/lib/pq"
)

// Shift represents a work shift
type Shift struct {
	ID        int        `json:"id"`
	UserID    int        `json:"user_id"`
	CompanyID int        `json:"company_id"`
	ClockIn   time.Time  `json:"clock_in"`
	ClockOut  *time.Time `json:"clock_out,omitempty"`
	Status    string     `json:"status"` // in_progress, completed, cancelled
	Notes     string     `json:"notes,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// ShiftWithUserInfo represents a shift with user information
type ShiftWithUserInfo struct {
	Shift
	Username string `json:"username"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

// ShiftReport represents shift statistics
type ShiftReport struct {
	TotalShifts     int     `json:"total_shifts"`
	CompletedShifts int     `json:"completed_shifts"`
	ActiveShifts    int     `json:"active_shifts"`
	TotalHours      float64 `json:"total_hours"`
	AverageHours    float64 `json:"average_hours"`
}

// EmployeeWithStats represents an employee with their statistics
type EmployeeWithStats struct {
	ID               int     `json:"id"`
	FullName         string  `json:"full_name"`
	Username         string  `json:"username"`
	Email            string  `json:"email"`
	Role             string  `json:"role"`
	EmploymentType   string  `json:"employment_type"`
	ShiftType        string  `json:"shift_type"`
	MonthlyHours     float64 `json:"monthly_hours"`
	IsActive         bool    `json:"is_active"`
}

// ShiftFilters represents filter parameters for shift queries
type ShiftFilters struct {
	UserIDs          []int      // Filter by specific user IDs
	Roles            []string   // Filter by user roles
	Statuses         []string   // Filter by shift statuses
	NotesSearch      string     // Search in notes field
	ClockInFrom      *time.Time // Clock in time range start
	ClockInTo        *time.Time // Clock in time range end
	ClockOutFrom     *time.Time // Clock out time range start
	ClockOutTo       *time.Time // Clock out time range end
	DurationMinHours int        // Minimum duration in hours
	DurationMinMins  int        // Minimum duration in minutes
	DurationMaxHours int        // Maximum duration in hours
	DurationMaxMins  int        // Maximum duration in minutes
}

// CreateShift creates a new shift record
func CreateShift(db *sql.DB, userID, companyID int) (*Shift, error) {
	// Check if user has an active shift
	var activeShiftID int
	err := db.QueryRow(`
		SELECT id FROM shifts
		WHERE user_id = $1 AND status = 'in_progress'
		LIMIT 1
	`, userID).Scan(&activeShiftID)

	if err != sql.ErrNoRows {
		return nil, errors.New("user already has an active shift")
	}

	shift := &Shift{
		UserID:    userID,
		CompanyID: companyID,
		ClockIn:   time.Now(),
		Status:    "in_progress",
	}

	err = db.QueryRow(`
		INSERT INTO shifts (user_id, company_id, clock_in, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, clock_in, created_at, updated_at
	`, shift.UserID, shift.CompanyID, shift.ClockIn, shift.Status).Scan(
		&shift.ID, &shift.ClockIn, &shift.CreatedAt, &shift.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return shift, nil
}

// EndShift ends an active shift
func EndShift(db *sql.DB, userID int, notes string) (*Shift, error) {
	clockOut := time.Now()

	shift := &Shift{}
	err := db.QueryRow(`
		UPDATE shifts
		SET clock_out = $1, status = 'completed', notes = $2, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $3 AND status = 'in_progress'
		RETURNING id, user_id, company_id, clock_in, clock_out, status, notes, created_at, updated_at
	`, clockOut, notes, userID).Scan(
		&shift.ID, &shift.UserID, &shift.CompanyID, &shift.ClockIn, &shift.ClockOut,
		&shift.Status, &shift.Notes, &shift.CreatedAt, &shift.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("no active shift found")
	}
	if err != nil {
		return nil, err
	}

	return shift, nil
}

// GetUserShifts retrieves all shifts for a specific user with optional filters
func GetUserShifts(db *sql.DB, userID int, filters *ShiftFilters, limit, offset int) ([]Shift, error) {
	// Build base query
	query := `
		SELECT id, user_id, company_id, clock_in, clock_out, status,
		       COALESCE(notes, '') as notes, created_at, updated_at,
		       EXTRACT(EPOCH FROM (COALESCE(clock_out, CURRENT_TIMESTAMP) - clock_in)) / 3600 as duration_hours
		FROM shifts
		WHERE user_id = $1`

	args := []interface{}{userID}
	paramCount := 1

	// Apply filters
	if filters != nil {
		// Filter by statuses
		if len(filters.Statuses) > 0 {
			paramCount++
			query += ` AND status = ANY($` + strconv.Itoa(paramCount) + `)`
			args = append(args, pq.Array(filters.Statuses))
		}

		// Filter by notes search
		if filters.NotesSearch != "" {
			paramCount++
			query += ` AND LOWER(notes) LIKE LOWER($` + strconv.Itoa(paramCount) + `)`
			args = append(args, "%"+filters.NotesSearch+"%")
		}

		// Filter by clock_in time range
		if filters.ClockInFrom != nil {
			paramCount++
			query += ` AND clock_in >= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockInFrom)
		}
		if filters.ClockInTo != nil {
			paramCount++
			query += ` AND clock_in <= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockInTo)
		}

		// Filter by clock_out time range
		if filters.ClockOutFrom != nil {
			paramCount++
			query += ` AND clock_out >= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockOutFrom)
		}
		if filters.ClockOutTo != nil {
			paramCount++
			query += ` AND clock_out <= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockOutTo)
		}

		// Filter by duration
		if filters.DurationMinHours > 0 || filters.DurationMinMins > 0 {
			minSeconds := (filters.DurationMinHours * 3600) + (filters.DurationMinMins * 60)
			paramCount++
			query += ` AND EXTRACT(EPOCH FROM (COALESCE(clock_out, CURRENT_TIMESTAMP) - clock_in)) >= $` + strconv.Itoa(paramCount)
			args = append(args, minSeconds)
		}
		if filters.DurationMaxHours > 0 || filters.DurationMaxMins > 0 {
			maxSeconds := (filters.DurationMaxHours * 3600) + (filters.DurationMaxMins * 60)
			paramCount++
			query += ` AND EXTRACT(EPOCH FROM (COALESCE(clock_out, CURRENT_TIMESTAMP) - clock_in)) <= $` + strconv.Itoa(paramCount)
			args = append(args, maxSeconds)
		}
	}

	// Add ordering and pagination
	query += ` ORDER BY clock_in DESC`
	paramCount++
	query += ` LIMIT $` + strconv.Itoa(paramCount)
	args = append(args, limit)
	paramCount++
	query += ` OFFSET $` + strconv.Itoa(paramCount)
	args = append(args, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shifts []Shift
	for rows.Next() {
		var shift Shift
		var durationHours float64 // Temporary variable
		err := rows.Scan(
			&shift.ID, &shift.UserID, &shift.CompanyID, &shift.ClockIn, &shift.ClockOut,
			&shift.Status, &shift.Notes, &shift.CreatedAt, &shift.UpdatedAt, &durationHours,
		)
		if err != nil {
			return nil, err
		}
		shifts = append(shifts, shift)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return shifts, nil
}

// GetActiveShift retrieves the active shift for a user
func GetActiveShift(db *sql.DB, userID int) (*Shift, error) {
	shift := &Shift{}
	var notes sql.NullString // Handle NULL notes

	err := db.QueryRow(`
		SELECT id, user_id, company_id, clock_in, clock_out, status,
		       COALESCE(notes, '') as notes, created_at, updated_at
		FROM shifts
		WHERE user_id = $1 AND status = 'in_progress'
		LIMIT 1
	`, userID).Scan(
		&shift.ID, &shift.UserID, &shift.CompanyID, &shift.ClockIn, &shift.ClockOut,
		&shift.Status, &notes, &shift.CreatedAt, &shift.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Convert sql.NullString to string
	shift.Notes = notes.String

	return shift, nil
}

// GetCompanyShifts retrieves all shifts for a company with user info and optional filters
func GetCompanyShifts(db *sql.DB, companyID int, startDate, endDate time.Time, filters *ShiftFilters, limit, offset int) ([]ShiftWithUserInfo, error) {
	// Build base query
	query := `
		SELECT s.id, s.user_id, s.company_id, s.clock_in, s.clock_out, s.status,
		       COALESCE(s.notes, '') as notes,
		       s.created_at, s.updated_at, u.username, u.full_name, u.role,
		       EXTRACT(EPOCH FROM (COALESCE(s.clock_out, CURRENT_TIMESTAMP) - s.clock_in)) / 3600 as duration_hours
		FROM shifts s
		JOIN users u ON s.user_id = u.id
		WHERE s.company_id = $1 AND s.clock_in >= $2 AND s.clock_in <= $3`

	args := []interface{}{companyID, startDate, endDate}
	paramCount := 3

	// Apply filters
	if filters != nil {
		// Filter by user IDs
		if len(filters.UserIDs) > 0 {
			paramCount++
			query += ` AND s.user_id = ANY($` + strconv.Itoa(paramCount) + `)`
			args = append(args, pq.Array(filters.UserIDs))
		}

		// Filter by roles
		if len(filters.Roles) > 0 {
			paramCount++
			query += ` AND u.role = ANY($` + strconv.Itoa(paramCount) + `)`
			args = append(args, pq.Array(filters.Roles))
		}

		// Filter by statuses
		if len(filters.Statuses) > 0 {
			paramCount++
			query += ` AND s.status = ANY($` + strconv.Itoa(paramCount) + `)`
			args = append(args, pq.Array(filters.Statuses))
		}

		// Filter by notes search
		if filters.NotesSearch != "" {
			paramCount++
			query += ` AND LOWER(s.notes) LIKE LOWER($` + strconv.Itoa(paramCount) + `)`
			args = append(args, "%"+filters.NotesSearch+"%")
		}

		// Filter by clock_in time range
		if filters.ClockInFrom != nil {
			paramCount++
			query += ` AND s.clock_in >= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockInFrom)
		}
		if filters.ClockInTo != nil {
			paramCount++
			query += ` AND s.clock_in <= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockInTo)
		}

		// Filter by clock_out time range
		if filters.ClockOutFrom != nil {
			paramCount++
			query += ` AND s.clock_out >= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockOutFrom)
		}
		if filters.ClockOutTo != nil {
			paramCount++
			query += ` AND s.clock_out <= $` + strconv.Itoa(paramCount)
			args = append(args, filters.ClockOutTo)
		}

		// Filter by duration
		if filters.DurationMinHours > 0 || filters.DurationMinMins > 0 {
			minSeconds := (filters.DurationMinHours * 3600) + (filters.DurationMinMins * 60)
			paramCount++
			query += ` AND EXTRACT(EPOCH FROM (COALESCE(s.clock_out, CURRENT_TIMESTAMP) - s.clock_in)) >= $` + strconv.Itoa(paramCount)
			args = append(args, minSeconds)
		}
		if filters.DurationMaxHours > 0 || filters.DurationMaxMins > 0 {
			maxSeconds := (filters.DurationMaxHours * 3600) + (filters.DurationMaxMins * 60)
			paramCount++
			query += ` AND EXTRACT(EPOCH FROM (COALESCE(s.clock_out, CURRENT_TIMESTAMP) - s.clock_in)) <= $` + strconv.Itoa(paramCount)
			args = append(args, maxSeconds)
		}
	}

	// Add ordering and pagination
	query += ` ORDER BY s.clock_in DESC`
	paramCount++
	query += ` LIMIT $` + strconv.Itoa(paramCount)
	args = append(args, limit)
	paramCount++
	query += ` OFFSET $` + strconv.Itoa(paramCount)
	args = append(args, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shifts []ShiftWithUserInfo
	for rows.Next() {
		var shift ShiftWithUserInfo
		var durationHours float64 // Temporary variable for duration calculation
		err := rows.Scan(
			&shift.ID, &shift.UserID, &shift.CompanyID, &shift.ClockIn, &shift.ClockOut,
			&shift.Status, &shift.Notes, &shift.CreatedAt, &shift.UpdatedAt,
			&shift.Username, &shift.FullName, &shift.Role, &durationHours,
		)
		if err != nil {
			return nil, err
		}
		shifts = append(shifts, shift)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return shifts, nil
}

// GetShiftReport generates a report of shift statistics
func GetShiftReport(db *sql.DB, companyID int, startDate, endDate time.Time) (*ShiftReport, error) {
	report := &ShiftReport{}

	err := db.QueryRow(`
		SELECT
			COUNT(*) as total_shifts,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_shifts,
			COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_shifts,
			COALESCE(SUM(EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600), 0) as total_hours
		FROM shifts
		WHERE company_id = $1 AND clock_in >= $2 AND clock_in <= $3
	`, companyID, startDate, endDate).Scan(
		&report.TotalShifts,
		&report.CompletedShifts,
		&report.ActiveShifts,
		&report.TotalHours,
	)

	if err != nil {
		return nil, err
	}

	if report.CompletedShifts > 0 {
		report.AverageHours = report.TotalHours / float64(report.CompletedShifts)
	}

	return report, nil
}

// GetEmployeesWithMonthlyHours retrieves all employees with their monthly hours worked
func GetEmployeesWithMonthlyHours(db *sql.DB, companyID int) ([]EmployeeWithStats, error) {
	// Calculate start of current month
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0)

	rows, err := db.Query(`
		SELECT
			u.id,
			u.full_name,
			u.username,
			u.email,
			u.role,
			u.employment_type,
			u.shift_type,
			u.is_active,
			COALESCE(SUM(
				CASE
					WHEN s.status = 'completed' THEN EXTRACT(EPOCH FROM (s.clock_out - s.clock_in)) / 3600
					ELSE 0
				END
			), 0) as monthly_hours
		FROM users u
		LEFT JOIN shifts s ON u.id = s.user_id
			AND s.clock_in >= $2
			AND s.clock_in < $3
			AND s.status = 'completed'
		WHERE u.company_id = $1 AND u.is_active = true
		GROUP BY u.id, u.full_name, u.username, u.email, u.role, u.employment_type, u.shift_type, u.is_active
		ORDER BY u.full_name
	`, companyID, startOfMonth, endOfMonth)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []EmployeeWithStats
	for rows.Next() {
		var emp EmployeeWithStats
		err := rows.Scan(
			&emp.ID,
			&emp.FullName,
			&emp.Username,
			&emp.Email,
			&emp.Role,
			&emp.EmploymentType,
			&emp.ShiftType,
			&emp.IsActive,
			&emp.MonthlyHours,
		)
		if err != nil {
			return nil, err
		}
		employees = append(employees, emp)
	}

	return employees, nil
}

// UpdateEmployeeSchedule updates an employee's employment type and shift type
func UpdateEmployeeSchedule(db *sql.DB, companyID, employeeID int, employmentType, shiftType string) error {
	// Verify employee belongs to the company
	var count int
	err := db.QueryRow(`
		SELECT COUNT(*) FROM users WHERE id = $1 AND company_id = $2
	`, employeeID, companyID).Scan(&count)

	if err != nil {
		return err
	}

	if count == 0 {
		return errors.New("employee not found or does not belong to your company")
	}

	// Update employee schedule
	_, err = db.Exec(`
		UPDATE users
		SET employment_type = $1, shift_type = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3 AND company_id = $4
	`, employmentType, shiftType, employeeID, companyID)

	return err
}

// AssignShift creates a scheduled shift for an employee (manager function)
func AssignShift(db *sql.DB, companyID, userID int, clockIn, clockOut time.Time) (*Shift, error) {
	shift := &Shift{
		UserID:    userID,
		CompanyID: companyID,
		ClockIn:   clockIn,
		ClockOut:  &clockOut,
		Status:    "assigned", // Manager-assigned shifts (planned, not yet worked)
	}

	err := db.QueryRow(`
		INSERT INTO shifts (user_id, company_id, clock_in, clock_out, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, created_at, updated_at
	`, shift.UserID, shift.CompanyID, shift.ClockIn, shift.ClockOut, shift.Status).Scan(
		&shift.ID, &shift.CreatedAt, &shift.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return shift, nil
}

// UpdateShift updates an existing shift
func UpdateShift(db *sql.DB, companyID, shiftID int, clockIn, clockOut time.Time) error {
	_, err := db.Exec(`
		UPDATE shifts
		SET clock_in = $1, clock_out = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3 AND company_id = $4
	`, clockIn, clockOut, shiftID, companyID)

	return err
}

// DeleteShift deletes a shift
func DeleteShift(db *sql.DB, companyID, shiftID int) error {
	_, err := db.Exec(`
		DELETE FROM shifts
		WHERE id = $1 AND company_id = $2
	`, shiftID, companyID)

	return err
}

// GetWeekShifts retrieves all shifts for a specific week with user info
func GetWeekShifts(db *sql.DB, companyID int, weekStart time.Time) ([]ShiftWithUserInfo, error) {
	weekEnd := weekStart.AddDate(0, 0, 7)

	rows, err := db.Query(`
		SELECT s.id, s.user_id, s.company_id, s.clock_in, s.clock_out, s.status,
		       COALESCE(s.notes, '') as notes,
		       s.created_at, s.updated_at, u.username, u.full_name, u.role
		FROM shifts s
		JOIN users u ON s.user_id = u.id
		WHERE s.company_id = $1 AND s.clock_in >= $2 AND s.clock_in < $3
		ORDER BY s.clock_in
	`, companyID, weekStart, weekEnd)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shifts []ShiftWithUserInfo
	for rows.Next() {
		var shift ShiftWithUserInfo
		err := rows.Scan(
			&shift.ID, &shift.UserID, &shift.CompanyID, &shift.ClockIn, &shift.ClockOut,
			&shift.Status, &shift.Notes, &shift.CreatedAt, &shift.UpdatedAt,
			&shift.Username, &shift.FullName, &shift.Role,
		)
		if err != nil {
			return nil, err
		}
		shifts = append(shifts, shift)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return shifts, nil
}
