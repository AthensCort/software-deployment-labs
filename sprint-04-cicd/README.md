# Sprint 4 — "Que llegar a producción sea predecible"

**Estado:** 🔄 EN DESARROLLO  
**Prerequisito:** Sprint 3 completado — flujo de PRs establecido

---

## ¿Qué problema resuelve este sprint?

El deploy es un proceso manual con pasos que se olvidan. Cada miembro del equipo lo hace diferente. A veces alguien sube sin correr los tests. A veces se olvidan de aplicar las migraciones. A veces el build local funcionaba pero en el servidor falla por una variable de entorno que se olvidó configurar.

El problema es que el proceso de deploy vive en la cabeza de las personas, no en el código.

---

## Lo que aprenderás

- Qué es CI/CD y qué problema resuelve concretamente
- Cómo escribir un workflow de GitHub Actions
- Qué son los stages de un pipeline: lint → test → build → deploy
- Por qué "si los tests pasan, puede ir a producción" es una decisión de arquitectura
- Qué es un entorno de staging y por qué existe entre dev y prod

---

## Criterios de aprobación

- [ ] Nadie deploya manualmente — un push a la rama correcta lo hace todo
- [ ] El pipeline corre tests antes de deployar
- [ ] Si los tests fallan, el deploy no ocurre
- [ ] Tienen 3 entornos: dev, staging, producción
- [ ] Pueden explicar cada step de su workflow de GitHub Actions

---

## Material del sprint

- [GUIDE.md](GUIDE.md) — Qué es CI/CD, anatomía de un pipeline, por qué automatizar
- [SETUP.md](SETUP.md) — Crear entorno staging, configurar secrets, conectar Vercel y Supabase CLI con Actions
- [workflows/](workflows/) — Templates de workflows listos para copiar al proyecto

---

## Para continuar en la próxima sesión

Deja en `DEPLOY_STATUS.md`:
- Link al último Action run exitoso
- Screenshot o link del pipeline completo

---

## Lo que viene en el Sprint 5

Con CI/CD funcionando y 3 entornos, el siguiente nivel es entender qué hay detrás de los servicios cloud que están usando — y tener control real sobre la infraestructura.
