# Testing Guide - Modular ERP System

This guide provides step-by-step examples for testing the Shift Attendance module using `curl`.

## Prerequisites

- Server running on `http://localhost:8080`
- PostgreSQL database configured and running
- `curl` installed on your system
- `jq` (optional, for pretty JSON formatting)

## Quick Start Testing

### Step 1: Register a New Company and Admin User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "My Convenience Store",
    "username": "admin",
    "email": "admin@store.com",
    "password": "admin123",
    "full_name": "Store Admin",
    "role": "admin"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "company_id": 1,
    "username": "admin",
    "email": "admin@store.com",
    "full_name": "Store Admin",
    "role": "admin",
    "is_active": true
  }
}
```

**Save the token for later use:**
```bash
export ADMIN_TOKEN="<token-from-response>"
```

---

### Step 2: Register a Manager

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "username": "manager1",
    "email": "manager@store.com",
    "password": "manager123",
    "full_name": "Store Manager",
    "role": "manager"
  }'
```

**Save the manager token:**
```bash
export MANAGER_TOKEN="<token-from-response>"
```

---

### Step 3: Register Employees

**Employee 1:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "username": "employee1",
    "email": "employee1@store.com",
    "password": "emp123",
    "full_name": "John Employee",
    "role": "employee"
  }'
```

**Save the employee token:**
```bash
export EMPLOYEE1_TOKEN="<token-from-response>"
```

**Employee 2:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "username": "employee2",
    "email": "employee2@store.com",
    "password": "emp123",
    "full_name": "Jane Employee",
    "role": "employee"
  }'
```

**Save the second employee token:**
```bash
export EMPLOYEE2_TOKEN="<token-from-response>"
```

---

### Step 4: Employee Clock In

**Employee 1 clocks in:**
```bash
curl -X POST http://localhost:8080/api/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE1_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Clocked in successfully",
  "shift": {
    "id": 1,
    "user_id": 3,
    "company_id": 1,
    "clock_in": "2024-01-15T09:00:00Z",
    "status": "in_progress",
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

**Employee 2 clocks in:**
```bash
curl -X POST http://localhost:8080/api/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE2_TOKEN"
```

---

### Step 5: Check Active Shift

**Employee 1 checks their active shift:**
```bash
curl -X GET http://localhost:8080/api/attendance/active-shift \
  -H "Authorization: Bearer $EMPLOYEE1_TOKEN"
```

**Expected Response:**
```json
{
  "shift": {
    "id": 1,
    "user_id": 3,
    "company_id": 1,
    "clock_in": "2024-01-15T09:00:00Z",
    "status": "in_progress"
  }
}
```

---

### Step 6: Employee Clock Out

**Employee 1 clocks out:**
```bash
curl -X POST http://localhost:8080/api/attendance/clock-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE1_TOKEN" \
  -d '{
    "notes": "Completed morning shift, all tasks done"
  }'
```

**Expected Response:**
```json
{
  "message": "Clocked out successfully",
  "shift": {
    "id": 1,
    "user_id": 3,
    "company_id": 1,
    "clock_in": "2024-01-15T09:00:00Z",
    "clock_out": "2024-01-15T17:00:00Z",
    "status": "completed",
    "notes": "Completed morning shift, all tasks done"
  }
}
```

---

### Step 7: View My Shift History

**Employee 1 views their shift history:**
```bash
curl -X GET "http://localhost:8080/api/attendance/my-shifts?limit=10&offset=0" \
  -H "Authorization: Bearer $EMPLOYEE1_TOKEN"
```

**Expected Response:**
```json
{
  "shifts": [
    {
      "id": 1,
      "user_id": 3,
      "company_id": 1,
      "clock_in": "2024-01-15T09:00:00Z",
      "clock_out": "2024-01-15T17:00:00Z",
      "status": "completed",
      "notes": "Completed morning shift, all tasks done"
    }
  ],
  "count": 1
}
```

---

### Step 8: Manager Views All Shifts

**Manager views all employee shifts:**
```bash
curl -X GET "http://localhost:8080/api/attendance/shifts?start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected Response:**
```json
{
  "shifts": [
    {
      "id": 2,
      "user_id": 4,
      "company_id": 1,
      "clock_in": "2024-01-15T09:30:00Z",
      "status": "in_progress",
      "username": "employee2",
      "full_name": "Jane Employee",
      "role": "employee"
    },
    {
      "id": 1,
      "user_id": 3,
      "company_id": 1,
      "clock_in": "2024-01-15T09:00:00Z",
      "clock_out": "2024-01-15T17:00:00Z",
      "status": "completed",
      "notes": "Completed morning shift, all tasks done",
      "username": "employee1",
      "full_name": "John Employee",
      "role": "employee"
    }
  ],
  "count": 2,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

---

### Step 9: Generate Attendance Report

**Manager generates attendance report:**
```bash
curl -X GET "http://localhost:8080/api/attendance/report?start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected Response:**
```json
{
  "report": {
    "total_shifts": 2,
    "completed_shifts": 1,
    "active_shifts": 1,
    "total_hours": 8.0,
    "average_hours": 8.0
  },
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

---

## Error Testing

### Test 1: Clock In While Already Clocked In

```bash
# Employee tries to clock in twice
curl -X POST http://localhost:8080/api/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE2_TOKEN"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "user already has an active shift"
}
```

---

### Test 2: Clock Out Without Active Shift

```bash
# Employee tries to clock out when not clocked in
curl -X POST http://localhost:8080/api/attendance/clock-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE1_TOKEN" \
  -d '{"notes": "Test"}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "no active shift found"
}
```

---

### Test 3: Employee Tries to Access Manager Endpoint

```bash
# Employee tries to view all shifts
curl -X GET http://localhost:8080/api/attendance/shifts \
  -H "Authorization: Bearer $EMPLOYEE1_TOKEN"
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "Insufficient permissions"
}
```

---

### Test 4: Invalid Token

```bash
curl -X GET http://localhost:8080/api/attendance/my-shifts \
  -H "Authorization: Bearer invalid-token-123"
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Invalid token"
}
```

---

### Test 5: Missing Authorization Header

```bash
curl -X GET http://localhost:8080/api/attendance/my-shifts
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Authorization header required"
}
```

---

## Complete Test Script

Save this as `test_attendance.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8080"

echo "=== Testing Modular ERP - Attendance Module ==="
echo ""

# Register admin
echo "1. Registering admin user..."
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Store",
    "username": "admin_test",
    "email": "admin@test.com",
    "password": "admin123",
    "full_name": "Admin User",
    "role": "admin"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')
echo "✓ Admin registered. Token: ${ADMIN_TOKEN:0:20}..."
echo ""

# Register employee
echo "2. Registering employee..."
EMPLOYEE_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "username": "employee_test",
    "email": "employee@test.com",
    "password": "emp123",
    "full_name": "Test Employee",
    "role": "employee"
  }')

EMPLOYEE_TOKEN=$(echo $EMPLOYEE_RESPONSE | jq -r '.token')
echo "✓ Employee registered. Token: ${EMPLOYEE_TOKEN:0:20}..."
echo ""

# Clock in
echo "3. Employee clocking in..."
curl -s -X POST $BASE_URL/api/attendance/clock-in \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" | jq '.'
echo ""

# Check active shift
echo "4. Checking active shift..."
curl -s -X GET $BASE_URL/api/attendance/active-shift \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" | jq '.'
echo ""

# Wait a bit
echo "5. Waiting 5 seconds to simulate work time..."
sleep 5
echo ""

# Clock out
echo "6. Employee clocking out..."
curl -s -X POST $BASE_URL/api/attendance/clock-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -d '{"notes": "Test shift completed"}' | jq '.'
echo ""

# View shifts as admin
echo "7. Admin viewing all shifts..."
curl -s -X GET "$BASE_URL/api/attendance/shifts" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

# Generate report
echo "8. Generating attendance report..."
curl -s -X GET "$BASE_URL/api/attendance/report" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo ""

echo "=== Testing Complete ==="
```

Make it executable:
```bash
chmod +x test_attendance.sh
```

Run it:
```bash
./test_attendance.sh
```

---

## Health Check

Always verify the server is running:

```bash
curl http://localhost:8080/health
```

**Expected Response:**
```json
{
  "status": "healthy"
}
```

---

## Tips for Testing

1. **Use jq for pretty printing:**
   ```bash
   curl -s http://localhost:8080/health | jq '.'
   ```

2. **Save tokens to environment variables** to avoid copying/pasting

3. **Test error cases** to ensure proper validation

4. **Check response status codes:**
   ```bash
   curl -i http://localhost:8080/health
   ```

5. **Use verbose mode for debugging:**
   ```bash
   curl -v http://localhost:8080/api/auth/login
   ```

---

## Common Issues

### Issue: Connection refused
**Solution:** Make sure the server is running:
```bash
go run cmd/server/main.go
```

### Issue: Database connection error
**Solution:** Verify PostgreSQL is running and credentials are correct in `.env`

### Issue: 401 Unauthorized
**Solution:** Check that your token is valid and not expired (24-hour expiry by default)

### Issue: 403 Forbidden
**Solution:** Verify you're using the correct role (manager/admin) for restricted endpoints

---

Happy Testing! 🚀
