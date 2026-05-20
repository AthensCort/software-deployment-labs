# Setup Path B — Vite + React + Supabase

Este documento cubre:
- **Soy el encargado de Supabase** — configurarlo desde cero
- **Me dieron las credenciales** — conectarme al proyecto existente
- Cómo funcionan las migraciones
- Diferencias clave entre Vite y Next.js al deployar

---

## Caso 1 — "Soy el encargado de Supabase"

El proceso de crear el proyecto en Supabase es idéntico al Path A.
Seguir los pasos 1.1 a 1.5 de [../path-a-nextjs/SETUP.md](../path-a-nextjs/SETUP.md).

La única diferencia: en Vite **no existe** la `SERVICE_ROLE_KEY` en el frontend.
Todo acceso a Supabase desde Vite usa únicamente la `ANON_KEY`.

---

## Caso 2 — "Me dieron las credenciales"

Con la URL y la `ANON_KEY` del proyecto eres suficiente para trabajar. Continuar desde el Paso 3.

---

## Paso 3 — Configurar el proyecto localmente

### 3.1 Clonar e instalar

```bash
git clone https://github.com/TU_ORG/TU_REPO.git
cd TU_REPO

# o si trabajas con el ejemplo
cd sprints/sprint-01-deploy-basico/path-b-vite-react/example-app

npm install
```

### 3.2 Crear variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ENV_NAME=development
```

### 3.3 Diferencia importante: cómo leer variables en Vite

En Next.js se usa `process.env.NEXT_PUBLIC_X`.
En Vite se usa `import.meta.env.VITE_X`.

```typescript
// ✅ Correcto en Vite
const url = import.meta.env.VITE_SUPABASE_URL

// ❌ No existe en Vite
const url = process.env.VITE_SUPABASE_URL
```

Si el proyecto de tu equipo usaba `process.env`, necesitas migrar a `import.meta.env`.

### 3.4 Aplicar las migraciones

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

O manualmente desde el SQL Editor del dashboard (ver [Path A SETUP](../path-a-nextjs/SETUP.md#paso-4--entender-las-migraciones)).

### 3.5 Verificar localmente

```bash
npm run dev
# Abrir http://localhost:5173
```

---

## Paso 4 — Diferencia crítica: el `vercel.json`

Vite produce una SPA (Single Page Application). Cuando Vercel sirve archivos estáticos y el usuario visita una ruta como `/dashboard`, Vercel busca un archivo `dashboard.html` que no existe y devuelve 404.

La solución es el archivo `vercel.json` en la raíz del proyecto:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esto le dice a Vercel: "para cualquier ruta, sirve `index.html` y deja que React Router maneje el resto". **Sin este archivo las rutas de tu app no funcionarán en producción.**

Next.js no necesita este archivo porque maneja el routing del lado del servidor.

---

## Paso 5 — Migraciones

El sistema de migraciones es exactamente igual que en Path A. Ver la sección completa en [Path A SETUP — Paso 4](../path-a-nextjs/SETUP.md#paso-4--entender-las-migraciones).

Resumen:
- Un archivo `.sql` por cambio, con timestamp en el nombre
- Commitear junto con el código que usa ese cambio
- `supabase db push` para aplicar al entorno actual

---

## Paso 6 — Adaptar el código de ejemplo

El ejemplo usa la tabla `tasks` con columnas `title`, `completed`, `priority`.

Para adaptarlo a tu proyecto:

**1. Cambiar la migración** `supabase/migrations/20240101000000_init.sql` con tu esquema real.

**2. Actualizar los tipos** en `src/lib/supabase.ts`:
```typescript
// Cambiar Task por tu entidad
export type Task = { ... }
export type Product = { id: number, name: string, price: number }
```

**3. Actualizar las queries** en `src/App.tsx`:
```typescript
// Cambiar 'tasks' por tu tabla
const { data } = await supabase.from('products').select('*')
```

El cliente `supabase` en `src/lib/supabase.ts` no cambia.

---

## Paso 7 — Deploy a Vercel

Con el proyecto funcionando localmente y el `vercel.json` creado, seguir la [guía de deploy](GUIDE.md).

---

## Resumen de comandos

```bash
npm run dev              # servidor de desarrollo (http://localhost:5173)
npm run build            # build de producción → carpeta dist/
npm run preview          # previsualizar el build localmente

supabase db push         # aplicar migraciones pendientes
supabase db diff         # ver diferencias de esquema
```
