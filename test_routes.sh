#!/bin/bash
# Route Testing Script for Volunteer System
# This script tests all API endpoints locally

BASE_URL="${1:-http://localhost:5000}"
API_URL="$BASE_URL/api"

echo "🧪 Testing Volunteer System API"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}[Test 1]${NC} Testing Health Check endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
BODY=$(echo "$HEALTH_RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Health Check: $HTTP_CODE"
    echo "  Response: $BODY"
else
    echo -e "${RED}✗ FAIL${NC} - Health Check: $HTTP_CODE"
    echo "  Response: $BODY"
fi
echo ""

# Test 2: Register endpoint (should return 400 without data)
echo -e "${YELLOW}[Test 2]${NC} Testing Register endpoint..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -1)
BODY=$(echo "$REGISTER_RESPONSE" | head -1)

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "503" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Register endpoint responds: $HTTP_CODE"
    echo "  Response: $BODY"
else
    echo -e "${RED}✗ FAIL${NC} - Register endpoint: $HTTP_CODE"
    echo "  Response: $BODY"
fi
echo ""

# Test 3: Login endpoint (should return 400 without data)
echo -e "${YELLOW}[Test 3]${NC} Testing Login endpoint..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
BODY=$(echo "$LOGIN_RESPONSE" | head -1)

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "503" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Login endpoint responds: $HTTP_CODE"
    echo "  Response: $BODY"
else
    echo -e "${RED}✗ FAIL${NC} - Login endpoint: $HTTP_CODE"
    echo "  Response: $BODY"
fi
echo ""

# Test 4: Get Programs (should work even without auth)
echo -e "${YELLOW}[Test 4]${NC} Testing Get Programs endpoint..."
PROGRAMS_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/programs")
HTTP_CODE=$(echo "$PROGRAMS_RESPONSE" | tail -1)
BODY=$(echo "$PROGRAMS_RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Programs endpoint responds: $HTTP_CODE"
    echo "  Response: $BODY"
else
    echo -e "${RED}✗ FAIL${NC} - Programs endpoint: $HTTP_CODE"
    echo "  Response: $BODY"
fi
echo ""

# Summary
echo "================================"
echo -e "${YELLOW}Testing Summary:${NC}"
echo "If all tests show either 200, 400, 401, or 503, the API is working."
echo ""
echo "Status Codes:"
echo "  200 = OK (route exists and works)"
echo "  400 = Bad Request (route exists, missing data)"
echo "  401 = Unauthorized (route exists, missing auth)"
echo "  503 = Service Unavailable (database connection issue)"
echo "  404 = Not Found (route doesn't exist)"
echo ""
echo -e "${YELLOW}🔍 Debugging Tips:${NC}"
echo "1. If getting 503 errors: Check MONGO_URI and database connection"
echo "2. If getting 404 errors: Check route definitions in backend/routes/"
echo "3. If getting connection refused: Make sure backend is running on port 5000"
echo "4. Check backend logs: npm run dev (in backend folder)"
