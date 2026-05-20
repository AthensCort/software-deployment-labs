#!/usr/bin/env bash
# backup.sh — Crear backup de la base de datos de Supabase self-hosted
#
# Uso: bash backup.sh [entorno]
# Ejemplo: bash backup.sh production
#
# Variables de entorno requeridas (o pasar como argumentos):
#   DB_URL — URL de conexión a PostgreSQL
#             Ejemplo: postgresql://postgres:PASSWORD@localhost:5432/postgres
#
# El backup se guarda en /var/backups/supabase/

set -euo pipefail

ENTORNO="${1:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/supabase"
BACKUP_FILE="${BACKUP_DIR}/backup_${ENTORNO}_${TIMESTAMP}.sql"
KEEP_DAYS=30  # días que se conservan los backups antes de borrarlos

# ── Validaciones ──────────────────────────────────────────────────────────────
if [ -z "${DB_URL:-}" ]; then
  echo "ERROR: La variable DB_URL no está definida."
  echo "Exportar antes de correr el script:"
  echo "  export DB_URL='postgresql://postgres:PASSWORD@localhost:5432/postgres'"
  exit 1
fi

# ── Crear directorio de backups ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Crear el backup ───────────────────────────────────────────────────────────
echo "[$(date)] Iniciando backup de ${ENTORNO}..."

pg_dump "$DB_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$BACKUP_FILE"

TAMANIO=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completado: ${BACKUP_FILE} (${TAMANIO})"

# ── Verificar integridad básica ───────────────────────────────────────────────
LINEAS=$(wc -l < "$BACKUP_FILE")
if [ "$LINEAS" -lt 10 ]; then
  echo "ERROR: El backup parece estar vacío o incompleto (${LINEAS} líneas)."
  rm "$BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Verificación OK — ${LINEAS} líneas en el backup."

# ── Limpiar backups antiguos ──────────────────────────────────────────────────
BORRADOS=$(find "$BACKUP_DIR" -name "backup_${ENTORNO}_*.sql" -mtime +${KEEP_DAYS} -delete -print | wc -l)
if [ "$BORRADOS" -gt 0 ]; then
  echo "[$(date)] Limpieza: ${BORRADOS} backup(s) de más de ${KEEP_DAYS} días eliminados."
fi

# ── Listar backups disponibles ────────────────────────────────────────────────
echo ""
echo "Backups disponibles para ${ENTORNO}:"
ls -lh "${BACKUP_DIR}/backup_${ENTORNO}_"*.sql 2>/dev/null || echo "(ninguno)"

echo ""
echo "Para restaurar este backup:"
echo "  bash restore.sh ${BACKUP_FILE}"
