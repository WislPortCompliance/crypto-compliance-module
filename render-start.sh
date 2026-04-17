#!/usr/bin/env bash
set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CryptoComply — Render startup script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Push schema to database (idempotent — safe to run on every deploy)
echo "▶ Applying database schema..."
npx prisma db push --accept-data-loss

# Seed runs on every deploy: the seed is fully idempotent (upserts throughout)
# so it's safe to re-run. This ensures new content (e.g. 43 requirement templates,
# new documents, updated stages) lands on existing Neon DBs without manual reset.
echo "▶ Running seed (idempotent upserts)..."
node prisma/seed.js
echo "✓ Seed complete"

echo "▶ Starting Next.js..."
exec npm start
