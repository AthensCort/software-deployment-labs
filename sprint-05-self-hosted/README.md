# Sprint 5 — "Que podamos volver atrás si algo falla"

**Estado:** 🔄 EN DESARROLLO  
**Prerequisito:** Sprint 4 completado — pipeline CI/CD funcionando

---

## ¿Qué problema resuelve este sprint?

Vercel y Supabase cloud abstraen toda la infraestructura. Eso es cómodo, pero significa que cuando algo falla no saben dónde mirar, no pueden cambiarlo y dependen de que otra empresa solucione el problema.

Además: ¿qué pasa si una migración de base de datos rompe algo en producción? ¿Cómo vuelven atrás? ¿Quién tiene el backup?

Este sprint responde esas preguntas poniendo en sus manos el control real de la infraestructura.

---

## Lo que aprenderás

- Qué hay detrás de Vercel y Supabase cloud (Nginx, Docker, PostgreSQL)
- Cómo levantar Supabase self-hosted con Docker Compose
- Qué son las migraciones de base de datos y por qué son código
- Cómo hacer un backup y cómo hacer un rollback
- Por qué "infraestructura como código" importa

---

## Criterios de aprobación

- [ ] Supabase self-hosted corriendo en un VPS propio
- [ ] Nginx configurado como reverse proxy
- [ ] Todas las DDL están como archivos de migración versionados en git
- [ ] El pipeline hace un backup automático antes de cada deploy a producción
- [ ] Pueden ejecutar un rollback completo (código + base de datos) en menos de 10 minutos
- [ ] Pueden explicar qué hace cada contenedor de Docker en su stack

---

## Material del sprint

- [GUIDE.md](GUIDE.md) — Qué hay detrás de Vercel y Supabase cloud, Docker explicado desde cero, el mapa completo de contenedores
- [SETUP.md](SETUP.md) — Migrar el proyecto actual a self-hosted: VPS, Supabase Docker, Nginx, datos, CI/CD actualizado
- [scripts/](scripts/) — Scripts operativos: backup, restore y rollback listos para usar
- [workflows/](workflows/) — CI/CD actualizado para deployar al VPS en lugar de Vercel
- [lab-00-base](../../lab-00-base/STUDENT_GUIDE.md) — Guía de referencia completa del lab original

---

## Para continuar en la próxima sesión

Deja en `DEPLOY_STATUS.md`:
- IP/dominio del VPS y estado de los contenedores (`docker compose ps`)
- Lista de migraciones aplicadas
- Fecha y ubicación del último backup

---

## Este es el sprint final

Aquí es donde el sistema que viste en el Sprint 1 (Vercel hace todo por ti) y el sistema que construiste en el Sprint 5 (tú controlas todo) se conectan. Ahora entiendes exactamente qué estaba pasando detrás de cada clic en un dashboard.
