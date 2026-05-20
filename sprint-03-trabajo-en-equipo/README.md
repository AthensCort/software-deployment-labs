# Sprint 3 — "Que podamos trabajar en equipo sin pisarnos"

**Estado:** 🔄 EN DESARROLLO  
**Prerequisito:** Sprint 2 completado — dos entornos funcionando

---

## ¿Qué problema resuelve este sprint?

Dos personas modificaron el mismo archivo. Alguien subió algo a `main` sin que nadie lo revisara. Nadie sabe quién rompió qué ni cuándo. El historial de commits dice "fix", "arreglo", "cambios" — imposible rastrear nada.

El problema es que git está siendo usado como Dropbox: solo para sincronizar archivos, no como herramienta de colaboración.

---

## Lo que aprenderás

- Qué es un Pull Request y por qué es la unidad de trabajo en equipo
- Cómo proteger ramas para que nadie pueda romper producción solo
- Cómo escribir commits que comunican intención
- Qué es un code review y cómo hacerlo útil (no solo aprobar sin leer)

---

## Criterios de aprobación

- [ ] No es posible pushear directo a `main` — todo entra por PR
- [ ] Cada PR tiene al menos un reviewer antes de mergearse
- [ ] Los commits siguen un formato consistente (Conventional Commits)
- [ ] Pueden mostrar en el historial de GitHub cuándo y por qué llegó cada cambio a producción
- [ ] Pueden explicar qué es una branch protection rule y por qué existe

---

## Material del sprint

- [GUIDE.md](GUIDE.md) — Por qué existen los PRs, qué es un code review, el modelo de dueños de entorno
- [SETUP.md](SETUP.md) — Branch protection, roles del equipo, PR workflow, Conventional Commits, conflictos

---

## Para continuar en la próxima sesión

Deja en `DEPLOY_STATUS.md`:
- Branch protection rules activadas (sí/no)
- Link a un PR mergeado como evidencia

---

## Lo que viene en el Sprint 4

Una vez que el proceso es claro, el deploy manual se vuelve el cuello de botella. ¿Por qué hacer a mano algo que siempre es igual?
