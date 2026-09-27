#!/bin/sh
# Verifies the local iMeditate database: tables, seeds, cascade delete.
# Run: sh server/scripts/verify.sh   (stack must be up: docker compose up)
set -e
PSQL="docker exec imeditate-postgres psql -U imeditate -d imeditate -v ON_ERROR_STOP=1"

echo "== tables =="
$PSQL -c "SELECT count(*) AS tables FROM information_schema.tables WHERE table_schema='public';"
echo "== ranks seed =="
$PSQL -c "SELECT name, xp_required FROM ranks ORDER BY level;"
echo "== themes seed =="
$PSQL -c "SELECT id, title, is_free FROM themes;"
echo "== cascade test (rolled back) =="
$PSQL <<'SQL'
BEGIN;
INSERT INTO parents (email, pin_hash) VALUES ('verify@test.local', 'x') RETURNING id;
SQL
PID=$($PSQL -t -c "SELECT id FROM parents WHERE email='verify@test.local';")
echo "parent: $PID"
$PSQL -c "INSERT INTO children (parent_id, nickname, age_group) VALUES ('$PID', 'Verify', '8-11');"
$PSQL -c "DELETE FROM parents WHERE id='$PID';"
$PSQL -c "SELECT count(*) AS orphan_children FROM children WHERE parent_id='$PID';"
echo "== backup =="
docker exec imeditate-postgres pg_dump -U imeditate imeditate > /tmp/imeditate_verify.sql
echo "backup bytes: $(wc -c < /tmp/imeditate_verify.sql)"
echo ALL CHECKS DONE
