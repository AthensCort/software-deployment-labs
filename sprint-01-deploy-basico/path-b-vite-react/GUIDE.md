# Path B — Vite + React + Supabase → Vercel

**Tiempo estimado:** 1.5 a 2 horas  
**Prerequisito:** Tu app corre con `npm run dev` sin errores

---

## Visión general

```
Tu repo de GitHub
      │
      ├──► Vercel          (sirve los archivos estáticos del frontend)
      │
      └──► Supabase Cloud  (base de datos + Auth + API REST + Storage)
```

A diferencia de Next.js, Vite produce archivos estáticos puros. Vercel los sirve como un CDN. Supabase actúa como el backend completo.

---

## Diferencia clave con Next.js

| | Next.js | Vite + React |
|---|---|---|
| Output del build | Server + archivos | Solo archivos estáticos |
| API routes | Sí, dentro del proyecto | No — Supabase es el backend |
| Routing en producción | Manejado por Next.js | Necesita configuración en Vercel |
| Variables de entorno | `NEXT_PUBLIC_` + sin prefijo | Solo `VITE_` (todo es público) |

> En Vite **todas las variables de entorno que uses en el frontend son visibles en el navegador**, sin excepción. Nunca pongas API keys de pago o secrets en variables `VITE_`.

---

## Paso 1 — Preparar el repositorio

### 1.1 Verificar que el proyecto buildea

```bash
npm run build
```

El resultado debe ser una carpeta `dist/` con los archivos estáticos. Si hay errores de TypeScript, arreglarlos antes de continuar.

### 1.2 Verificar las variables de entorno

En Vite, las variables de entorno del frontend **deben** empezar con `VITE_`:

```typescript
// ✅ Correcto — Vite expone esta variable al browser
const url = import.meta.env.VITE_SUPABASE_URL

// ❌ Incorrecto — process.env no existe en Vite
const url = process.env.SUPABASE_URL
```

Si tu código usa `process.env`, necesitas cambiar a `import.meta.env`.

### 1.3 Crear `.env.example`

```bash
# .env.example
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 1.4 Confirmar `.gitignore`

```bash
# Verificar que .env.local y .env.development están ignorados
cat .gitignore | grep env
```

Si no están, agregar:
```bash
echo ".env.local" >> .gitignore
echo ".env.development.local" >> .gitignore
git add .gitignore
git commit -m "chore: agregar .env al gitignore"
```

### 1.5 Crear la rama `develop`

```bash
git checkout -b develop
git push -u origin develop
```

---

## Paso 2 — Crear el proyecto en Supabase Cloud

1. Ir a [supabase.com](https://supabase.com) → iniciar sesión con GitHub
2. **New project** → completar nombre, contraseña y región
3. Esperar ~2 minutos
4. Ir a **Settings → API** y anotar:
   ```
   Project URL:  https://xxxxxxxxxxxx.supabase.co
   anon public:  eyJhbGci...
   ```

### 2.1 Aplicar el esquema

Ir a **SQL Editor** en el dashboard y ejecutar el SQL de creación de tablas de tu proyecto.

Si usas Supabase CLI:
```bash
npm install -g supabase
supabase db push --project-ref tu-project-ref
```

---

## Paso 3 — Configurar Vercel para una SPA

### 3.1 Crear el archivo `vercel.json`

Las SPA (Single Page Applications) hechas con Vite necesitan que Vercel redirija todas las rutas al `index.html`. Sin esto, al refrescar una página que no sea `/` aparece un 404.

Crear en la raíz del proyecto:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

```bash
git add vercel.json
git commit -m "chore: configurar rewrites para SPA en Vercel"
git push
```

### 3.2 Conectar el repositorio en Vercel

1. Ir a [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. **Add New → Project** → importar tu repositorio
3. Vercel debería detectar Vite automáticamente. Verificar que:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3.3 Agregar variables de entorno

Antes de hacer deploy, en la sección **Environment Variables**:

| Variable | Valor | Environments |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |

### 3.4 Deploy

Click en **Deploy** y esperar. Al terminar, abrir la URL y verificar que:
- La app carga en la ruta `/`
- Al navegar a otras rutas y refrescar, no aparece 404
- Los datos se cargan desde Supabase

---

## Paso 4 — Configurar los 3 entornos

### Entorno de Producción (ya configurado)
- Rama: `main`
- URL: `tu-proyecto.vercel.app`

### Entorno de Development

Para que la rama `develop` tenga su URL fija:

1. Vercel → tu proyecto → **Settings → Domains**
2. Agregar: `dev-tu-proyecto.vercel.app` → Branch: `develop`

Para usar una BD de desarrollo separada, crear un segundo proyecto en Supabase y configurar en Vercel:

- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores del proyecto dev
- Seleccionar solo el environment **"Preview"** para estas variables

---

## Paso 5 — Verificación final

Responder antes de la defensa:

1. ¿Por qué creaste el `vercel.json`? ¿Qué pasaría sin él?
2. ¿Qué diferencia hay entre `VITE_SUPABASE_URL` y una variable sin prefijo `VITE_`?
3. ¿Dónde se ejecuta el código de tu app — en el servidor de Vercel o en el navegador del usuario?
4. Si alguien inspecciona el código fuente de la página, ¿puede ver tu `ANON_KEY`? ¿Es eso un problema?
5. ¿Cómo revisas los logs si algo falla?

> La respuesta a la pregunta 4 es sí — y no necesariamente es un problema si configuraste correctamente las políticas RLS en Supabase. La `ANON_KEY` sola no da acceso a todo; RLS define qué puede hacer alguien con esa key.

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
- [x] npm run build funciona sin errores
- [x] vercel.json creado (rewrites para SPA)
- [x] Variables VITE_ configuradas en Vercel
- [x] App accesible desde URL pública
- [x] Navegación y refresh no dan 404
- [x] Datos se cargan desde Supabase cloud
- [x] Ramas main y develop en el repo
```

---

## Errores frecuentes y soluciones

**Al refrescar una ruta da 404**
Falta el `vercel.json` con los rewrites. Crearlo y volver a deployar.

**`import.meta.env.VITE_X` es `undefined` en producción**
La variable no está configurada en Vercel. Ir a Settings → Environment Variables y verificar. Recuerda que después de agregar variables hay que hacer un nuevo deploy.

**El build falla con errores de TypeScript que no tenías localmente**
Vercel corre `tsc --noEmit` como parte del build. Tu `tsconfig.json` local puede estar configurado de forma más permisiva. Revisar los errores en el build log de Vercel y corregirlos.

**Supabase no responde — CORS error**
Ir a Supabase → Settings → API → agregar la URL de tu proyecto de Vercel en "Additional allowed origins". Por defecto Supabase solo permite `localhost`.

**"Row Level Security policy violation"**
Tus tablas tienen RLS habilitado pero no tienes políticas configuradas. Ir a Supabase → Authentication → Policies y crear políticas de lectura/escritura para las tablas que uses.
