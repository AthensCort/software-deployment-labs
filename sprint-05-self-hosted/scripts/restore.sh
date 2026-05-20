#!/usr/bin/env bash
# restore.sh — Restaurar un backup de la base de datos
#
# Uso: bash restore.sh <archivo_backup>
# Ejemplo: bash restore.sh /var/backups/supabase/backup_production_20240201_120000.sql
#
# Variables de entorno requeridas:
#   DB_URL — URL de conexión a PostgreSQL
#
# ⚠️  ADVERTENCIA: Este script REEMPLAZA todos los datos actuales.
#     Hacer un backup del estado actual antes de restaurar.

set -euo pipefail

BACKUP_FILE="${1:-}"

# ── Validaciones ──────────────────────────────────────────────────────────────
if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: bash restore.sh <archivo_backup>"
  echo ""
  echo "Backups disponibles:"
  ls -lh /var/backups/supabase/*.sql 2>/dev/null || echo "  (ninguno en /var/backups/supabase/)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: El archivo '${BACKUP_FILE}' no existe."
  exit 1
fi

if [ -z "${DB_URL:-}" ]; then
  echo "ERROR: La variable DB_URL no está definida."
  echo "  export DB_URL='postgresql://postgres:PASSWORD@localhost:5432/postgres'"
  exit 1
fi

# ── Confirmación ──────────────────────────────────────────────────────────────
echo "⚠️  ATENCIÓN: Esto REEMPLAZARÁ todos los datos de la base de datos."
echo ""
echo "   Backup a restaurar: ${BACKUP_FILE}"
echo "   Base de datos:      ${DB_URL}"
echo ""
read -r -p "¿Estás seguro? Escribe 'SI' para continuar: " CONFIRMAR

if [ "$CONFIRMAR" != "SI" ]; then
  echo "Operación cancelada."
  exit 0
fi

# ── Backup del estado actual antes de restaurar ───────────────────────────────
PREBACKUP="/var/backups/supabase/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
echo ""
echo "[$(date)] Creando backup de seguridad antes de restaurar..."
pg_dump "$DB_URL" --no-owner --no-privileges --format=plain --file="$PREBACKUP"
echo "[$(date)] Backup de seguridad: ${PREBACKUP}"

# ── Restaurar ─────────────────────────────────────────────────────────────────
echo "[$(date)] Restaurando desde ${BACKUP_FILE}..."

# Limpiar la base de datos actual y restaurar
psql "$DB_URL" -c "
  -- Terminar conexiones activas excepto la nuestra
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND pid <> pg_backend_pid();
"

# Ejecutar el backup
psql "$DB_URL" --file="$BACKUP_FILE" --quiet

echo "[$(date)] Restauración completada."
echo ""
echo "Si algo salió mal, puedes revertir con:"
echo "  bash restore.sh ${PREBACKUP}"
