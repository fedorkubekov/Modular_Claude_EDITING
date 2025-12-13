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
	attendanceRouter.HandleFunc("/clock-in", handler.ClockIn).Methods("POST")
	attendanceRouter.HandleFunc("/clock-out", handler.ClockOut).Methods("POST")
	attendanceRouter.HandleFunc("/my-shifts", handler.GetMyShifts).Methods("GET")
	attendanceRouter.HandleFunc("/active-shift", handler.GetActiveShift).Methods("GET")

	// Manager/Admin endpoints - require manager or admin role
	managerRouter := attendanceRouter.PathPrefix("").Subrouter()
	managerRouter.Use(middleware.RequireRole("manager", "admin"))
	managerRouter.HandleFunc("/shifts", handler.GetAllShifts).Methods("GET")
	managerRouter.HandleFunc("/report", handler.GetReport).Methods("GET")
}
