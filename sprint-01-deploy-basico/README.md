# Sprint 1 — "Que funcione en algún lado"

**Estado:** 🔄 EN DESARROLLO  
**Semana:** 14–21 Abril 2026  
**Evaluación:** Mini defensa técnica individual (6 minutos)

---

## ¿Qué problema resuelve este sprint?

El proyecto funciona en tu laptop pero nadie más puede verlo. La app vive en `localhost` — eso no es un producto, es un archivo. En este sprint el objetivo es uno solo: **obtener una URL pública que cualquiera pueda abrir**.

No importa si el setup no es perfecto. No importa si la arquitectura no es la ideal. Lo que importa es tener algo funcionando afuera de tu máquina y entender exactamente qué fue necesario para lograrlo.

---

## Lo que aprenderás sin darte cuenta

- Por qué `localhost` y producción son ambientes diferentes
- Qué son las variables de entorno y por qué no se commitean al repo
- Qué hace un hosting de frontend vs un hosting de backend
- Qué significa que una app esté "desplegada"

---

## Criterios de aprobación (lo mínimo para pasar este sprint)

- [ ] La aplicación abre desde una URL pública (no `localhost`)
- [ ] Los datos persisten (la base de datos no es local)
- [ ] Las credenciales y API keys NO están hardcodeadas en el código
- [ ] El repositorio tiene al menos las ramas `main` y `develop`
- [ ] Puedes explicar qué servicio aloja cada parte de tu app y por qué

---

## Elige tu path según tu stack

| Tu proyecto usa... | Sigue el path |
|---|---|
| Next.js (con o sin API routes) + Supabase | [Path A](path-a-nextjs/GUIDE.md) |
| Vite + React + Supabase como backend | [Path B](path-b-vite-react/GUIDE.md) |
| Backend separado (Node/Python/FastAPI) y/o APIs de LLM | [Path C](path-c-backend-llm/GUIDE.md) |

> Si tu proyecto combina elementos de varios paths, empieza por el que describe mejor tu backend.

---

## Servicios que vas a usar (todos tienen tier gratuito)

| Servicio | Para qué | Free tier |
|---|---|---|
| [Vercel](https://vercel.com) | Frontend (Next.js / Vite) | Ilimitado para hobby |
| [Supabase](https://supabase.com) | Base de datos + Auth + Storage | 2 proyectos gratuitos |
| [Railway](https://railway.app) | Backend separado (Node/Python) | $5 crédito/mes |
| [Render](https://render.com) | Alternativa a Railway | 750 horas/mes gratis |

---

## Errores más comunes en este sprint

**"La app despliega pero no carga datos"**
→ Las variables de entorno no están configuradas en el servicio de hosting. No basta con tenerlas en `.env` local.

**"Funciona en dev pero falla en producción"**
→ Probablemente hay una URL hardcodeada a `localhost` en algún lado del código.

**"Supabase me pide confirmación de email y no llega nada"**
→ En proyectos de prueba deshabilitar la confirmación de email: Supabase Dashboard → Authentication → Settings → desactivar "Enable email confirmations".

**"El build de Vercel falla"**
→ Revisar que `npm run build` funciona localmente primero. Los errores de TypeScript que ignoras en dev son errores reales en el build de producción.

---

## Para continuar en la próxima sesión

Si no terminaste este sprint, deja documentado en tu repo:

1. **Un archivo `DEPLOY_STATUS.md`** en la raíz con:
   ```
   ## Estado del deploy
   - [ ] Vercel conectado al repo
   - [ ] Variables de entorno configuradas
   - [ ] Supabase proyecto creado
   - [ ] URL pública funcionando
   
   ## Bloqueantes actuales
   (describe aquí qué está fallando y el mensaje de error exacto)
   
   ## Próximos pasos
   (qué te falta hacer)
   ```

2. **El último error que encontraste** copiado textualmente. No "no funciona" — el mensaje exacto de la consola o del log de Vercel.

---

## Lo que viene en el Sprint 2

Una vez que tienes la app funcionando en producción, aparece el primer problema real: ¿cómo pruebas cambios sin arriesgar lo que ya funciona? Ahí nace la necesidad de tener **más de un entorno**.
