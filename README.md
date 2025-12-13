# Modular ERP System for Small Businesses

A flexible, modular ERP system built with Go, designed specifically for small businesses like convenience stores, barbershops, and small offices. Pay only for the modules you need!

## Features

- **Modular Architecture**: Enable only the modules your business needs
- **Cost-Effective**: Pay for specific functionality, not an entire enterprise system
- **Role-Based Access Control**: Admin, Manager, and Employee roles
- **Multi-Company Support**: Manage multiple businesses in one system
- **RESTful API**: Easy integration with any frontend or mobile app
- **JWT Authentication**: Secure token-based authentication

## Current Modules

### ✅ Shift Attendance Module

Track employee work hours with clock-in/clock-out functionality:
- Employees can clock in and out
- Managers can view all employee shifts
- Generate attendance reports
- Track work hours automatically
- View shift history

### 🔜 Coming Soon

- **Inventory Management**: Track stock, suppliers, and orders
- **Invoice Management**: Create and manage customer invoices
- **Payroll**: Calculate wages based on attendance
- **Customer Management**: CRM functionality
- **Sales Reporting**: Analytics and insights

## Technology Stack

- **Language**: Go 1.21+
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Router**: Gorilla Mux
- **Password Hashing**: bcrypt

## Project Structure

```
modular-erp/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── core/
│   │   ├── config/              # Configuration management
│   │   ├── database/            # Database connection & migrations
│   │   ├── handlers/            # Core HTTP handlers (auth)
│   │   ├── middleware/          # Authentication & authorization
│   │   └── models/              # Core data models
│   └── modules/
│       └── attendance/          # Shift attendance module
│           ├── handlers.go      # HTTP handlers
│           ├── models.go        # Data models
│           ├── routes.go        # Route registration
│           └── service.go       # Business logic
├── pkg/
│   └── utils/                   # Shared utilities (JWT)
├── .env.example                 # Environment variables template
├── go.mod                       # Go module definition
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 12 or higher

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd modular-erp
```

2. Install dependencies:
```bash
go mod download
```

3. Set up PostgreSQL database:
```bash
# Using psql or your preferred PostgreSQL client
createdb modular_erp
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the application:
```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080` by default.

### Environment Variables

See `.env.example` for all available configuration options:

- `SERVER_PORT`: HTTP server port (default: 8080)
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `MODULE_ATTENDANCE`: Enable/disable attendance module (true/false)

## API Documentation

### Base URL

```
http://localhost:8080
```

### Authentication

All API endpoints (except `/auth/login` and `/auth/register`) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### 1. Health Check

```http
GET /health
```

Returns server health status.

**Response:**
```json
{
  "status": "healthy"
}
```

---

#### 2. Register New User/Company

```http
POST /api/auth/register
```

Register a new user. If creating an admin user, you can also create a new company.

**Request Body:**
```json
{
  "company_name": "My Barbershop",  // Required for new company (admin only)
  "company_id": 0,                   // Use this for existing company
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "role": "admin"                    // admin, manager, or employee
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "company_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### 3. Login

```http
POST /api/auth/login
```

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "company_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "admin",
    "is_active": true
  }
}
```

---

### Attendance Module Endpoints

All attendance endpoints require authentication.

#### 4. Clock In

```http
POST /api/attendance/clock-in
```

Start a new shift. Employees can only have one active shift at a time.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (201 Created):**
```json
{
  "message": "Clocked in successfully",
  "shift": {
    "id": 1,
    "user_id": 2,
    "company_id": 1,
    "clock_in": "2024-01-15T09:00:00Z",
    "clock_out": null,
    "status": "in_progress",
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  }
}
```

---

#### 5. Clock Out

```http
POST /api/attendance/clock-out
```

End the current active shift.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notes": "Completed all tasks for today"
}
```

**Response (200 OK):**
```json
{
  "message": "Clocked out successfully",
  "shift": {
    "id": 1,
    "user_id": 2,
    "company_id": 1,
    "clock_in": "2024-01-15T09:00:00Z",
    "clock_out": "2024-01-15T17:00:00Z",
    "status": "completed",
    "notes": "Completed all tasks for today",
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T17:00:00Z"
  }
}
```

---

#### 6. Get My Shifts

```http
GET /api/attendance/my-shifts?limit=50&offset=0
```

Retrieve shift history for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of shifts to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "shifts": [
    {
      "id": 1,
      "user_id": 2,
      "company_id": 1,
      "clock_in": "2024-01-15T09:00:00Z",
      "clock_out": "2024-01-15T17:00:00Z",
      "status": "completed",
      "notes": "Completed all tasks",
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T17:00:00Z"
    }
  ],
  "count": 1
}
```

---

#### 7. Get Active Shift

```http
GET /api/attendance/active-shift
```

Get the current active shift for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "shift": {
    "id": 2,
    "user_id": 2,
    "company_id": 1,
    "clock_in": "2024-01-16T09:00:00Z",
    "clock_out": null,
    "status": "in_progress",
    "created_at": "2024-01-16T09:00:00Z",
    "updated_at": "2024-01-16T09:00:00Z"
  }
}
```

If no active shift:
```json
{
  "message": "No active shift",
  "shift": null
}
```

---

#### 8. Get All Shifts (Manager/Admin Only)

```http
GET /api/attendance/shifts?start_date=2024-01-01&end_date=2024-01-31&limit=100&offset=0
```

Retrieve all shifts for the company. Only accessible by managers and admins.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format (default: 30 days ago)
- `end_date` (optional): End date in YYYY-MM-DD format (default: today)
- `limit` (optional): Number of shifts to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "shifts": [
    {
      "id": 1,
      "user_id": 2,
      "company_id": 1,
      "clock_in": "2024-01-15T09:00:00Z",
      "clock_out": "2024-01-15T17:00:00Z",
      "status": "completed",
      "notes": "Completed all tasks",
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T17:00:00Z",
      "username": "jane_employee",
      "full_name": "Jane Employee",
      "role": "employee"
    }
  ],
  "count": 1,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

---

#### 9. Get Attendance Report (Manager/Admin Only)

```http
GET /api/attendance/report?start_date=2024-01-01&end_date=2024-01-31
```

Generate attendance statistics for the company.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format (default: 30 days ago)
- `end_date` (optional): End date in YYYY-MM-DD format (default: today)

**Response (200 OK):**
```json
{
  "report": {
    "total_shifts": 45,
    "completed_shifts": 43,
    "active_shifts": 2,
    "total_hours": 344.5,
    "average_hours": 8.01
  },
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

---

## User Roles

### Admin
- Full access to all features
- Can manage company settings
- Can view all reports
- Can manage users

### Manager
- Can view all employee shifts
- Can generate reports
- Cannot modify company settings

### Employee
- Can clock in/out
- Can view own shift history
- Cannot view other employees' data

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Development

### Running Tests

```bash
go test ./...
```

### Building for Production

```bash
go build -o bin/erp-server cmd/server/main.go
```

### Running the Binary

```bash
./bin/erp-server
```

## Adding New Modules

To add a new module to the ERP system:

1. Create a new directory under `internal/modules/`
2. Implement the following files:
   - `models.go`: Data structures and database operations
   - `service.go`: Business logic
   - `handlers.go`: HTTP request handlers
   - `routes.go`: Route registration function
3. Add module configuration to `internal/core/config/config.go`
4. Register routes in `cmd/server/main.go`

Example module structure:
```go
// internal/modules/inventory/routes.go
func RegisterRoutes(router *mux.Router, db *sql.DB, jwtSecret string) {
    // Register your routes here
}
```

## Database Schema

### Companies Table
```sql
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Shifts Table
```sql
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the GitHub repository.

## Roadmap

- [ ] Add inventory management module
- [ ] Add invoicing module
- [ ] Add payroll module based on attendance
- [ ] Add customer relationship management (CRM)
- [ ] Add sales analytics and reporting
- [ ] Add mobile application
- [ ] Add email notifications
- [ ] Add backup and restore functionality
- [ ] Add multi-language support
- [ ] Add customizable dashboards

---

Built with ❤️ for small businesses
