# Setup Path C — Backend separado + APIs LLM + Supabase

Este path tiene tres piezas que cada miembro del equipo posiblemente configuró por separado. Esta guía las unifica.

---

## ¿Quién configuró qué?

En proyectos con este stack es común que el trabajo esté dividido así:

| Miembro | Qué hizo |
|---------|----------|
| A | Configuró Supabase |
| B | Escribió el backend (Express/FastAPI) |
| C | Hizo el frontend en React |
| D | Integró el LLM |
| E | "Solo hizo el diseño" |

El problema: nadie tiene el sistema completo corriendo localmente. Esta guía te permite armarlo aunque no hayas tocado cada pieza.

---

## Caso 1 — "Soy el encargado de Supabase"

Seguir los pasos 1.1 a 1.5 de [../path-a-nextjs/SETUP.md](../path-a-nextjs/SETUP.md).

**Diferencia clave para este path:** la tabla de Supabase la accede el **backend** con la `SERVICE_ROLE_KEY`, no el frontend. Las políticas RLS pueden ser más restrictivas o inexistentes porque el backend siempre usa el rol de administrador.

---

## Caso 2 — "Me dieron las credenciales de Supabase y del LLM"

Necesitas:
- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` → van al backend
- `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` → van al backend
- Nada de lo anterior va al frontend

Continuar desde el Paso 3.

---

## Paso 3 — Levantar el backend localmente

### 3.1 Instalar dependencias

```bash
cd backend
npm install
```

### 3.2 Crear variables de entorno del backend

```bash
cp .env.example .env
```

Editar `backend/.env`:
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Usar el que corresponda a tu proyecto
OPENAI_API_KEY=sk-...
# o
ANTHROPIC_API_KEY=sk-ant-...

PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3.3 Aplicar migraciones

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

O manualmente desde el SQL Editor de Supabase con el contenido de `supabase/migrations/`.

### 3.4 Iniciar el backend

```bash
npm run dev
# Backend corriendo en http://localhost:3001
```

### 3.5 Verificar que responde

```bash
curl http://localhost:3001/health
# Debe devolver: {"status":"ok","env":"development"}
```

---

## Paso 4 — Levantar el frontend localmente

### 4.1 En otra terminal

```bash
cd frontend
npm install
```

### 4.2 Variables de entorno del frontend

```bash
cp .env.example .env.local
```

Editar `frontend/.env.local`:
```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_ENV_NAME=development
```

> Nota: el frontend **no necesita** la URL de Supabase ni ninguna API key. Solo necesita saber dónde está el backend.

### 4.3 Iniciar el frontend

```bash
npm run dev
# Abrir http://localhost:5173
```

Escribir un mensaje en el chat. Deberías ver la respuesta del LLM. Si aparece "[Modo demo]" en la respuesta, el backend no encontró las API keys — revisar el `.env` del backend.

---

## Paso 5 — Entender la separación frontend / backend

Este es el patrón más importante de este path:

```
FRONTEND (navegador)          BACKEND (servidor)
──────────────────────        ──────────────────────
React + Vite                  Express + Node.js
.env.local con VITE_*         .env con secrets reales
                │                      │
                │  HTTP fetch          │
                └──────────────────────┤
                                       ├── Supabase (service_role)
                                       └── LLM API (OpenAI/Anthropic)
```

**Por qué el LLM no va en el frontend:**
1. Las API keys estarían visibles para cualquier usuario
2. El usuario podría hacer llamadas directas usando tu key
3. No podrías guardar el historial en Supabase de forma segura
4. No podrías agregar validaciones, rate limiting ni lógica de negocio

---

## Paso 6 — Migraciones

El sistema es idéntico a los otros paths. Ver [Path A SETUP — Paso 4](../path-a-nextjs/SETUP.md#paso-4--entender-las-migraciones) para la explicación completa.

**Particularidad de este path:** la tabla `messages` no tiene políticas RLS públicas intencionalmente. Solo el backend (con `SERVICE_ROLE_KEY`) puede leer y escribir. Esto es correcto — el frontend nunca accede directamente a Supabase.

Si agregas nuevas tablas, considera:
- ¿Quién accede? ¿El backend o el frontend directamente?
- Si es el backend: sin políticas públicas, solo `service_role`
- Si es el frontend: necesitas políticas RLS explícitas

---

## Paso 7 — Adaptar el código de ejemplo a tu proyecto

El ejemplo implementa un chatbot simple. Para adaptarlo:

**Si tu proyecto es RAG (Retrieval Augmented Generation):**

```javascript
// En backend/index.js, antes de llamar al LLM:
// 1. Buscar documentos relevantes en Supabase con pgvector
const { data: docs } = await supabase.rpc('match_documents', {
  query_embedding: await getEmbedding(message),
  match_threshold: 0.78,
  match_count: 5,
})

// 2. Agregar el contexto al prompt del sistema
const systemPrompt = `Contexto relevante:\n${docs.map(d => d.content).join('\n\n')}\n\nResponde basándote en el contexto anterior.`
```

**Si tu proyecto tiene múltiples conversaciones:**

```sql
-- Nueva migración: agregar soporte para múltiples conversaciones
alter table public.messages
  add column if not exists conversation_id uuid not null default gen_random_uuid();

create index if not exists messages_conversation_idx
  on public.messages (conversation_id);
```

**Si usas otro proveedor de LLM:**

La función `callLLM` en `backend/index.js` está diseñada para ser fácil de modificar. Solo cambia la llamada `fetch` con la API de tu proveedor.

---

## Paso 8 — Deploy

Con ambas partes funcionando localmente, seguir la [guía de deploy](GUIDE.md):
- Frontend → Vercel
- Backend → Railway

**Orden recomendado:**
1. Deployar el backend primero (obtener la URL de Railway)
2. Configurar `VITE_BACKEND_URL` en Vercel con esa URL
3. Deployar el frontend

---

## Resumen de comandos

```bash
# Backend
cd backend
npm run dev               # servidor con hot-reload
node index.js             # producción
curl localhost:3001/health  # verificar que responde

# Frontend
cd frontend
npm run dev               # http://localhost:5173
npm run build             # build de producción → dist/

# Supabase CLI
supabase db push          # aplicar migraciones
supabase db diff          # ver diferencias de esquema
```
