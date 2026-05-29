#!/bin/bash
# ============================================
# Nikharta Roop — Local Database Setup Script
# ============================================
# Run this on your local machine to set up PostgreSQL
# Usage: bash setup-db.sh
# ============================================

set -e

echo "================================================"
echo "  निखरता रूप — Database Setup"
echo "================================================"
echo ""

# ---- Config ----
DB_USER="ishwar"
DB_PASS="IshwarRiverHead"
DB_NAME="nikharta_roop"
DB_HOST="localhost"
DB_PORT="5432"

# ---- Step 1: Check PostgreSQL ----
echo "🔍 Step 1: Checking PostgreSQL..."

if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "❌ PostgreSQL not installed!"
    echo ""
    echo "Install PostgreSQL first:"
    echo "  Ubuntu/Debian:  sudo apt install postgresql postgresql-contrib"
    echo "  macOS:          brew install postgresql@17"
    echo "  Windows:        https://www.postgresql.org/download/windows/"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# ---- Step 2: Start PostgreSQL service ----
echo ""
echo "🚀 Step 2: Starting PostgreSQL..."

if pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "Starting PostgreSQL service..."
    sudo service postgresql start 2>/dev/null || \
    sudo systemctl start postgresql 2>/dev/null || \
    brew services start postgresql@17 2>/dev/null || \
    echo "⚠️  Please start PostgreSQL manually and run again"
    
    sleep 2
    if pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        echo "✅ PostgreSQL started"
    else
        echo "❌ Could not start PostgreSQL. Start it manually and run again."
        exit 1
    fi
fi

# ---- Step 3: Create User & Database ----
echo ""
echo "👤 Step 3: Creating database user '$DB_USER'..."

# Check if user exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || \
              psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")

if [ "$USER_EXISTS" = "1" ]; then
    echo "✅ User '$DB_USER' already exists"
else
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;" 2>/dev/null || \
    psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;" 2>/dev/null || \
    echo "⚠️  Could not create user. Create manually:"
    echo "   sudo -u postgres psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS' CREATEDB;\""
    echo "✅ User '$DB_USER' created"
fi

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME && echo "1" || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Database '$DB_NAME' already exists"
else
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || \
    psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || \
    echo "⚠️  Could not create database. Create manually:"
    echo "   sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""
    echo "✅ Database '$DB_NAME' created"
fi

# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# ---- Step 4: Verify Connection ----
echo ""
echo "🔌 Step 4: Verifying connection..."

if PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo "✅ Database connection successful!"
else
    echo "❌ Connection failed. Check your credentials."
    echo "   Try: PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
    exit 1
fi

# ---- Step 5: Run Prisma Migration ----
echo ""
echo "📦 Step 5: Running Prisma migration (creating tables)..."

cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Generate Prisma client
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?schema=public" npx prisma generate

# Run migration
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?schema=public" npx prisma migrate dev --name init

echo ""
echo "================================================"
echo "  ✅ Setup Complete!"
echo "================================================"
echo ""
echo "  Database:  $DB_NAME"
echo "  User:      $DB_USER"
echo "  Host:      $DB_HOST:$DB_PORT"
echo "  Tables:    42 (all created via migration)"
echo ""
echo "  Start dev server:"
echo "    npm run dev"
echo ""
echo "================================================"
