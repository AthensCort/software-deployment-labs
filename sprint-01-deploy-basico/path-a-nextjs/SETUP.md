# Setup Path A — Next.js + Supabase

Este documento cubre dos situaciones distintas del equipo:

- **Soy el encargado de Supabase** — nunca lo he configurado y necesito hacerlo desde cero
- **Me dieron las credenciales** — alguien ya configuró Supabase y solo necesito conectarme

Elige tu caso y sigue la sección correspondiente. Ambos confluyen en el Paso 3.

---

## Caso 1 — "Soy el encargado de Supabase"

### 1.1 Crear la cuenta

1. Ir a [supabase.com](https://supabase.com) → **Start your project**
2. Registrarse con GitHub (recomendado — así Supabase y tu repo quedan en la misma cuenta)

### 1.2 Crear el proyecto

1. Click en **New project**
2. Completar:
   - **Name:** nombre de tu proyecto (ej: `mi-proyecto-prod`)
   - **Database Password:** inventar una contraseña segura y **guardarla en un lugar seguro** (no hay forma de recuperarla)
   - **Region:** elegir el más cercano (ej: `East US` o `West Europe`)
   - **Plan:** Free
3. Click **Create new project** y esperar ~2 minutos

### 1.3 Aplicar las migraciones

Las migraciones son los archivos `.sql` en la carpeta `supabase/migrations/`. Definen la estructura de la base de datos. Aplicarlas significa ejecutar ese SQL en tu proyecto.

**Opción A — Desde el dashboard (más simple para empezar):**

1. En el dashboard de Supabase ir a **SQL Editor**
2. Abrir el archivo `supabase/migrations/20240101000000_init.sql` del proyecto
3. Pegar el contenido en el editor y click **Run**
4. Repetir con cada archivo de migración, en orden cronológico (el número al inicio del nombre es la fecha)

**Opción B — Con la CLI de Supabase (la forma correcta a largo plazo):**

```bash
# Instalar la CLI
npm install -g supabase

# Iniciar sesión
supabase login
# Se abre el navegador — autorizar el acceso

# Vincular el proyecto local con el proyecto cloud
# El PROJECT_REF son los caracteres del subdominio de tu URL:
# https://[ESTE-ES-EL-REF].supabase.co
supabase link --project-ref TU_PROJECT_REF

# Aplicar todas las migraciones pendientes
supabase db push
```

### 1.4 Obtener las credenciales

Ir a **Settings → API** y copiar:

```
Project URL:  https://xxxxxxxxxxxx.supabase.co
anon / public key: eyJhbGciOiJIUzI1NiIs...
service_role key:  eyJhbGciOiJIUzI1NiIs...   ← guardar en secreto
```

### 1.5 Compartir con el equipo

Enviar por un canal seguro (no por el chat grupal del proyecto):
- **Project URL** — esta sí puede compartirse libremente
- **anon key** — puede compartirse, es pública por diseño
- **service_role key** — solo para quien la necesite en el backend. Nunca al frontend.
- **Database Password** — solo para acceso directo a Postgres, generalmente no se necesita en el día a día

---

## Caso 2 — "Me dieron las credenciales"

Si un compañero ya configuró Supabase y te pasó las keys, solo necesitas:

1. Asegurarte de tener:
   - La `NEXT_PUBLIC_SUPABASE_URL`
   - La `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Continuar desde el **Paso 3** de esta guía

> Si el compañero todavía no aplicó las migraciones (la tabla no existe), necesitarás que lo haga — o pedir acceso al dashboard para hacerlo tú.

---

## Paso 3 — Configurar el proyecto localmente

### 3.1 Clonar el repositorio

```bash
git clone https://github.com/TU_ORG/TU_REPO.git
cd TU_REPO
```

Si vas a trabajar con el código de ejemplo de este path:

```bash
# Copiar el contenido de example-app/ a la raíz de tu proyecto
# o trabajar directamente dentro de example-app/
cd sprints/sprint-01-deploy-basico/path-a-nextjs/example-app
```

### 3.2 Instalar dependencias

```bash
npm install
```

### 3.3 Crear el archivo de variables de entorno

```bash
cp .env.example .env.local
```

Abrir `.env.local` y rellenar con los valores reales:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3.4 Verificar que funciona localmente

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Deberías ver la app de notas. Si aparece un error de conexión, verificar las variables de entorno.

---

## Paso 4 — Entender las migraciones

### ¿Qué es una migración?

Una migración es un archivo SQL con un nombre que empieza por una fecha/timestamp. Describe **un cambio específico** al esquema de la base de datos.

```
supabase/migrations/
├── 20240101000000_init.sql        ← crea la tabla notes
└── 20240115000000_add_category.sql ← agrega la columna category
```

**La regla fundamental:** los cambios al esquema de la base de datos nunca se hacen manualmente en el dashboard. Se hacen como migraciones — archivos versionados en git — para que todos los entornos tengan exactamente el mismo esquema.

### ¿Cómo crear una migración nueva?

Cuando necesitas cambiar algo en la base de datos (nueva tabla, nueva columna, nuevo índice):

```bash
# Formato del nombre: YYYYMMDDHHMMSS_descripcion.sql
# Usar la fecha actual para que las migraciones queden en orden

# Ejemplo: agregar una tabla de etiquetas
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_tags.sql
```

Escribir el SQL del cambio en ese archivo:

```sql
-- supabase/migrations/20240201120000_add_tags.sql

create table if not exists public.tags (
  id      bigserial primary key,
  name    text not null unique,
  note_id bigint references public.notes(id) on delete cascade
);
```

Luego hacer commit y aplicar:

```bash
git add supabase/migrations/
git commit -m "feat: agregar tabla de etiquetas"

# Aplicar al entorno de desarrollo
supabase db push
```

### ¿Qué pasa cuando alguien del equipo crea una migración?

Cuando haces `git pull` y aparece un nuevo archivo en `supabase/migrations/`, significa que alguien cambió la base de datos. Debes aplicar esa migración en tu entorno:

```bash
git pull
supabase db push  # aplica solo las migraciones que aún no están en tu BD
```

Supabase lleva un registro interno de qué migraciones ya aplicó — no hay riesgo de ejecutar la misma dos veces.

### Migraciones en producción

Cuando el CI/CD deploya a producción, también aplica automáticamente las migraciones pendientes. Esto se configura en el Sprint 4. Por ahora, en producción se aplican manualmente igual que en desarrollo.

---

## Paso 5 — Adaptar el código de ejemplo a tu proyecto

El código de ejemplo usa una tabla `notes`. Para adaptarlo a tu proyecto:

**1. Reemplaza la migración inicial** con el esquema de tu proyecto real:
```bash
# Renombrar o reemplazar el contenido de
supabase/migrations/20240101000000_init.sql
```

**2. Cambia los tipos** en `app/page.tsx`:
```typescript
// Cambiar Note por el tipo de tu entidad principal
export type Note = { ... }
// por ejemplo:
export type Product = { id: number, name: string, price: number, ... }
```

**3. Cambia las queries** en `app/page.tsx` y `app/actions.ts`:
```typescript
// Cambiar 'notes' por el nombre de tu tabla
const { data } = await supabase.from('products').select('*')
```

**4. Actualiza los componentes** con los campos de tu entidad.

El patrón de `utils/supabase/client.ts` y `utils/supabase/server.ts` no cambia — funciona para cualquier tabla.

---

## Paso 6 — Deploy a Vercel

Con el proyecto funcionando localmente, seguir la [guía de deploy](GUIDE.md) para publicarlo.

---

## Resumen de comandos útiles

```bash
# Desarrollo local
npm run dev                    # inicia el servidor de desarrollo

# Supabase CLI
supabase login                 # autenticarse
supabase link --project-ref X  # vincular con el proyecto cloud
supabase db push               # aplicar migraciones pendientes
supabase db diff               # ver diferencias entre local y cloud
supabase status                # ver el estado del proyecto vinculado

# Git
git pull                       # siempre hacer pull antes de empezar a trabajar
git add supabase/migrations/   # siempre incluir migraciones con el código que las usa
```
