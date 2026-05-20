# Setup Sprint 4 — CI/CD con GitHub Actions

**Prerequisito:** Sprint 3 completado — branch protection activa, flujo de PRs establecido.

Este sprint tiene más configuración inicial que los anteriores, pero una vez hecho, el proceso de deploy se vuelve completamente automático.

---

## Visión general de lo que vas a construir

```
.github/
└── workflows/
    ├── ci-pr.yml          ← corre en cada PR: tests + lint (no deploya)
    ├── ci-develop.yml     ← corre al mergear a develop: tests → migraciones → deploy DEV
    ├── ci-staging.yml     ← corre al mergear a staging: tests → migraciones → deploy STAGING
    └── ci-production.yml  ← corre al mergear a main: tests → migraciones → deploy PROD (con aprobación)
```

---

## Paso 1 — Crear el entorno staging

### 1.1 Crear la rama staging

```bash
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

### 1.2 Proyecto Supabase para staging

El tier gratuito de Supabase permite 2 proyectos. Para staging tienes dos opciones:

**Opción A — Compartir proyecto con DEV (recomendada para este curso)**

Staging y DEV usan el mismo proyecto de Supabase. Es una simplificación válida para proyectos de estudiantes donde el objetivo es aprender CI/CD, no infraestructura perfecta.

Consecuencia: los datos de prueba de dev y staging se mezclan. Aceptable para este nivel.

**Opción B — Proyecto propio para staging**

Si quieres separación real: pausar el proyecto DEV en el dashboard de Supabase (Settings → General → Pause) para liberar el slot, crear el proyecto staging, y luego reactivar dev cuando necesites.

Para esta guía usaremos la **Opción A** — un proyecto Supabase para DEV/staging y otro para producción.

### 1.3 Agregar branch protection a staging

En GitHub → Settings → Branches → Add rule:
- Pattern: `staging`
- ✅ Require a pull request before merging — 1 aprobación
- ✅ Require branches to be up to date

### 1.4 Configurar la URL de staging en Vercel

Vercel → Settings → Domains → Add:
- Domain: `staging-[nombre-proyecto].vercel.app`
- Branch: `staging`

---

## Paso 2 — Configurar GitHub Environments

Los environments en GitHub permiten tener secrets separados por entorno y requerir aprobación manual.

### 2.1 Crear los tres environments

GitHub → Settings → Environments → New environment:

**Environment `development`:**
- Sin protection rules

**Environment `staging`:**
- Sin protection rules (o un timer de 1 minuto si quieren practicar)

**Environment `production`:**
- ✅ Required reviewers → agregar al dueño de `main`
- Wait timer: 0 (o 5 minutos si quieren tiempo para cancelar)

---

## Paso 3 — Recolectar todos los secrets

Antes de crear los workflows necesitas tener estos valores a mano.

### 3.1 Token de Vercel

1. Vercel → Settings (de tu cuenta, no del proyecto) → Tokens
2. **Create** → Nombre: `github-actions`, Scope: Full Account
3. Copiar el token — solo se muestra una vez

### 3.2 IDs del proyecto Vercel

```bash
# Instalar Vercel CLI si no la tienes
npm install -g vercel

# Vincular el proyecto local con Vercel
vercel link
# Seleccionar tu equipo/cuenta y el proyecto existente

# Los IDs quedan en .vercel/project.json
cat .vercel/project.json
# { "orgId": "team_xxxx", "projectId": "prj_xxxx" }
```

Necesitas: `orgId` y `projectId`.

> Agregar `.vercel/` al `.gitignore` si no está ya:
> ```bash
> echo ".vercel/" >> .gitignore
> ```

### 3.3 URLs de conexión a Supabase

Para cada proyecto de Supabase (dev/staging y prod):

1. Dashboard → Settings → Database
2. Sección **Connection string** → modo **URI**
3. Copiar la URL directa (no la de pooler para migraciones):
   ```
   postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
   Reemplazar `[PASSWORD]` con la contraseña del proyecto.

### 3.4 Agregar todos los secrets en GitHub

GitHub → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | Token del paso 3.1 |
| `VERCEL_ORG_ID` | `orgId` del paso 3.2 |
| `VERCEL_PROJECT_ID` | `projectId` del paso 3.2 |
| `DEV_DB_URL` | URL de conexión del proyecto Supabase DEV |
| `STAGING_DB_URL` | Igual que DEV_DB_URL (Opción A) o URL del proyecto staging |
| `PROD_DB_URL` | URL de conexión del proyecto Supabase PROD |

**Variables de entorno de la app (también en Secrets):**

| Secret | Valor |
|--------|-------|
| `DEV_SUPABASE_URL` | URL pública del proyecto Supabase DEV |
| `DEV_SUPABASE_ANON_KEY` | Anon key del proyecto DEV |
| `STAGING_SUPABASE_URL` | Igual que DEV (Opción A) |
| `STAGING_SUPABASE_ANON_KEY` | Igual que DEV (Opción A) |
| `PROD_SUPABASE_URL` | URL pública del proyecto Supabase PROD |
| `PROD_SUPABASE_ANON_KEY` | Anon key del proyecto PROD |

---

## Paso 4 — Deshabilitar el auto-deploy de Vercel

Ahora que GitHub Actions controlará los deploys, hay que decirle a Vercel que deje de hacerlo automáticamente. Si no, habrá dos deploys por cada push.

1. Vercel → tu proyecto → Settings → Git
2. En **Ignored Build Step** agregar:
   ```bash
   exit 1
   ```
   Esto hace que Vercel ignore todos los builds automáticos.

> Alternativamente, puedes dejar el auto-deploy activo solo para la rama `develop` y usar Actions solo para staging y prod. Es más simple pero mezcla dos sistemas.

---

## Paso 5 — Copiar los workflows al proyecto

Los archivos de workflow están en la carpeta [workflows/](workflows/) de este sprint. Copiarlos al proyecto:

```bash
# Desde la raíz del proyecto
mkdir -p .github/workflows

cp ruta/a/sprint-04-cicd/workflows/ci-pr.yml          .github/workflows/
cp ruta/a/sprint-04-cicd/workflows/ci-develop.yml      .github/workflows/
cp ruta/a/sprint-04-cicd/workflows/ci-staging.yml      .github/workflows/
cp ruta/a/sprint-04-cicd/workflows/ci-production.yml   .github/workflows/
```

### 5.1 Ajustar el directorio del frontend

Los workflows asumen que el `package.json` está en la raíz. Si tu frontend está en una subcarpeta (ej: `frontend/`), cambiar en cada workflow:

```yaml
# Antes
- run: npm ci

# Después
- run: npm ci
  working-directory: frontend
```

### 5.2 (Path B — Vite) Verificar el nombre del script de build

Los workflows usan `npm run build`. Si tu `package.json` tiene un nombre diferente:
```yaml
- run: npm run build   # cambiar si tu script se llama diferente
```

### 5.3 (Path C — Backend) Agregar el deploy del backend

Si tienes un backend en Railway, Railway lo deploya automáticamente al detectar cambios en la rama. Puedes agregar un step de verificación al final del workflow:

```yaml
- name: Verificar que el backend responde
  run: |
    sleep 30  # esperar que Railway complete el deploy
    curl --fail https://tu-backend.up.railway.app/health
```

---

## Paso 6 — Primer pipeline en acción

### 6.1 Pushear los workflows

```bash
git checkout develop
git add .github/workflows/
git commit -m "chore: agregar pipelines de CI/CD"
git push origin develop
```

Ir a GitHub → **Actions**. Deberías ver el workflow `CI — DEV` ejecutándose.

### 6.2 Verificar que los jobs pasan

El primer run probablemente va a fallar. Causas comunes:

**"supabase: command not found"**
El workflow instala la CLI en cada run. Verificar que el step `uses: supabase/setup-cli@v1` está presente.

**"Error: Invalid database URL"**
El secret `DEV_DB_URL` no está configurado o tiene el formato incorrecto. Verificar en Settings → Secrets.

**"Error: Vercel token is required"**
El secret `VERCEL_TOKEN` no está configurado o expiró.

**Tests fallan**
Si no tienes tests escritos, el step `npm test` falla. Dos opciones:
- Agregar un test mínimo (ver ejemplo en workflows)
- Comentar el step de tests por ahora y agregarlo cuando tengan tests reales

### 6.3 Flujo completo de prueba

```bash
# 1. Crear una feature branch
git checkout develop
git checkout -b feat/test-pipeline

# 2. Hacer un cambio mínimo
echo "<!-- test -->" >> index.html   # o cualquier archivo
git add . && git commit -m "chore: verificar pipeline"
git push origin feat/test-pipeline

# 3. Abrir PR hacia develop en GitHub
# El workflow ci-pr.yml debe ejecutarse

# 4. Mergear el PR
# El workflow ci-develop.yml debe ejecutarse y deployar a DEV

# 5. PR develop → staging
# El workflow ci-staging.yml debe ejecutarse

# 6. PR staging → main
# El workflow ci-production.yml debe pausar esperando aprobación
# Aprobar manualmente en GitHub → Actions
# El workflow completa el deploy a producción
```

---

## Paso 7 — Branch protection: agregar status checks

Ahora que los workflows existen, puedes requerir que pasen antes de hacer merge.

GitHub → Settings → Branches → editar la rule de `main`:
- ✅ Require status checks to pass before merging
- Buscar y agregar: `test` (el nombre del job en tu workflow)

Hacer lo mismo para `develop` y `staging`.

A partir de aquí, si los tests fallan, el PR no puede mergearse — sin importar quién lo apruebe.

---

## Checklist de entrega

```
DEPLOY_STATUS.md — actualizar con:

## Entornos
- DEV:     https://_____________.vercel.app  (rama: develop)
- Staging: https://_____________.vercel.app  (rama: staging)
- Prod:    https://_____________.vercel.app  (rama: main)

## CI/CD
- [ ] Los 4 workflows están en .github/workflows/
- [ ] El pipeline de DEV pasó al menos una vez (link al run exitoso):
      https://github.com/.../actions/runs/...
- [ ] El pipeline de STAGING pasó al menos una vez:
      https://github.com/.../actions/runs/...
- [ ] El pipeline de PROD pausó esperando aprobación y se aprobó:
      https://github.com/.../actions/runs/...

## Migraciones automáticas
- [ ] Se puede ver en el log del pipeline que `supabase db push` corrió

## Aprobación manual
- [ ] El environment "production" tiene required reviewers configurado
- [ ] Se hizo al menos una aprobación manual de un deploy a prod

## Para continuar
(si no terminaste, describir qué falta y el error exacto del log de Actions)
```
