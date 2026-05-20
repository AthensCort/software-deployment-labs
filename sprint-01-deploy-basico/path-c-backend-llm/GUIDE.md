# Path C — Backend separado + APIs externas (LLM / RAG)

**Tiempo estimado:** 2 a 3 horas  
**Prerequisito:** Tu app corre localmente sin errores

---

## Visión general

Este path cubre proyectos que tienen un backend propio — un servidor Node.js, Python/FastAPI, o similar — además del frontend. Es el caso más común cuando implementan chatbots, RAG, o cualquier integración que no puede ir directo al browser (por ejemplo: llamadas a APIs de pago cuyos keys no pueden exponerse al cliente).

```
Tu repo de GitHub
      │
      ├──► Vercel          (frontend: Next.js o Vite)
      │
      ├──► Railway         (backend: Node / Python / FastAPI)
      │         └──► APIs externas (OpenAI, Anthropic, Cohere, etc.)
      │
      └──► Supabase Cloud  (base de datos + Auth)
```

---

## Paso 0 — Identificar la arquitectura de tu proyecto

Antes de empezar, responde:

**¿Tienes un servidor backend separado?**

```
Sí, tengo un servidor Express/FastAPI/etc.
→ Seguir esta guía completa

No, llamo las APIs de LLM directo desde React/Next.js
→ Leer la sección "Advertencia sobre API keys en el frontend"
   y luego seguir Path A o Path B
```

**¿Cómo es tu estructura de repositorio?**

```
Opción A — Monorepo (todo en un solo repo)
proyecto/
├── frontend/
└── backend/

Opción B — Repos separados
repo-frontend/
repo-backend/
```

Ambas funcionan con Railway. Esta guía asume monorepo — si tienes repos separados, el proceso es el mismo pero por separado.

---

## ⚠️ Advertencia sobre API keys en el frontend

Si estás llamando a OpenAI, Anthropic u otros LLMs directamente desde React o Next.js pages (no desde API routes de Next.js), tu API key **es visible para cualquier usuario** que abra las herramientas de desarrollo del navegador.

Esto significa:
- Cualquier persona puede copiar tu key y usarla
- Te llegará la factura de su consumo
- Los proveedores pueden suspender tu cuenta por abuso

**La solución correcta:** el LLM se llama desde el servidor (backend o API routes de Next.js), nunca desde el browser.

Si por el momento necesitas un workaround para el Sprint 1:
- Usar el tier gratuito del proveedor y poner un límite de gasto de $0 en el dashboard
- Rotar la key después de la evaluación
- En el Sprint 2/3 migrar la llamada al backend

---

## Paso 1 — Preparar el repositorio

### 1.1 Verificar que ambas partes corren localmente

```bash
# Frontend
cd frontend && npm run dev

# Backend (en otra terminal)
cd backend && npm run dev   # Node
# o
cd backend && uvicorn main:app --reload  # Python/FastAPI
```

### 1.2 Identificar las variables de entorno de cada parte

Hacer un inventario completo:

```bash
# Variables del FRONTEND (.env o .env.local)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=http://localhost:3001  # ← esta cambia en producción

# Variables del BACKEND (.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # ← esta NUNCA va al frontend
OPENAI_API_KEY=              # ← esta NUNCA va al frontend
ANTHROPIC_API_KEY=           # ← esta NUNCA va al frontend
DATABASE_URL=
PORT=3001
```

### 1.3 Crear `.env.example` para cada parte

```bash
# frontend/.env.example
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_BACKEND_URL=http://localhost:3001

# backend/.env.example
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
OPENAI_API_KEY=sk-...
PORT=3001
```

### 1.4 Verificar `.gitignore` en ambas carpetas

```bash
# Asegurarse de que .env y .env.local no se commitean
cat frontend/.gitignore | grep env
cat backend/.gitignore | grep env
```

---

## Paso 2 — Supabase Cloud

Igual que en Path A/B:

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Aplicar el esquema SQL
3. Anotar `Project URL` y las dos keys (`anon` y `service_role`)

> El backend usará la `SERVICE_ROLE_KEY` (acceso total, sin RLS).
> El frontend usará solo la `ANON_KEY`.

---

## Paso 3 — Desplegar el backend en Railway

Railway es la opción más simple para backends. Detecta automáticamente Node.js y Python, y puede deployar desde un `Dockerfile` si tienes uno.

### 3.1 Crear cuenta en Railway

1. Ir a [railway.app](https://railway.app) → **Login with GitHub**
2. El tier gratuito incluye $5 de crédito por mes — suficiente para un backend de bajo tráfico

### 3.2 Crear el proyecto

1. **New Project → Deploy from GitHub repo**
2. Seleccionar tu repositorio
3. Si es monorepo, Railway preguntará qué carpeta deployar — seleccionar `backend/`

### 3.3 Configurar variables de entorno en Railway

En el servicio creado → **Variables** → agregar:

```
SUPABASE_URL            = https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
OPENAI_API_KEY          = sk-...
NODE_ENV                = production
PORT                    = 3000   (Railway asigna el puerto automáticamente via $PORT)
```

> **Importante para Node.js:** Railway inyecta la variable `PORT` automáticamente. Tu servidor debe escuchar en `process.env.PORT`:
> ```javascript
> const port = process.env.PORT || 3001
> app.listen(port)
> ```

> **Importante para Python/FastAPI:**
> ```python
> import os
> port = int(os.environ.get("PORT", 8000))
> uvicorn.run(app, host="0.0.0.0", port=port)
> ```

### 3.4 Verificar el deploy del backend

Railway te da una URL pública como `tu-backend.up.railway.app`.

Probar que responde:
```bash
curl https://tu-backend.up.railway.app/health
# o el endpoint que tengas
```

### 3.5 Configurar CORS en el backend

El backend necesita permitir peticiones desde la URL de Vercel:

**Node.js / Express:**
```javascript
import cors from 'cors'

app.use(cors({
  origin: [
    'http://localhost:5173',           // dev local
    'https://tu-proyecto.vercel.app',  // producción
  ]
}))
```

**Python / FastAPI:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://tu-proyecto.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Paso 4 — Desplegar el frontend en Vercel

Igual que Path A o Path B según uses Next.js o Vite, con una variable adicional:

| Variable | Valor |
|---|---|
| `VITE_BACKEND_URL` o `NEXT_PUBLIC_BACKEND_URL` | `https://tu-backend.up.railway.app` |

Asegurarse de que el frontend usa esta variable en lugar de `localhost`:

```typescript
// ✅ Correcto
const backendUrl = import.meta.env.VITE_BACKEND_URL

// ❌ Incorrecto — funciona en dev, falla en producción
const backendUrl = 'http://localhost:3001'
```

---

## Paso 5 — Configurar los 3 entornos

Para Sprint 1, con los entornos básicos es suficiente:

| Entorno | Frontend | Backend | Base de datos |
|---|---|---|---|
| Development | `dev-*.vercel.app` (rama `develop`) | Mismo Railway (o uno nuevo) | Supabase proyecto dev |
| Production | `*.vercel.app` (rama `main`) | `*.railway.app` | Supabase proyecto prod |

Para tener un backend de dev separado: crear un segundo servicio en Railway apuntando a la misma rama `develop`.

---

## Paso 6 — Verificación final

Responder antes de la defensa:

1. ¿Por qué las API keys de LLM van en el backend y no en el frontend?
2. ¿Qué diferencia hay entre la `ANON_KEY` y la `SERVICE_ROLE_KEY` de Supabase?
3. Si el backend falla, ¿qué parte de tu app deja de funcionar? ¿El frontend sigue cargando?
4. ¿Cómo revisas los logs del backend en Railway?
5. ¿Cómo probarías que el CORS está bien configurado?

Para los logs: Railway → tu servicio → **Deployments** → click en el deployment activo → ver logs en tiempo real.

---

## Checklist de entrega

```
DEPLOY_STATUS.md — actualizar con:

## URLs
- Frontend prod:   https://_____________.vercel.app
- Frontend dev:    https://_____________.vercel.app
- Backend:         https://_____________.up.railway.app

## Supabase
- Proyecto prod: https://_____________.supabase.co
- Proyecto dev:  https://_____________.supabase.co

## Estado
- [x] Backend responde en Railway (curl al endpoint de health)
- [x] Frontend conecta con el backend (no usa localhost)
- [x] API keys de LLM están en Railway, no en el repo
- [x] CORS configurado para la URL de Vercel
- [x] App completa funcional desde URL pública
- [x] Ramas main y develop en el repo
```

---

## Errores frecuentes y soluciones

**CORS error en el browser**
El backend no tiene la URL de Vercel en la lista de `allow_origins`. Agregar la URL exacta (con `https://`, sin barra final) y volver a deployar el backend.

**`fetch` al backend falla con "Mixed Content"**
El frontend está en HTTPS pero está intentando llamar al backend en HTTP. Railway da HTTPS por defecto — verificar que la variable `VITE_BACKEND_URL` usa `https://`.

**El backend en Railway da error al arrancar**
Revisar que el `PORT` se lee de `process.env.PORT` y no está hardcodeado. Railway inyecta el puerto automáticamente.

**La API de OpenAI/Anthropic responde "API key not valid"**
La variable de entorno en Railway no está bien copiada. Las keys suelen tener caracteres especiales que pueden cortarse — copiar de nuevo directamente del dashboard del proveedor.

**El backend responde localmente pero timeout en Railway**
El servidor no está escuchando en `0.0.0.0` — en algunos frameworks el default es `127.0.0.1` (solo local). Cambiar el host a `0.0.0.0`:
```javascript
app.listen(port, '0.0.0.0')  // Node
```
```python
uvicorn.run(app, host="0.0.0.0", port=port)  // FastAPI
```
