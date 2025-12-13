.PHONY: help build run test clean docker-up docker-down install

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install Go dependencies
	go mod download
	go mod tidy

build: ## Build the application
	go build -o bin/erp-server cmd/server/main.go

run: ## Run the application
	go run cmd/server/main.go

test: ## Run tests
	go test -v ./...

clean: ## Clean build artifacts
	rm -rf bin/
	go clean

docker-up: ## Start PostgreSQL with Docker
	docker run -d \
		--name modular-erp-db \
		-e POSTGRES_USER=postgres \
		-e POSTGRES_PASSWORD=postgres \
		-e POSTGRES_DB=modular_erp \
		-p 5432:5432 \
		postgres:15-alpine

docker-down: ## Stop PostgreSQL container
	docker stop modular-erp-db || true
	docker rm modular-erp-db || true

dev: ## Run in development mode with live reload (requires air)
	air

setup: install docker-up ## Complete setup: install deps and start database
	@echo "Waiting for database to be ready..."
	@sleep 3
	@echo "Setup complete! Run 'make run' to start the server"
