# Setup Sprint 2 — Dos entornos: desarrollo y producción

**Prerequisito:** Tu app del Sprint 1 tiene una URL pública funcionando en Vercel con Supabase cloud.

Este sprint no toca el código de la aplicación. Todo el trabajo es de infraestructura y configuración.

---

## Qué vas a tener al terminar

```
Antes (Sprint 1)          Después (Sprint 2)
─────────────────         ──────────────────────────────────
rama: main          →     rama: main     → producción (URL estable)
BD:   1 proyecto    →     rama: develop  → desarrollo  (URL de prueba)
                          BD dev:  proyecto Supabase separado
                          BD prod: el que ya tenías
```

---

## Paso 1 — Crear el segundo proyecto en Supabase

El proyecto de Supabase que tienes del Sprint 1 es producción. Necesitas uno nuevo para desarrollo.

1. Ir a [supabase.com](https://supabase.com) → tu organización → **New project**
2. Nombre: `nombre-del-proyecto-dev` (agregar `-dev` para diferenciarlo)
3. Misma región que el de producción
4. Contraseña: puede ser diferente a la de producción
5. Plan: Free

> El tier gratuito permite **2 proyectos activos**. Si ya tienes 2, pausa el que no estés usando: Dashboard → proyecto → Settings → General → Pause project.

### 1.1 Aplicar las migraciones al proyecto de desarrollo

El proyecto nuevo está vacío — no tiene tu esquema. Hay que aplicar las mismas migraciones que tienes en producción.

```bash
# Vincular con el proyecto DEV (no el de producción)
supabase link --project-ref REF_DEL_PROYECTO_DEV

# Aplicar todas las migraciones
supabase db push

# Verificar en el dashboard que las tablas existen
# Supabase → Table Editor
```

### 1.2 Cargar datos de prueba (opcional pero recomendado)

En el proyecto de DEV puedes tener datos falsos para probar sin miedo a romper nada real. Si tienes un `seed.sql`:

```bash
# Opción A: desde la CLI
supabase db reset --linked   # borra todo y re-aplica migraciones + seed

# Opción B: desde el SQL Editor del dashboard DEV
# pegar el contenido de supabase/seed.sql y ejecutar
```

### 1.3 Anotar las credenciales del proyecto DEV

Ir a **Settings → API** del proyecto DEV y guardar:
```
DEV Project URL:   https://xxxxxxxxxxxx.supabase.co
DEV anon key:      eyJhbGci...
```

---

## Paso 2 — Crear la rama `develop`

Si aún no tienes la rama `develop` del Sprint 1:

```bash
# Asegurarse de estar en main y actualizado
git checkout main
git pull origin main

# Crear y subir la rama develop
git checkout -b develop
git push -u origin develop
```

Verificar en GitHub que ambas ramas existen: `main` y `develop`.

---

## Paso 3 — Configurar Vercel para dos entornos

Vercel tiene tres tipos de environment built-in:
- **Production** → rama `main`
- **Preview** → cualquier otra rama (incluyendo `develop`)
- **Development** → variables disponibles via `vercel env pull`

Vamos a usar esto para separar las variables de entorno por entorno.

### 3.1 Configurar variables para Production

Las variables de producción ya las tienes del Sprint 1. Verificar que están configuradas solo para **Production**:

1. Vercel → tu proyecto → **Settings → Environment Variables**
2. Para cada variable (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.):
   - Click en el ícono de editar (lápiz)
   - Verificar que **Production** está marcado
   - Si también tiene Preview marcado, desmarcar Preview por ahora

### 3.2 Agregar variables para Preview (entorno DEV)

En **Settings → Environment Variables** → **Add new**:

| Variable | Valor | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto DEV | ✅ Preview únicamente |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key del proyecto DEV | ✅ Preview únicamente |
| `VITE_SUPABASE_URL` | (Path B) URL del proyecto DEV | ✅ Preview únicamente |
| `VITE_SUPABASE_ANON_KEY` | (Path B) Anon key del proyecto DEV | ✅ Preview únicamente |
| `NEXT_PUBLIC_ENV_NAME` / `VITE_ENV_NAME` | `development` | ✅ Preview únicamente |

> Si la variable ya existe para Production, crear una **nueva entrada** con el mismo nombre pero valor diferente y environment diferente. Vercel resuelve el conflicto correctamente.

### 3.3 Asignar una URL fija a la rama `develop`

Por defecto Vercel genera una URL aleatoria para cada preview deployment. Para tener una URL estable para `develop`:

1. **Settings → Domains → Add**
2. Ingresar: `dev-[nombre-del-proyecto].vercel.app`
3. En el campo **Git Branch**: escribir `develop`
4. Click **Add**

Ahora cada push a `develop` actualiza esa URL específica.

### 3.4 (Path C) Segundo servicio en Railway para el backend DEV

Si tu proyecto tiene backend en Railway:

1. Railway → tu proyecto → **New Service → GitHub Repo**
2. Seleccionar el mismo repositorio, carpeta `backend/`
3. En las variables de entorno de este servicio nuevo, usar las credenciales del proyecto Supabase DEV
4. El servicio DEV en Railway tendrá su propia URL: `tu-backend-dev.up.railway.app`

Actualizar la variable `VITE_BACKEND_URL` en Vercel Preview con esta nueva URL.

---

## Paso 4 — Verificar que los entornos están separados

### 4.1 Hacer un push a `develop`

```bash
git checkout develop

# Cambio pequeño para forzar un deploy
echo "# dev" >> README.md
git add README.md
git commit -m "chore: verificar entorno dev"
git push origin develop
```

Ir a Vercel → Deployments. Debería aparecer un deployment nuevo con la rama `develop`.

### 4.2 Confirmar que usa la BD correcta

Abrir la URL de desarrollo. El banner de entorno (si usas el código de ejemplo) debería mostrar `development` en azul.

Crear un registro en la URL de desarrollo. Luego abrir la URL de producción y confirmar que ese registro **no aparece** en producción. Si aparece en ambas, las variables de entorno no están separadas correctamente — revisar el Paso 3.

---

## Paso 5 — Flujo de trabajo desde ahora

Este es el flujo que el equipo debe seguir a partir de este sprint:

```
1. Antes de empezar: git checkout develop && git pull
2. Crear rama de feature:  git checkout -b feature/mi-cambio
3. Hacer cambios y commits
4. Push y verificar en la URL de dev que funciona
5. Merge a develop (para ahora, directamente — en Sprint 3 será por PR)
6. Validar en develop que todo está bien
7. Merge develop → main para que llegue a producción
```

### Regla fundamental

> **`main` solo recibe código que ya fue validado en `develop`.**
> Si algo falla en producción, el primer instinto no es "arreglarlo en main" — es "arreglarlo en develop, verificarlo, y luego mergearlo a main".

---

## Paso 6 — Migraciones en dos entornos

Este es el punto más delicado del sprint. Cuando necesitas cambiar el esquema de la base de datos:

### El problema

```
Escenario: agregas una columna nueva que tu código necesita.

Si aplicas la migración solo en DEV:
  → En producción el código falla porque la columna no existe

Si aplicas la migración solo en PROD:
  → Inconsistencia entre entornos, bugs difíciles de reproducir

Si subes el código sin aplicar la migración primero:
  → La app falla en el momento del deploy
```

### El orden correcto

```
1. Crear el archivo de migración
   supabase/migrations/TIMESTAMP_nombre.sql

2. Aplicar en DEV primero
   supabase link --project-ref REF_DEV
   supabase db push

3. Probar que la app funciona en DEV con el cambio

4. Hacer merge a develop → verificar en URL de dev

5. Hacer merge develop → main

6. Aplicar en PROD
   supabase link --project-ref REF_PROD
   supabase db push

7. Verificar en producción
```

> En el Sprint 4 (CI/CD), los pasos 6 y 7 serán automáticos. Por ahora son manuales.

### Cambiar entre proyectos vinculados

```bash
# Ver con qué proyecto estás vinculado actualmente
supabase status

# Cambiar al proyecto DEV
supabase link --project-ref REF_PROYECTO_DEV

# Cambiar al proyecto PROD
supabase link --project-ref REF_PROYECTO_PROD
```

El `project-ref` son los caracteres del subdominio de la URL: `https://[REF].supabase.co`

### Crear una migración nueva (repaso)

```bash
# Crear el archivo con timestamp automático
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_descripcion_del_cambio.sql

# Escribir el SQL en ese archivo, luego:
supabase link --project-ref REF_DEV
supabase db push

# Incluir el archivo de migración en el mismo commit que el código
git add supabase/migrations/ src/
git commit -m "feat: descripción del cambio"
```

---

## Checklist de entrega

```
DEPLOY_STATUS.md — actualizar con:

## Entornos configurados
- Producción:   https://_____________.vercel.app  (rama: main)
- Desarrollo:   https://_____________.vercel.app  (rama: develop)

## Supabase
- Proyecto PROD: https://_____________.supabase.co
- Proyecto DEV:  https://_____________.supabase.co

## Verificación de separación
- [ ] Creé un registro en DEV y NO aparece en PROD
- [ ] El banner de entorno muestra colores distintos en cada URL
- [ ] Las migraciones están aplicadas en ambos proyectos

## (Path C) Railway
- Backend PROD: https://_____________.up.railway.app
- Backend DEV:  https://_____________.up.railway.app

## Para continuar
(si no terminaste, describir qué falta y el error exacto)
```
