# Guía conceptual — CI/CD y GitHub Actions

---

## ¿Qué problema tiene el proceso manual?

Al final del Sprint 3 el flujo de trabajo se ve así:

```
1. Hacer PR y que lo aprueben          ✅ automatizado (branch protection)
2. Mergear a develop                   ✅ controlado
3. Ir a Vercel y verificar el deploy   😐 manual
4. Conectarse a Supabase y aplicar     😐 manual (¡y se olvida!)
   las migraciones pendientes
5. Probar en la URL de develop         😐 manual
6. Repeat para staging y producción    😐 manual x3
```

El problema no es que sea mucho trabajo — es que el proceso vive en la cabeza de las personas. Cuando alguien se olvida de aplicar las migraciones antes de deployar, la app falla en producción. Cuando alguien hace el deploy pero no corre los tests, un bug llega a los usuarios.

CI/CD convierte ese proceso implícito en código explícito que se ejecuta igual cada vez.

---

## Qué significa CI/CD

**CI — Continuous Integration (Integración Continua)**

Cada vez que alguien pushea código, un sistema automatizado verifica que ese código no rompe nada:

```
git push → ejecutar tests → ejecutar lint → verificar que buildea
```

Si algo falla, el push es rechazado (o marcado como fallido) antes de llegar a producción.

**CD — Continuous Delivery / Deployment (Entrega/Despliegue Continuo)**

Si el CI pasa, el código se despliega automáticamente al entorno correspondiente:

```
tests pasan → migraciones aplicadas → build creado → deploy ejecutado
```

Juntos garantizan que **lo que está en producción siempre pasó por el mismo proceso**, sin importar quién hizo el cambio ni a qué hora.

---

## Anatomía de un pipeline de GitHub Actions

Un pipeline en GitHub Actions es un archivo YAML en `.github/workflows/`. Tiene esta estructura:

```yaml
name: Nombre del workflow         # nombre visible en GitHub

on:                               # TRIGGER: cuándo ejecutarse
  push:
    branches: [develop]           # al pushear a esta rama

jobs:                             # JOBS: grupos de pasos que pueden correr en paralelo
  test:                           # nombre del job
    runs-on: ubuntu-latest        # máquina donde corre

    steps:                        # STEPS: pasos secuenciales dentro del job
      - uses: actions/checkout@v4             # clonar el repo
      - uses: actions/setup-node@v4           # instalar Node
        with:
          node-version: 20
      - run: npm ci                           # instalar dependencias
      - run: npm test                         # correr tests
```

### Los tres conceptos clave

**Trigger (`on:`)** — Qué evento dispara el workflow. Los más comunes:
```yaml
on:
  push:
    branches: [main, develop, staging]   # push a estas ramas
  pull_request:
    branches: [main, develop]            # PR que apunta a estas ramas
```

**Jobs** — Unidades de trabajo que pueden correr en paralelo o en secuencia:
```yaml
jobs:
  test:      # corre primero
    ...
  deploy:
    needs: test   # espera a que 'test' termine antes de empezar
    ...
```

**Steps** — Pasos dentro de un job. Dos tipos:
```yaml
steps:
  - uses: actions/checkout@v4   # action de la marketplace (código reutilizable)
  - run: npm test               # comando de shell directo
```

---

## El pipeline de este sprint

Cada rama tiene su propio pipeline con responsabilidades distintas:

```
feature/* → PR abierto
              └─► pipeline de PR: tests + lint (no deploya)

develop   → merge exitoso
              └─► pipeline DEV: tests → migraciones DEV → deploy a dev URL

staging   → merge desde develop
              └─► pipeline STAGING: tests + lint → migraciones STAGING → deploy staging URL

main      → aprobación manual requerida
              └─► pipeline PROD: tests + lint → migraciones PROD → deploy prod URL → tag release
```

---

## Secrets — credenciales seguras en el pipeline

Los pipelines necesitan acceder a Vercel, Supabase y otros servicios. Las credenciales no pueden ir en el código — van en **GitHub Secrets**.

```
Repositorio → Settings → Secrets and variables → Actions
```

Los secrets se inyectan como variables de entorno en el workflow:

```yaml
steps:
  - run: supabase db push --db-url "${{ secrets.DEV_DB_URL }}"
  - run: vercel deploy --token "${{ secrets.VERCEL_TOKEN }}"
```

Nadie puede leer el valor de un secret después de crearlo — ni los admins del repo. GitHub los enmascara en los logs con `***`.

**Tipos de secrets que usarán:**

| Secret | Qué es | Dónde obtenerlo |
|--------|--------|-----------------|
| `VERCEL_TOKEN` | Token de autenticación de Vercel | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | ID de la organización en Vercel | `.vercel/project.json` tras `vercel link` |
| `VERCEL_PROJECT_ID` | ID del proyecto en Vercel | `.vercel/project.json` tras `vercel link` |
| `DEV_DB_URL` | URL de conexión directa a la BD dev | Supabase → Settings → Database → Connection string |
| `STAGING_DB_URL` | URL de conexión directa a la BD staging | Igual |
| `PROD_DB_URL` | URL de conexión directa a la BD prod | Igual |

---

## GitHub Environments — aprobación manual para producción

GitHub permite crear "environments" con reglas de protección. Para producción:

```
Settings → Environments → New environment → "production"
  ✅ Required reviewers: [dueño de main]
  ✅ Wait timer: 0 minutos (o más si quieren un período de reflexión)
```

Cuando el pipeline llega a un job que usa `environment: production`, GitHub pausa y espera la aprobación del reviewer antes de continuar.

```yaml
jobs:
  deploy:
    environment: production   # ← pausa aquí y espera aprobación
    steps:
      - run: vercel deploy --prod
```

Esto significa que incluso si alguien mergea a `main` accidentalmente, el deploy a producción no ocurre sin una segunda persona que lo apruebe explícitamente.

---

## La adición de staging

En este sprint agregan un tercer entorno: **staging**. ¿Para qué sirve si ya tienen dev?

```
DEV     → donde los desarrolladores prueban cambios individuales
          datos falsos, puede estar roto, acceso solo del equipo

STAGING → donde se valida el sistema completo antes de producción
          datos lo más parecidos posible a prod, siempre estable
          puede ser usado por el profesor/cliente para revisar

PROD    → lo que ven los usuarios reales
          nunca debe estar roto
```

La diferencia clave: **dev puede estar roto en cualquier momento** — es donde se experimenta. **Staging nunca debería estar roto** — es la última verificación antes de que algo llegue a usuarios reales.

El flujo de ahora en adelante:

```
feature/* → develop (DEV) → staging (STAGING) → main (PROD)
```

---

## Por qué el orden importa: migraciones en el pipeline

En Sprint 2 aprendiste que las migraciones van antes del código. El pipeline lo hace cumplir automáticamente:

```yaml
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - run: supabase db push --db-url "${{ secrets.PROD_DB_URL }}"

  deploy:
    needs: migrate    # ← deploy NO corre si migrate falla
    steps:
      - run: vercel deploy --prod
```

Si la migración falla (SQL con error, conflicto de esquema, etc.), el deploy nunca ocurre. La base de datos y el código siempre están sincronizados.

---

## Lo que cambia respecto al Sprint 3

| Antes (Sprint 3) | Después (Sprint 4) |
|---|---|
| Vercel auto-deploya al mergear | Actions controla cuándo y cómo se deploya |
| Migraciones aplicadas manualmente | Migraciones aplicadas automáticamente en el pipeline |
| 2 entornos (dev, prod) | 3 entornos (dev, staging, prod) |
| Deploy inmediato al mergear a main | Deploy a prod requiere aprobación manual |
| Sin verificación automática de código | Tests y lint corren en cada PR |
