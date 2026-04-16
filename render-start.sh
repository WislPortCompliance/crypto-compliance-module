#!/usr/bin/env bash
set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CryptoComply — Render startup script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Push schema to database (idempotent — safe to run on every deploy)
echo "▶ Applying database schema..."
npx prisma db push --accept-data-loss

# Seed only if the database is empty (check for users table having rows)
echo "▶ Checking if seed data is needed..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(n => { console.log(n); p.\$disconnect(); }).catch(() => { console.log(0); p.\$disconnect(); });
")

if [ "$USER_COUNT" = "0" ]; then
  echo "▶ Database is empty — running seed..."
  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
  echo "✓ Seed complete"
else
  echo "✓ Database already has data ($USER_COUNT users) — skipping seed"
fi

echo "▶ Starting Next.js..."
exec npm start
