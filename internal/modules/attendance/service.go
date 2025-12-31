package attendance

import (
	"database/sql"
	"time"
)

// Service handles business logic for attendance module
type Service struct {
	db *sql.DB
}

// NewService creates a new attendance service
func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// ClockIn creates a new shift for an employee
func (s *Service) ClockIn(userID, companyID int) (*Shift, error) {
	return CreateShift(s.db, userID, companyID)
}

// ClockOut ends the current shift for an employee
func (s *Service) ClockOut(userID int, notes string) (*Shift, error) {
	return EndShift(s.db, userID, notes)
}

// GetMyShifts retrieves shifts for a specific user
func (s *Service) GetMyShifts(userID int, limit, offset int) ([]Shift, error) {
	if limit == 0 {
		limit = 50
	}
	return GetUserShifts(s.db, userID, limit, offset)
}

// GetMyActiveShift retrieves the active shift for a user
func (s *Service) GetMyActiveShift(userID int) (*Shift, error) {
	return GetActiveShift(s.db, userID)
}

// GetAllShifts retrieves all shifts for a company (manager/admin only)
func (s *Service) GetAllShifts(companyID int, startDate, endDate time.Time, limit, offset int) ([]ShiftWithUserInfo, error) {
	if limit == 0 {
		limit = 100
	}
	return GetCompanyShifts(s.db, companyID, startDate, endDate, limit, offset)
}

// GetReport generates attendance statistics (manager/admin only)
func (s *Service) GetReport(companyID int, startDate, endDate time.Time) (*ShiftReport, error) {
	return GetShiftReport(s.db, companyID, startDate, endDate)
}

// GetEmployeesWithStats retrieves all employees with their monthly hours worked (manager/admin only)
func (s *Service) GetEmployeesWithStats(companyID int) ([]EmployeeWithStats, error) {
	return GetEmployeesWithMonthlyHours(s.db, companyID)
}

// UpdateEmployeeSchedule updates an employee's schedule (manager/admin only)
func (s *Service) UpdateEmployeeSchedule(companyID, employeeID int, employmentType, shiftType string) error {
	return UpdateEmployeeSchedule(s.db, companyID, employeeID, employmentType, shiftType)
}
