package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/mux"

	"modular-erp/internal/core/config"
	"modular-erp/internal/core/database"
	"modular-erp/internal/core/handlers"
	"modular-erp/internal/core/middleware"
	"modular-erp/internal/modules/attendance"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	if err := database.Connect(cfg.GetDatabaseURL()); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.RunMigrations(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Create router
	router := mux.NewRouter()

	// Apply global middleware
	router.Use(middleware.CORS)

	// Health check endpoint
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	}).Methods("GET")

	// Auth endpoints
	authHandler := handlers.NewAuthHandler(database.DB, cfg.JWT.Secret, cfg.JWT.Expiration)
	router.HandleFunc("/api/auth/login", authHandler.Login).Methods("POST")
	router.HandleFunc("/api/auth/register", authHandler.Register).Methods("POST")

	// Register module routes based on configuration
	if cfg.Modules.Attendance {
		attendance.RegisterRoutes(router, database.DB, cfg.JWT.Secret)
		log.Println("✓ Attendance module enabled")
	}

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("🚀 Modular ERP Server starting on %s", addr)
	log.Println("📦 Active modules:")
	if cfg.Modules.Attendance {
		log.Println("   - Attendance Management")
	}

	server := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt, syscall.SIGTERM)
		<-sigint

		log.Println("\n🛑 Shutting down server...")
		if err := server.Close(); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	// Start listening
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v", err)
	}

	log.Println("✓ Server stopped gracefully")
}
