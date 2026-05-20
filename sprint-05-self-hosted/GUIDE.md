# Guía conceptual — Infraestructura real: Docker, VPS y self-hosting

---

## El momento de desmitificación

Durante cuatro sprints usaste Vercel y Supabase cloud. Funcionaron. Fueron simples. Pero cada vez que algo falló, no pudiste hacer nada — solo esperar a que el servicio se recuperara o abrir un ticket de soporte.

Este sprint responde la pregunta que probablemente te hiciste en algún momento: **¿qué hay detrás de esos dashboards?**

La respuesta es más simple de lo que parece.

---

## Vercel es Nginx más un CDN

Cuando subes tu app a Vercel, lo que ocurre internamente es:

```
npm run build  →  genera carpeta dist/ con archivos estáticos
                        ↓
Vercel los distribuye en servidores alrededor del mundo (CDN)
                        ↓
Nginx en cada servidor responde las peticiones de los usuarios
```

Tu `vercel.json` con el rewrite de SPA era literalmente una instrucción de Nginx traducida a un formato más amigable:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Es exactamente esto en Nginx:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

En este sprint configuras Nginx directamente — sin intermediarios.

---

## Supabase cloud es este Docker Compose

Cuando creas un proyecto en supabase.com, en sus servidores están corriendo exactamente estos contenedores:

```
                         ┌─────────────────────────────────────┐
Tu app                   │         Supabase self-hosted         │
    │                    │                                      │
    │  HTTP              │  ┌───────┐  API Gateway              │
    └──────────────────► │  │ Kong  │ ◄── puerto 8000           │
                         │  └───┬───┘                           │
                         │      │  enruta según la ruta         │
                         │  ┌───┴────────────────────────────┐  │
                         │  │                                │  │
                         │  ▼              ▼            ▼    │  │
                         │ REST         GoTrue       Storage │  │
                         │ (PostgREST)  (Auth)       (Files) │  │
                         │  │              │                  │  │
                         │  └──────────────┘                  │  │
                         │         │                          │  │
                         │         ▼                          │  │
                         │    PostgreSQL ◄─── puerto 5432     │  │
                         │                                    │  │
                         │  ┌──────────┐                      │  │
                         │  │  Studio  │ ◄── puerto 3000      │  │
                         │  └──────────┘   (dashboard web)    │  │
                         └─────────────────────────────────────┘
```

Cuando en tu código escribes `supabase.from('tasks').select('*')`, la petición va:

```
cliente → Kong (puerto 8000) → PostgREST → PostgreSQL → respuesta
```

Cuando llamas a `supabase.auth.signIn()`:
```
cliente → Kong → GoTrue (maneja JWT, emails, OAuth) → PostgreSQL
```

El Studio que ves en supabase.com es exactamente el mismo que corre en `localhost:3000` cuando levantes tu propio Supabase.

---

## ¿Qué es Docker?

Docker es una herramienta que empaqueta un programa junto con todo lo que necesita para correr — sistema operativo, dependencias, configuración — en una unidad llamada **contenedor**.

La diferencia con instalar software normalmente:

```
Sin Docker:
  "En mi máquina funciona"
  → instalar en el servidor: versión incorrecta de Node, 
    librería que falta, configuración diferente → falla

Con Docker:
  La imagen contiene exactamente lo mismo que tu máquina
  → en cualquier servidor que tenga Docker, corre igual
```

### Conceptos en 3 líneas

**Imagen** — la receta. Define qué hay en el contenedor. Es estática, no cambia.
```bash
docker pull postgres:15    # descargar la imagen de PostgreSQL 15
```

**Contenedor** — una instancia corriendo de una imagen. Puede haber múltiples contenedores de la misma imagen.
```bash
docker run postgres:15     # crear y arrancar un contenedor de esa imagen
```

**Docker Compose** — un archivo YAML que describe múltiples contenedores que trabajan juntos.
```bash
docker compose up -d       # levantar todos los contenedores definidos en docker-compose.yml
```

### Los contenedores de Supabase y qué hace cada uno

```yaml
services:
  db:           # PostgreSQL — la base de datos real
  rest:         # PostgREST — convierte la BD en una API REST automáticamente
  auth:         # GoTrue — maneja autenticación, JWT, OAuth, emails
  realtime:     # Escucha cambios en la BD y los envía por WebSocket
  storage:      # Maneja archivos (imágenes, documentos, etc.)
  imgproxy:     # Redimensiona y transforma imágenes al vuelo
  studio:       # El dashboard web que ves en supabase.com
  kong:         # API Gateway — la puerta de entrada, enruta todo
  meta:         # API para gestionar el esquema de la BD
  functions:    # Edge Functions (serverless)
```

Cuando haces `docker compose ps` verás todos estos contenedores con su estado.

---

## ¿Por qué self-hosted si la nube es más fácil?

No es una decisión binaria. Son contextos distintos:

| Situación | Cloud | Self-hosted |
|-----------|-------|-------------|
| Prototipo / MVP | ✅ ideal | ❌ overhead innecesario |
| Proyecto de estudiantes | ✅ gratis + simple | ⚠️ para aprender |
| Startup con tracción | ✅ escala sola | ⚠️ evaluar costo |
| Datos sensibles / compliance | ⚠️ depende del contrato | ✅ control total |
| Costo a escala (millones de filas) | ❌ caro | ✅ mucho más barato |
| Equipo sin ops experience | ✅ tercerizan ops | ❌ necesitan saber Docker/Linux |

Para este sprint el objetivo no es convencerte de que self-hosted es siempre mejor — es que **entiendas lo que está pasando** cuando usas la nube, y que puedas operar infraestructura real si algún día lo necesitas.

---

## Volúmenes — cómo los datos sobreviven a los contenedores

Un contenedor es efímero — si lo eliminas, todo lo que había dentro desaparece. Pero la base de datos necesita persistir.

La solución son los **volúmenes Docker**: directorios del host montados dentro del contenedor:

```yaml
services:
  db:
    image: postgres:15
    volumes:
      - db_data:/var/lib/postgresql/data   # los datos van aquí
                                            # fuera del contenedor

volumes:
  db_data:   # Docker gestiona este directorio en el host
```

Si el contenedor de Postgres falla y se reinicia, los datos siguen ahí porque viven en el host, no en el contenedor.

```bash
# Ver los volúmenes que existen
docker volume ls

# Ver dónde están físicamente en el host
docker volume inspect supabase_db_data
```

---

## El ciclo de vida de un deploy en self-hosted

Comparando con lo que ya conoces:

```
Sprint 1-4 (cloud)                  Sprint 5 (self-hosted)
──────────────────                  ──────────────────────
push → Vercel build                 push → Actions build
     → Vercel CDN                        → scp archivos al VPS
                                         → Nginx sirve los archivos

push → Supabase cloud (ya corriendo)  docker compose ya corriendo en VPS
     → supabase db push (CLI)              → supabase db push --db-url VPS_URL
```

La lógica es la mismo — solo cambia quién controla la infraestructura.

---

## Qué pasa cuando algo falla en producción

En cloud:
```
Error en prod → revisar logs en Vercel/Supabase dashboard
             → si es un bug: hacer fix, abrir PR, merge, esperar deploy
             → si es infra: esperar que el proveedor lo arregle
```

En self-hosted:
```
Error en prod → revisar logs del contenedor: docker compose logs -f
             → si es un bug: hacer rollback del código (revert git + deploy anterior)
             → si es una migración: restore del backup + rollback del código
             → si es infra: reiniciar contenedor, revisar recursos del servidor
```

Más responsabilidad — pero también más control y más entendimiento.
