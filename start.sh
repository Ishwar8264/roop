#!/bin/bash
# Nikharta Roop — Development Startup Script
# Starts PostgreSQL + Next.js dev server together

set -e

# ====== PostgreSQL Setup ======
export PGHOME=/home/z/.pgsql/pgsql
export PGBIN=$PGHOME/usr/lib/postgresql/17/bin
export PGDATA=/home/z/.pgsql/data
export PGHOST=/tmp
export PGLOG=/home/z/.pgsql/pg.log

# Start PostgreSQL if not running
if ! $PGBIN/pg_ctl -D $PGDATA status > /dev/null 2>&1; then
  echo "🚀 Starting PostgreSQL..."
  $PGBIN/pg_ctl -D $PGDATA -l $PGLOG start
  echo "✅ PostgreSQL started"
else
  echo "✅ PostgreSQL already running"
fi

# Wait for PostgreSQL to accept connections
for i in $(seq 1 10); do
  if $PGBIN/psql -h /tmp -U z -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# ====== Next.js Dev Server ======
echo "🚀 Starting Next.js dev server..."
cd /home/z/my-project
DATABASE_URL="postgresql://ishwar:IshwarRiverHead@localhost:5432/nikharta_roop?schema=public" \
npx next dev -p 3000
