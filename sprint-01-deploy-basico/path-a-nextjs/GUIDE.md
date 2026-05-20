# Path A — Next.js + Supabase → Vercel

**Tiempo estimado:** 1.5 a 2 horas  
**Prerequisito:** Tu app corre con `npm run dev` sin errores

---

## Visión general

```
Tu repo de GitHub
      │
      ├──► Vercel          (sirve el frontend + API routes de Next.js)
      │
      └──► Supabase Cloud  (base de datos PostgreSQL + Auth + Storage)
```

Vercel y Supabase se comunican directamente. Tú no necesitas configurar ningún servidor.

---

## Paso 1 — Preparar el repositorio

### 1.1 Verificar que el proyecto buildea

Antes de tocar nada externo, confirma que el build funciona localmente:

```bash
npm run build
```

Si hay errores, arrégralos antes de continuar. Los errores de TypeScript que aparecen aquí pero no en dev son errores reales.

### 1.2 Crear el archivo `.env.example`

Si no tienes uno, créalo ahora en la raíz del proyecto:

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Si tienes más variables, agrégalas aquí SIN valores reales
# OPENAI_API_KEY=
# DATABASE_URL=
```

### 1.3 Confirmar que `.env.local` está en `.gitignore`

```bash
# Verificar
cat .gitignore | grep env
```

Debe aparecer `.env.local` (o `.env*`). Si no está, agrégalo:

```bash
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
git add .gitignore
git commit -m "chore: agregar archivos .env al gitignore"
```

### 1.4 Crear la rama `develop`

```bash
git checkout -b develop
git push -u origin develop
```

---

## Paso 2 — Crear el proyecto en Supabase Cloud

1. Ir a [supabase.com](https://supabase.com) → **Start your project** → iniciar sesión con GitHub

2. **New project** → completar:
   - Organization: la que ya tienes o crear una nueva
   - Name: `nombre-del-proyecto-prod`
   - Database Password: **guardar esta contraseña, no hay forma de recuperarla**
   - Region: el más cercano a tus usuarios (o `East US` si no importa)
   - Plan: Free

3. Esperar ~2 minutos mientras se crea la instancia

4. Una vez creado, ir a **Settings → API** y anotar:
   ```
   Project URL:  https://xxxxxxxxxxxx.supabase.co
   anon public:  eyJhbGci...
   ```

### 2.1 Aplicar el esquema de la base de datos

Si ya tienes el esquema SQL de tu proyecto:

- Ir a **SQL Editor** en el dashboard de Supabase
- Pegar y ejecutar tu SQL de creación de tablas

Si usas el cliente de Supabase con migraciones:

```bash
# Instalar CLI si no la tienes
npm install -g supabase

# Inicializar (si no lo hiciste antes)
supabase init

# Aplicar migraciones al proyecto cloud
supabase db push --project-ref tu-project-ref
```

El `project-ref` son los 20 caracteres del subdominio de tu URL: `https://[ESTE-ES-EL-REF].supabase.co`

---

## Paso 3 — Desplegar en Vercel

### 3.1 Crear cuenta y conectar repositorio

1. Ir a [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. **Add New → Project**
3. Importar tu repositorio de GitHub
4. Vercel detecta automáticamente que es Next.js — no cambiar nada en el framework preset

### 3.2 Configurar las variables de entorno ANTES de hacer deploy

En la pantalla de configuración del proyecto (antes de hacer click en Deploy):

1. Expandir **Environment Variables**
2. Agregar cada variable con su valor real:

| Variable | Valor | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |

> **Importante:** Las variables que empiezan con `NEXT_PUBLIC_` son visibles en el navegador. Nunca pongas ahí una `SERVICE_ROLE_KEY` o un API key de pago.

### 3.3 Hacer el primer deploy

Click en **Deploy**. Vercel va a:
1. Clonar tu repositorio
2. Instalar dependencias (`npm install`)
3. Buildear (`npm run build`)
4. Deployar el resultado

Si todo va bien verás una pantalla de confetti 🎉 con tu URL de producción.

### 3.4 Verificar que funciona

Abrir la URL que te dio Vercel y confirmar:
- La app carga
- Puede conectarse a Supabase (prueba crear un registro o iniciar sesión)
- No hay errores en la consola del navegador (F12)

---

## Paso 4 — Configurar los 3 entornos

Vercel crea automáticamente un **Preview Deployment** por cada rama o PR. Para tener 3 entornos formales:

### 4.1 Entorno de Producción (ya configurado)

- Rama: `main`
- URL: `tu-proyecto.vercel.app`
- Variables: las que configuraste en el Paso 3

### 4.2 Entorno de Development

En Vercel → tu proyecto → **Settings → Environment Variables**:

Agregar las mismas variables pero seleccionando solo **"Preview"** como environment, y opcionalmente con valores diferentes si quieres una BD de dev separada.

Para que la rama `develop` tenga su propia URL fija:

1. Ir a **Settings → Domains**
2. Agregar un dominio de preview para la rama `develop`:
   - Domain: `dev-tu-proyecto.vercel.app`
   - Branch: `develop`

Ahora cada push a `develop` actualiza `dev-tu-proyecto.vercel.app`.

### 4.3 Crear un segundo proyecto Supabase para desarrollo (recomendado)

El tier gratuito permite 2 proyectos. Crea uno más:
- Name: `nombre-del-proyecto-dev`
- Mismo proceso que el Paso 2

Luego en Vercel → Environment Variables → agregar las variables de Supabase con los valores del proyecto DEV, pero solo para el environment **"Preview"**.

---

## Paso 5 — Verificación final

Antes de la defensa técnica, confirma que puedes responder estas preguntas:

1. ¿Cuál es la URL de producción de tu app?
2. ¿Dónde están guardadas las variables de entorno? ¿Por qué no están en el código?
3. Si cambias algo en `develop`, ¿cómo llega ese cambio a producción?
4. ¿Qué pasa con los datos si alguien borra un registro en dev? ¿Afecta a prod?
5. ¿Dónde puedes ver los logs si algo falla en producción?

Para los logs: Vercel → tu proyecto → **Functions** o **Deployments** → click en el deployment → **Build Logs** o **Function Logs**.

---

## Checklist de entrega

```
DEPLOY_STATUS.md — actualizar con:

## URLs
- Producción:  https://_____________.vercel.app
- Development: https://_____________.vercel.app

## Supabase
- Proyecto prod: https://_____________.supabase.co
- Proyecto dev:  https://_____________.supabase.co  (si aplica)

## Estado
- [x] Build local exitoso (npm run build)
- [x] .env.local en .gitignore
- [x] Variables de entorno configuradas en Vercel
- [x] App accesible desde URL pública
- [x] Datos persisten (puedo crear y ver registros)
- [x] Ramas main y develop en el repositorio
```

---

## Errores frecuentes y soluciones

**Error: `supabaseUrl is required`**
La variable `NEXT_PUBLIC_SUPABASE_URL` no está llegando al build. Verificar que está configurada en Vercel (no solo en `.env.local`).

**Error 401 desde Supabase**
La `ANON_KEY` es incorrecta o está mal copiada. Copiarla de nuevo desde Supabase → Settings → API.

**Build falla: `Module not found`**
Hay un import que funciona en tu máquina (case-insensitive) pero falla en Linux (case-sensitive). Revisar que los nombres de archivos en los imports coincidan exactamente con los nombres reales.

**La app carga pero las rutas dan 404**
Falta configurar el rewrite para SPA en Vercel. Para Next.js esto no debería pasar — si ocurre, verificar que el `next.config.js` no tenga configuraciones que interfieran.

**Supabase dice "Invalid JWT"**
Probablemente estás usando la `SERVICE_ROLE_KEY` en el cliente del browser. Solo usar `ANON_KEY` en el cliente. La `SERVICE_ROLE_KEY` solo va en el servidor (API routes, `getServerSideProps`).
