#!/usr/bin/env bash
# rollback.sh — Rollback completo: código + base de datos
#
# Uso:
#   bash rollback.sh --backup <archivo> --deploy <directorio> [--migration <nombre>]
#
# Argumentos:
#   --backup    Ruta al archivo de backup SQL a restaurar
#   --deploy    Ruta al directorio del deploy anterior (ej: /var/www/prod/deploys/20240201-120000)
#   --migration Nombre de la migración a eliminar del registro (opcional)
#
# Ejemplo:
#   bash rollback.sh \
#     --backup /var/backups/supabase/backup_production_20240201_120000.sql \
#     --deploy /var/www/production/deploys/20240201-120000 \
#     --migration 20240201120000_add_nueva_tabla
#
# Variables de entorno requeridas:
#   DB_URL        — URL de conexión a PostgreSQL
#   WEB_ROOT      — Directorio raíz del frontend (ej: /var/www/production)

set -euo pipefail

# ── Parsear argumentos ────────────────────────────────────────────────────────
BACKUP_FILE=""
DEPLOY_DIR=""
MIGRATION_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --backup)     BACKUP_FILE="$2";    shift 2 ;;
    --deploy)     DEPLOY_DIR="$2";     shift 2 ;;
    --migration)  MIGRATION_NAME="$2"; shift 2 ;;
    *) echo "Argumento desconocido: $1"; exit 1 ;;
  esac
done

# ── Validaciones ──────────────────────────────────────────────────────────────
ERRORES=0

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: --backup es requerido"; ERRORES=$((ERRORES+1))
elif [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: El archivo de backup no existe: ${BACKUP_FILE}"; ERRORES=$((ERRORES+1))
fi

if [ -z "$DEPLOY_DIR" ]; then
  echo "ERROR: --deploy es requerido"; ERRORES=$((ERRORES+1))
elif [ ! -d "$DEPLOY_DIR" ]; then
  echo "ERROR: El directorio de deploy no existe: ${DEPLOY_DIR}"; ERRORES=$((ERRORES+1))
fi

if [ -z "${DB_URL:-}" ]; then
  echo "ERROR: La variable DB_URL no está definida"; ERRORES=$((ERRORES+1))
fi

if [ -z "${WEB_ROOT:-}" ]; then
  WEB_ROOT="/var/www/production"
  echo "INFO: WEB_ROOT no definido, usando: ${WEB_ROOT}"
fi

if [ "$ERRORES" -gt 0 ]; then
  exit 1
fi

# ── Resumen del rollback ──────────────────────────────────────────────────────
echo "════════════════════════════════════════"
echo "         ROLLBACK DE PRODUCCIÓN"
echo "════════════════════════════════════════"
echo ""
echo "  Código → ${DEPLOY_DIR}"
echo "  BD     → ${BACKUP_FILE}"
[ -n "$MIGRATION_NAME" ] && echo "  Eliminar migración: ${MIGRATION_NAME}"
echo ""
echo "⚠️  Esta operación no se puede deshacer fácilmente."
echo "   Se creará un backup del estado actual antes de proceder."
echo ""
read -r -p "¿Confirmas el rollback? Escribe 'ROLLBACK' para continuar: " CONFIRMAR

if [ "$CONFIRMAR" != "ROLLBACK" ]; then
  echo "Rollback cancelado."
  exit 0
fi

INICIO=$(date +%s)
echo ""
echo "[$(date)] Iniciando rollback..."

# ── PASO 1: Backup del estado actual ─────────────────────────────────────────
echo ""
echo "── Paso 1/4: Backup del estado actual..."
PRE_BACKUP="/var/backups/supabase/pre_rollback_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p /var/backups/supabase
pg_dump "$DB_URL" --no-owner --no-privileges --format=plain --file="$PRE_BACKUP"
echo "   ✅ Backup creado: ${PRE_BACKUP}"

# ── PASO 2: Rollback de la base de datos ─────────────────────────────────────
echo ""
echo "── Paso 2/4: Restaurando base de datos..."

psql "$DB_URL" -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = current_database()
    AND pid <> pg_backend_pid();
" --quiet

psql "$DB_URL" --file="$BACKUP_FILE" --quiet
echo "   ✅ Base de datos restaurada"

# ── PASO 3: Eliminar registro de migración (si se especificó) ────────────────
if [ -n "$MIGRATION_NAME" ]; then
  echo ""
  echo "── Paso 3/4: Eliminando registro de migración '${MIGRATION_NAME}'..."
  psql "$DB_URL" -c \
    "DELETE FROM supabase_migrations WHERE name = '${MIGRATION_NAME}';" --quiet
  echo "   ✅ Registro eliminado"
else
  echo ""
  echo "── Paso 3/4: Sin migración que eliminar (--migration no especificado)"
fi

# ── PASO 4: Rollback del código (symlink) ────────────────────────────────────
echo ""
echo "── Paso 4/4: Rollback del frontend..."
CURRENT_LINK="${WEB_ROOT}/current"

if [ -L "$CURRENT_LINK" ]; then
  CURRENT_TARGET=$(readlink -f "$CURRENT_LINK")
  echo "   Deploy actual:   ${CURRENT_TARGET}"
  echo "   Deploy anterior: ${DEPLOY_DIR}"
  ln -sfn "$DEPLOY_DIR" "$CURRENT_LINK"
  nginx -s reload
  echo "   ✅ Frontend revertido y Nginx recargado"
else
  echo "   ⚠️  No se encontró symlink en ${CURRENT_LINK}"
  echo "   Rollback del código no aplicado — hacerlo manualmente"
fi

# ── Resumen final ─────────────────────────────────────────────────────────────
FIN=$(date +%s)
DURACION=$((FIN - INICIO))

echo ""
echo "════════════════════════════════════════"
echo "  Rollback completado en ${DURACION} segundos"
echo "════════════════════════════════════════"
echo ""
echo "  Estado anterior guardado en: ${PRE_BACKUP}"
echo "  (úsalo para deshacer el rollback si fue un error)"
echo ""
echo "Próximos pasos:"
echo "  1. Verificar que la app funciona: curl https://tudominio.com"
echo "  2. Revisar los logs: docker compose logs -f"
echo "  3. Comunicar al equipo que se hizo un rollback"
