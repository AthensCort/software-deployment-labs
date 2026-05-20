# Sprint 2 — "Que no se rompa cuando yo no estoy"

**Estado:** 🔄 EN DESARROLLO  
**Prerequisito:** Sprint 1 completado — app con URL pública funcionando

---

## ¿Qué problema resuelve este sprint?

Mergearon algo que rompió producción. O alguien pushó directo a `main` mientras otra persona estaba trabajando. O la profesora entró a revisar justo cuando estaban haciendo cambios y la app estaba caída.

El problema es que tienen **un solo entorno** y ese entorno es el que ven todos. Cualquier cambio es inmediatamente visible — incluyendo los que están rotos.

La solución es separar "donde experimentamos" de "donde vive lo que ya funciona".

---

## Lo que aprenderás

- Qué es un entorno (environment) y para qué sirve cada uno
- Cómo tener una base de datos de prueba separada de la de producción
- Por qué `main` debería ser siempre deployable
- El flujo básico: desarrollas en `develop`, validas, luego subes a `main`

---

## Criterios de aprobación

- [ ] Tienen dos entornos separados: **desarrollo** y **producción**
- [ ] Cada entorno tiene su propia instancia de Supabase (datos separados)
- [ ] Los cambios pasan por desarrollo antes de llegar a producción
- [ ] `main` siempre tiene una versión funcional de la app
- [ ] Pueden explicar qué pasa si alguien pushea directo a `main`

---

## Material del sprint

- [SETUP.md](SETUP.md) — Guía paso a paso: segundo Supabase, ramas, Vercel multi-entorno
- [GUIDE.md](GUIDE.md) — Concepto de entornos, flujo de trabajo y migraciones en múltiples entornos

---

## Para continuar en la próxima sesión

Deja en `DEPLOY_STATUS.md`:
- Qué entornos tienes configurados y sus URLs
- Qué está bloqueando si no terminaste

---

## Lo que viene en el Sprint 3

Con dos entornos, el siguiente problema aparece cuando trabajan en equipo: ¿quién tiene permiso de subir a producción? ¿Cómo revisan el trabajo del otro antes de mergearlo?
