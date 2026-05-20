# Setup Sprint 5 — Self-hosted: migrar el proyecto a infraestructura propia

**Prerequisito:** Sprint 4 completado — CI/CD funcionando con 3 entornos en Vercel + Supabase cloud.

Este sprint tiene dos partes independientes:
- **Parte A** — Levantar la infraestructura self-hosted (VPS + Supabase + Nginx)
- **Parte B** — Migrar el proyecto actual desde cloud a self-hosted

Puedes hacer la Parte A con el proyecto de ejemplo del lab-00-base para practicar antes de migrar tu proyecto real.

---

## Parte A — Levantar la infraestructura

### A.1 Provisionar el VPS

Opciones recomendadas (elige una):

| Proveedor | Tier | RAM | Precio | Acceso |
|-----------|------|-----|--------|--------|
| Hetzner | CX22 | 4GB | ~€4/mes | SSH |
| DigitalOcean | Basic | 2GB | $6/mes | SSH |
| VM local (VirtualBox) | — | 2GB | Gratis | SSH local |

**Sistema operativo requerido:** Ubuntu 22.04 LTS

Una vez que tienes acceso SSH como root:

```bash
ssh root@TU_IP
```

### A.2 Ejecutar el script de setup del servidor

El script del lab-00-base instala Docker, Nginx, crea el usuario `deploy` y clona Supabase:

```bash
# Desde tu máquina local, copiar el script
scp ../../lab-00-base/infra/scripts/setup-server.sh root@TU_IP:/tmp/

# Conectarse y ejecutar
ssh root@TU_IP
bash /tmp/setup-server.sh dev   # o "staging" o "prod" según el entorno
```

El script hace todo esto automáticamente:
- Actualiza el sistema
- Instala Docker y Docker Compose
- Instala Nginx y Certbot
- Crea el usuario `deploy` con permisos correctos
- Clona el repositorio oficial de Supabase en `/opt/supabase`

### A.3 Configurar Supabase self-hosted

```bash
cd /opt/supabase/docker
cp .env.example .env
nano .env
```

Los valores mínimos que debes cambiar:

```bash
# Contraseña de PostgreSQL — invéntala tú
POSTGRES_PASSWORD=una_contraseña_larga_y_segura

# JWT Secret — debe tener al menos 32 caracteres
# Generar con: openssl rand -base64 32
JWT_SECRET=tu_jwt_secret_aqui

# URL pública del entorno (sin barra al final)
SITE_URL=https://dev.tudominio.com
# Si no tienes dominio todavía:
# SITE_URL=http://TU_IP

# Estas dos keys se generan a partir del JWT_SECRET
# Ver instrucciones en el paso A.4
ANON_KEY=
SERVICE_ROLE_KEY=
```

### A.4 Generar las API Keys

Las `ANON_KEY` y `SERVICE_ROLE_KEY` son tokens JWT firmados con tu `JWT_SECRET`. Generarlas una sola vez:

```bash
# Instalar la herramienta en tu máquina local
npm install -g @supabase/supabase-js

# O usar el generador online oficial:
# https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
# Ingresar el JWT_SECRET que definiste y copiar los tokens generados
```

Pegar los valores en el `.env`.

### A.5 Levantar Supabase

```bash
cd /opt/supabase/docker
docker compose up -d

# Verificar que todos los contenedores están corriendo
docker compose ps
# Todos deben mostrar "Up" o "healthy"

# Ver logs en tiempo real (Ctrl+C para salir)
docker compose logs -f
```

Esperar 2-3 minutos. Luego verificar que el Studio abre:
```
http://TU_IP:3000
```

### A.6 Configurar Nginx

Copiar la configuración del entorno correspondiente:

```bash
# Para entorno DEV
cp ../../lab-00-base/infra/nginx/dev.conf /etc/nginx/sites-available/dev

# Editar reemplazando "tudominio.com" con tu IP o dominio real
nano /etc/nginx/sites-available/dev

# Activar la configuración
ln -s /etc/nginx/sites-available/dev /etc/nginx/sites-enabled/dev

# Verificar que no hay errores de sintaxis
nginx -t

# Recargar Nginx
systemctl reload nginx
```

**Con dominio → SSL gratuito:**
```bash
certbot --nginx -d dev.tudominio.com
```

**Sin dominio → usar sslip.io (SSL automático con IP):**
```bash
# Tu "dominio" queda: https://1-2-3-4.sslip.io  (reemplazar puntos con guiones)
# Editar la configuración de Nginx con ese dominio y correr certbot
certbot --nginx -d $(echo TU_IP | tr '.' '-').sslip.io
```

**Sin dominio ni SSL (solo para desarrollo local):**
Cambiar `listen 443 ssl` por `listen 80` en el archivo de Nginx y eliminar las líneas de SSL.

---

## Parte B — Migrar el proyecto actual

Con la infraestructura lista, ahora migras **tu proyecto real** del Sprint 4.

### B.1 Exportar los datos de Supabase cloud

```bash
# Desde tu máquina local
# Obtener la DB URL del proyecto cloud: Supabase dashboard → Settings → Database → URI

# Exportar solo el esquema (estructura de tablas)
pg_dump "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f schema_export.sql

# Exportar también los datos (si quieres migrar datos existentes)
pg_dump "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  --data-only \
  --no-owner \
  -f data_export.sql
```

### B.2 Aplicar el esquema al servidor self-hosted

```bash
# El esquema está en tus migraciones, no hace falta el export si usas la CLI
supabase link --project-ref TU_VPS  # no aplica para self-hosted, usar db-url directo

# Aplicar migraciones al Supabase self-hosted
supabase db push --db-url "postgresql://postgres:TU_PASSWORD@TU_IP:5432/postgres"

# Si quieres importar datos del export:
psql "postgresql://postgres:TU_PASSWORD@TU_IP:5432/postgres" -f data_export.sql
```

### B.3 Actualizar las variables de entorno de tu app

Las variables que antes apuntaban a Supabase cloud ahora apuntan a tu servidor:

```bash
# Antes (cloud)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Después (self-hosted)
NEXT_PUBLIC_SUPABASE_URL=https://dev.tudominio.com   # o http://TU_IP
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...           # tu propia ANON_KEY generada
```

Actualizar en:
1. `.env.local` para desarrollo local
2. GitHub Secrets para el CI/CD del Sprint 4

### B.4 Actualizar los GitHub Secrets

En GitHub → Settings → Secrets → Actions, actualizar:

```
DEV_DB_URL      → postgresql://postgres:TU_PASSWORD@TU_IP_DEV:5432/postgres
DEV_SUPABASE_URL      → https://dev.tudominio.com (o http://TU_IP)
DEV_SUPABASE_ANON_KEY → tu nueva anon key

# Igual para staging y prod
```

### B.5 Actualizar el CI/CD para deployar al VPS

Los workflows del Sprint 4 usaban `vercel deploy`. Ahora usarán `scp` para copiar los archivos al VPS.

Copiar el nuevo workflow al proyecto:
```bash
cp workflows/ci-develop-vps.yml .github/workflows/ci-develop.yml
# Reemplaza el workflow anterior
```

Ver la carpeta [workflows/](workflows/) de este sprint para los templates actualizados.

---

## Parte C — Operaciones del día a día

### C.1 Monitoreo básico

```bash
# Estado de todos los contenedores
docker compose -f /opt/supabase/docker/docker-compose.yml ps

# Logs en tiempo real de todos los servicios
docker compose -f /opt/supabase/docker/docker-compose.yml logs -f

# Logs de un servicio específico
docker compose logs -f db        # PostgreSQL
docker compose logs -f rest      # PostgREST (API)
docker compose logs -f auth      # Autenticación
docker compose logs -f kong      # API Gateway

# Uso de recursos del servidor
docker stats --no-stream

# Espacio en disco
df -h
docker system df   # espacio usado por Docker
```

### C.2 Backup manual

```bash
# Ejecutar el script de backup (ver scripts/ de este sprint)
bash scripts/backup.sh production

# El backup queda en /var/backups/supabase/
# Nombre: backup_YYYYMMDD_HHMMSS.sql
```

### C.3 Actualizar Supabase a una nueva versión

```bash
cd /opt/supabase/docker

# Descargar la nueva versión
git pull origin master

# Actualizar los contenedores (sin perder datos — los volúmenes persisten)
docker compose pull
docker compose up -d

# Verificar que todo sigue funcionando
docker compose ps
curl http://localhost:8000/rest/v1/   # debe responder
```

---

## Parte D — Procedimientos de rollback

### D.1 Rollback de código (el más común)

Cuando un deploy rompe algo y necesitas volver a la versión anterior:

```bash
# En el servidor
cd /var/www/ENTORNO   # donde está el frontend

# Ver el historial de deploys (cada carpeta es un deploy)
ls -la deploys/
# deploys/
#   20240201-143022/   ← versión actual (la que rompió algo)
#   20240201-120000/   ← versión anterior (la que funcionaba)
#   current -> 20240201-143022  ← symlink

# Rollback: apuntar el symlink a la versión anterior
ln -sfn /var/www/ENTORNO/deploys/20240201-120000 /var/www/ENTORNO/current
nginx -s reload

# Verificar que la versión anterior está sirviendo
curl https://dev.tudominio.com
```

El script de deploy del workflow crea esta estructura automáticamente. Ver [workflows/ci-develop-vps.yml](workflows/ci-develop-vps.yml).

### D.2 Rollback de base de datos

Cuando una migración rompió datos y necesitas restaurar:

```bash
# 1. Detener la app para evitar nuevas escrituras
# (o poner una página de mantenimiento)

# 2. Restaurar el último backup
bash scripts/restore.sh /var/backups/supabase/backup_20240201_120000.sql

# 3. Eliminar el registro de la migración fallida
psql "postgresql://postgres:PASSWORD@localhost:5432/postgres" -c \
  "DELETE FROM supabase_migrations WHERE name = '20240201_migracion_que_fallo';"

# 4. Hacer rollback del código (D.1) al commit anterior a esa migración

# 5. Verificar que todo funciona
# 6. Reactivar la app
```

### D.3 Rollback completo (código + datos)

Para el caso más grave: migración destructiva que llegó a producción:

```bash
# El script de rollback completo automatiza D.1 + D.2
bash scripts/rollback.sh \
  --backup /var/backups/supabase/backup_20240201_120000.sql \
  --deploy /var/www/production/deploys/20240201-120000 \
  --migration 20240201_migracion_que_fallo
```

Ver [scripts/rollback.sh](scripts/rollback.sh) para el código completo.

---

## Checklist de entrega

```
DEPLOY_STATUS.md — actualizar con:

## Infraestructura self-hosted
- [ ] VPS accesible por SSH
- [ ] docker compose ps muestra todos los contenedores "Up"
      (pegar salida del comando aquí)
- [ ] Supabase Studio abre en http://TU_IP:3000
- [ ] Nginx configurado y sirviendo el frontend
- [ ] URL pública funcional: https://____________

## Migración
- [ ] Migraciones aplicadas al Supabase self-hosted
- [ ] App conecta a la BD self-hosted (verificar con datos reales)
- [ ] Variables de entorno actualizadas en GitHub Secrets
- [ ] CI/CD deployando al VPS (link al run exitoso):
      https://github.com/.../actions/runs/...

## Operaciones demostradas
- [ ] Backup ejecutado manualmente: /var/backups/supabase/backup_*.sql existe
- [ ] Rollback de código ejecutado y documentado
- [ ] Rollback de BD ejecutado en entorno DEV (no en prod)

## Comprensión (para la defensa oral)
- [ ] Puedo explicar qué hace cada contenedor de Supabase
- [ ] Puedo explicar qué hace Nginx en mi stack
- [ ] Puedo ejecutar un rollback completo en menos de 10 minutos
```
