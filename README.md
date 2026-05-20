# Programa de Sprints — DevOps para Proyectos Finales

Cada sprint resuelve un problema concreto que vas a encontrar al trabajar en equipo con un proyecto real. No es teoría — es la secuencia natural de problemas y sus soluciones.

---

## Mapa de progresión

```
Sprint 1  →  "Que funcione en algún lado"          ✅ COMPLETO
Sprint 2  →  "Que no se rompa cuando yo no estoy"  ✅ COMPLETO
Sprint 3  →  "Que podamos trabajar sin pisarnos"   ✅ COMPLETO
Sprint 4  →  "Que llegar a prod sea predecible"    ✅ COMPLETO
Sprint 5  →  "Que podamos volver atrás si falla"   ✅ COMPLETO
```

---

## ¿Por qué este orden?

| Sprint | Lo que sientes | Lo que aprendes |
|--------|---------------|-----------------|
| 1 | "Nadie puede ver mi proyecto" | Variables de entorno, hosting, URL pública |
| 2 | "Rompí producción probando algo" | Entornos separados, rama develop |
| 3 | "No sé quién cambió qué" | PRs, code review, branch protection |
| 4 | "El deploy manual tiene pasos que se olvidan" | CI/CD, GitHub Actions |
| 5 | "Si Vercel falla, no sé qué hacer" | Self-hosted, Docker, rollback real |

---

## Sprint actual

### [Sprint 1 — Deploy básico](sprint-01-deploy-basico/README.md)

Elige tu path según tu stack:

| Stack | Guía |
|---|---|
| Next.js + Supabase | [Path A](sprint-01-deploy-basico/path-a-nextjs/GUIDE.md) |
| Vite + React + Supabase | [Path B](sprint-01-deploy-basico/path-b-vite-react/GUIDE.md) |
| Backend separado + LLM/APIs externas | [Path C](sprint-01-deploy-basico/path-c-backend-llm/GUIDE.md) |

---

## Próximos sprints (material en preparación)

- [Sprint 2](sprint-02-dos-entornos/README.md) — Dos entornos: dev y producción
- [Sprint 3](sprint-03-trabajo-en-equipo/README.md) — Flujo de trabajo en equipo con PRs
- [Sprint 4](sprint-04-cicd/README.md) — CI/CD con GitHub Actions
- [Sprint 5](sprint-05-self-hosted/README.md) — Supabase self-hosted y control total

El Sprint 5 usa como material base el [lab-00-base](../lab-00-base/STUDENT_GUIDE.md).
"# software-deployment-labs" 
