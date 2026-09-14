#!/bin/bash
# Diagnostic Script for Volunteer System Setup
# Checks all configuration and connection status

echo "🔍 Volunteer System - Diagnostic Check"
echo "======================================"
echo "Checking your system configuration..."
echo ""

# Check 1: Node.js installed
echo -e "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  Node.js version: $NODE_VERSION"
else
    echo "  ❌ Node.js not found. Please install Node.js"
    exit 1
fi
echo ""

# Check 2: npm installed
echo -e "✓ Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "  npm version: $NPM_VERSION"
else
    echo "  ❌ npm not found. Please install npm"
    exit 1
fi
echo ""

# Check 3: Backend dependencies
echo -e "✓ Checking Backend Dependencies..."
if [ -f "backend/node_modules/express/package.json" ]; then
    echo "  ✓ Express installed"
else
    echo "  ❌ Express not installed. Run: cd backend && npm install"
fi

if [ -f "backend/node_modules/mongoose/package.json" ]; then
    echo "  ✓ Mongoose installed"
else
    echo "  ❌ Mongoose not installed. Run: cd backend && npm install"
fi
echo ""

# Check 4: Frontend dependencies
echo -e "✓ Checking Frontend Dependencies..."
if [ -f "frontend/node_modules/react/package.json" ]; then
    echo "  ✓ React installed"
else
    echo "  ❌ React not installed. Run: cd frontend && npm install"
fi

if [ -f "frontend/node_modules/axios/package.json" ]; then
    echo "  ✓ Axios installed"
else
    echo "  ❌ Axios not installed. Run: cd frontend && npm install"
fi
echo ""

# Check 5: Environment variables
echo -e "✓ Checking Environment Variables..."
if [ -f "backend/.env" ]; then
    echo "  ✓ backend/.env exists"
    # Check for key variables
    if grep -q "MONGO_URI" backend/.env; then
        MONGO_URI_VALUE=$(grep "MONGO_URI" backend/.env | cut -d'=' -f2)
        if [ -z "$MONGO_URI_VALUE" ]; then
            echo "    ❌ MONGO_URI is empty"
        else
            echo "    ✓ MONGO_URI is configured"
        fi
    else
        echo "    ❌ MONGO_URI not found"
    fi
    
    if grep -q "JWT_SECRET" backend/.env; then
        echo "    ✓ JWT_SECRET is configured"
    else
        echo "    ❌ JWT_SECRET not found"
    fi
else
    echo "  ❌ backend/.env not found"
fi
echo ""

# Check 6: MongoDB connectivity (if MongoDB is running locally)
echo -e "✓ Checking MongoDB Connection..."
if command -v mongo &> /dev/null || command -v mongosh &> /dev/null; then
    # Try to connect to local MongoDB
    timeout 2 mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "  ✓ Local MongoDB is accessible"
    else
        echo "  ⚠️  Local MongoDB is not responding"
        echo "    If using MongoDB Atlas, that's OK"
        echo "    Ensure MONGO_URI points to your Atlas cluster"
    fi
else
    echo "  ⚠️  MongoDB CLI not installed (OK if using Atlas)"
fi
echo ""

# Check 7: Git configuration
echo -e "✓ Checking Git Configuration..."
if [ -d ".git" ]; then
    echo "  ✓ Git repository initialized"
    # Check for .env in .gitignore
    if grep -q ".env" .gitignore 2>/dev/null; then
        echo "  ✓ .env is in .gitignore (good for security)"
    else
        echo "  ❌ WARNING: .env not in .gitignore"
        echo "    Add '.env' to .gitignore to prevent secrets leak"
    fi
else
    echo "  ⚠️  Not a git repository"
fi
echo ""

# Check 8: Project structure
echo -e "✓ Checking Project Structure..."
MISSING_FILES=0

if [ -d "backend" ]; then echo "  ✓ backend/ directory exists"; else echo "  ❌ backend/ missing"; MISSING_FILES=$((MISSING_FILES + 1)); fi
if [ -d "frontend" ]; then echo "  ✓ frontend/ directory exists"; else echo "  ❌ frontend/ missing"; MISSING_FILES=$((MISSING_FILES + 1)); fi
if [ -f "vercel.json" ]; then echo "  ✓ vercel.json exists"; else echo "  ❌ vercel.json missing"; MISSING_FILES=$((MISSING_FILES + 1)); fi
if [ -f "package.json" ]; then echo "  ✓ package.json exists"; else echo "  ❌ package.json missing"; MISSING_FILES=$((MISSING_FILES + 1)); fi

echo ""
echo "======================================"

if [ $MISSING_FILES -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. Install backend dependencies: cd backend && npm install"
    echo "2. Install frontend dependencies: cd frontend && npm install"
    echo "3. Start backend: cd backend && npm run dev"
    echo "4. In another terminal, start frontend: cd frontend && npm run dev"
    echo "5. Test at http://localhost:5173"
else
    echo "❌ Some checks failed. Please fix the issues above."
fi
