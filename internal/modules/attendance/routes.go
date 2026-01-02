package attendance

import (
	"database/sql"

	"github.com/gorilla/mux"
	"modular-erp/internal/core/middleware"
)

// RegisterRoutes registers all attendance module routes
func RegisterRoutes(router *mux.Router, db *sql.DB, jwtSecret string) {
	service := NewService(db)
	handler := NewHandler(service)

	// Create a subrouter for attendance with authentication
	attendanceRouter := router.PathPrefix("/api/attendance").Subrouter()
	attendanceRouter.Use(middleware.AuthMiddleware(jwtSecret))

	// Employee endpoints - accessible by all authenticated users
	attendanceRouter.HandleFunc("/clock-in", handler.ClockIn).Methods("POST", "OPTIONS")
	attendanceRouter.HandleFunc("/clock-out", handler.ClockOut).Methods("POST", "OPTIONS")
	attendanceRouter.HandleFunc("/my-shifts", handler.GetMyShifts).Methods("GET", "OPTIONS")
	attendanceRouter.HandleFunc("/active-shift", handler.GetActiveShift).Methods("GET", "OPTIONS")

	// Manager/Admin endpoints - require manager or admin role
	managerRouter := attendanceRouter.PathPrefix("").Subrouter()
	managerRouter.Use(middleware.RequireRole("manager", "admin"))
	managerRouter.HandleFunc("/shifts", handler.GetAllShifts).Methods("GET", "OPTIONS")
	managerRouter.HandleFunc("/report", handler.GetReport).Methods("GET", "OPTIONS")
	managerRouter.HandleFunc("/employees", handler.GetEmployees).Methods("GET", "OPTIONS")
	managerRouter.HandleFunc("/employees/schedule", handler.UpdateEmployeeSchedule).Methods("PUT", "OPTIONS")

	// Calendar/Schedule management endpoints (managers only can modify)
	managerRouter.HandleFunc("/shifts/assign", handler.AssignShift).Methods("POST", "OPTIONS")
	managerRouter.HandleFunc("/shifts/update", handler.UpdateShift).Methods("PUT", "OPTIONS")
	managerRouter.HandleFunc("/shifts/delete", handler.DeleteShift).Methods("DELETE", "OPTIONS")

	// Calendar viewing (all authenticated users can view)
	attendanceRouter.HandleFunc("/shifts/week", handler.GetWeekShifts).Methods("GET", "OPTIONS")
}
