# Setup Sprint 3 — Trabajo en equipo sin pisarse

**Prerequisito:** Sprint 2 completado — tienes ramas `main` y `develop` con entornos separados.

Este sprint no toca código de la aplicación. Todo el trabajo es en GitHub y en la disciplina del equipo.

---

## Paso 0 — Asignar roles antes de configurar nada

Antes de tocar GitHub, el equipo define en voz alta quién es responsable de qué. Escribirlo en el README del proyecto.

Para un equipo de 5:

| Miembro | Rol | Responsabilidad |
|---------|-----|-----------------|
| (nombre) | Dueño de `main` / Producción | Revisa PR develop→main, última palabra sobre prod |
| (nombre) | Dueño de `develop` / DEV | Revisa PRs de features, mantiene develop estable |
| (resto) | Feature developers | Trabajan en feature branches, abren PRs a develop |

> El dueño de `main` suele ser quien más conoce el sistema completo. El dueño de `develop` suele ser quien más activo esté en el sprint actual. Estos roles pueden rotar entre sprints.

Agregar esto al README del proyecto:

```markdown
## Responsables de entornos

| Entorno | Rama | Responsable | URL |
|---------|------|-------------|-----|
| Producción | `main` | @usuario | https://... |
| Desarrollo | `develop` | @usuario | https://... |
```

---

## Paso 1 — Configurar Branch Protection Rules

Las branch protection rules hacen que sea **imposible** pushear directo a las ramas protegidas. Todo tiene que entrar por PR.

### 1.1 Proteger `main`

1. GitHub → tu repositorio → **Settings → Branches**
2. **Add branch protection rule**
3. **Branch name pattern:** `main`
4. Activar las siguientes opciones:

```
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
   (dejar vacío por ahora — en Sprint 4 agregaremos los checks de CI)

✅ Require branches to be up to date before merging

✅ Do not allow bypassing the above settings
   (esto incluye a los admins — nadie se salta el proceso)
```

5. **Create** (o **Save changes**)

### 1.2 Proteger `develop`

Repetir el proceso para `develop` con configuración ligeramente más permisiva:

```
✅ Require a pull request before merging
   ✅ Require approvals: 1

❌ Do not allow bypassing  
   (el dueño de develop puede hacer push directo si es urgente)
```

### 1.3 Verificar que funciona

```bash
# Intentar pushear directo a main — debe fallar
git checkout main
echo "test" >> README.md
git add . && git commit -m "test"
git push origin main
# → error: GH006: Protected branch update failed
```

Si aparece ese error, la protección está funcionando. Revertir el commit local:
```bash
git reset HEAD~1
git checkout README.md
git checkout develop
```

---

## Paso 2 — Configurar notificaciones de review

Para que el dueño de cada rama sea notificado automáticamente cuando llega un PR:

### 2.1 Crear un archivo CODEOWNERS

En la raíz del repositorio crear `.github/CODEOWNERS`:

```
# Formato: patrón  @usuario-github

# El dueño de main es reviewer requerido para cualquier cambio
*  @usuario-dueño-de-main

# Si quieren asignar reviewers por carpeta:
# /frontend/  @usuario-frontend
# /backend/   @usuario-backend
# /supabase/migrations/  @usuario-dueño-de-main @usuario-dueño-de-develop
```

```bash
mkdir -p .github
# Crear el archivo con los usuarios reales del equipo
nano .github/CODEOWNERS

git add .github/CODEOWNERS
git commit -m "chore: agregar CODEOWNERS para reviews automáticos"
git push origin develop
```

### 2.2 Actualizar la branch protection para requerir CODEOWNERS

En la branch protection de `main`:
```
✅ Require review from Code Owners
```

Ahora el dueño de `main` es automáticamente asignado como reviewer en cualquier PR que toque esa rama.

---

## Paso 3 — El flujo de trabajo desde hoy

### 3.1 Siempre partir de develop actualizado

```bash
git checkout develop
git pull origin develop
```

Nunca crear una feature branch desde una rama desactualizada. Los conflictos que aparecen más adelante casi siempre vienen de este error.

### 3.2 Crear la rama con nombre descriptivo

```bash
# Formato recomendado: tipo/descripcion-corta
git checkout -b feat/agregar-filtro-categoria
git checkout -b fix/error-eliminacion-caracteres-especiales
git checkout -b chore/actualizar-dependencias
```

El nombre de la rama debería decir qué hace, no quién lo hizo:
```
✅ feat/perfil-de-usuario
✅ fix/login-con-google
❌ ana-cambios
❌ nueva-cosa
❌ v2
```

### 3.3 Commits con Conventional Commits

```bash
git commit -m "feat: agregar campo de descripción en formulario de tareas"
git commit -m "fix: validar que el título no esté vacío antes de guardar"
git commit -m "chore: actualizar @supabase/supabase-js a v2.40"
git commit -m "docs: documentar variables de entorno requeridas"
```

**Tipos más comunes:**

| Tipo | Cuándo usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad visible para el usuario |
| `fix` | Corrección de un bug |
| `chore` | Tareas de mantenimiento, dependencias, config |
| `docs` | Cambios en documentación |
| `refactor` | Cambios de código que no agregan features ni corrigen bugs |
| `style` | Formato, espacios, punto y coma (sin cambios de lógica) |
| `test` | Agregar o corregir tests |

### 3.4 Abrir el Pull Request

1. Subir la rama:
```bash
git push origin feat/agregar-filtro-categoria
```

2. GitHub muestra un banner: **"Compare & pull request"** → hacer click

3. Completar la descripción del PR. Usar esta plantilla:

```markdown
## ¿Qué hace este PR?
Agrega un dropdown para filtrar tareas por categoría en la vista principal.

## ¿Por qué?
Los usuarios con muchas tareas no podían encontrar las de una categoría específica.
Issue relacionado: #12

## ¿Cómo probarlo?
1. Ir a la URL de develop después del merge
2. Crear tareas con distintas categorías
3. Usar el dropdown "Filtrar por" y verificar que solo aparecen las de esa categoría

## ¿Hay migraciones de base de datos?
No / Sí — `supabase/migrations/20240201_add_category_index.sql`

## Checklist
- [ ] Probé en local que funciona
- [ ] El build no tiene errores (`npm run build`)
- [ ] Las variables de entorno necesarias están documentadas
```

4. Asignar como reviewer al dueño de `develop`
5. **Create pull request**

---

## Paso 4 — Cómo hacer un code review

### El reviewer (dueño de develop)

**Lo que debes verificar:**

```
Funcionalidad
├── ¿El cambio hace lo que dice que hace?
├── ¿Hay casos extremos no considerados? (array vacío, null, usuario no autenticado)
└── ¿Se puede probar lo que describe la descripción del PR?

Código
├── ¿Es legible? ¿Entenderías esto en 6 meses sin contexto?
├── ¿Hay lógica duplicada que ya existe en otra parte?
└── ¿Hay algo que podría fallar en producción que no falla en dev?

Base de datos (si hay migraciones)
├── ¿La migración es aditiva o puede romper datos existentes?
├── ¿El nombre de las columnas/tablas es consistente con el resto?
└── ¿Tiene las políticas RLS correctas?
```

**Cómo dejar comentarios en GitHub:**

- Click en el número de línea para comentar una línea específica
- Usar **"Start a review"** en lugar de comentar uno a uno (así el autor recibe una sola notificación con todos los comentarios)
- Al terminar: **"Review changes"** → elegir:
  - **Approve** — todo está bien, listo para mergear
  - **Request changes** — hay cambios necesarios antes de mergear
  - **Comment** — observaciones sin bloquear el merge

### El autor (quien hizo el PR)

Cuando el reviewer pide cambios:
1. Hacer los cambios en la misma rama
2. Nuevo commit (no modificar los commits anteriores — el reviewer ya los vio)
3. `git push` — el PR se actualiza automáticamente
4. Responder los comentarios del reviewer explicando qué cambiaste
5. **Re-request review** para notificar que está listo

---

## Paso 5 — Mergear y promover a producción

### 5.1 Merge de feature → develop

Una vez aprobado, el dueño de develop hace click en **Merge pull request**.

Tipo de merge recomendado: **Squash and merge** para features pequeñas (condensa todos los commits en uno limpio), **Merge commit** para features grandes (preserva el historial detallado).

### 5.2 PR de develop → main (promover a producción)

Cuando hay un conjunto de features validadas en develop y el equipo está listo para llevarlo a producción:

1. El dueño de develop abre el PR:
   - Base: `main` / Compare: `develop`
   - Título: `release: sprint X — descripción de qué incluye`
   - Descripción: lista de los PRs que incluye este release

2. El dueño de `main` revisa y aprueba

3. Merge → deploy automático (cuando esté configurado el CI/CD en Sprint 4; por ahora es manual)

---

## Paso 6 — Resolver conflictos de merge

Un conflicto ocurre cuando dos personas modificaron la misma línea del mismo archivo en ramas distintas. Git no puede decidir cuál versión es la correcta.

```bash
# Al intentar mergear aparece:
# CONFLICT (content): Merge conflict in src/App.tsx
# Automatic merge failed; fix conflicts and then commit the result.
```

### Cómo resolverlo

```bash
# Ver qué archivos tienen conflicto
git status
# → modified: src/App.tsx (con marker de conflicto)
```

Abrir el archivo. Git marca el conflicto así:

```typescript
<<<<<<< HEAD (tu rama)
const title = "Mis Tareas"
=======
const title = "Lista de Tareas"
>>>>>>> develop
```

Editar el archivo para quedarte con la versión correcta (o combinar ambas):

```typescript
// Resultado después de resolver:
const title = "Lista de Tareas"
```

```bash
# Marcar como resuelto y continuar
git add src/App.tsx
git commit -m "chore: resolver conflicto en título de la app"
git push
```

### Cómo evitar conflictos frecuentes

```bash
# Hacer pull de develop regularmente mientras trabajas en tu feature
git fetch origin
git rebase origin/develop
# Rebase integra los cambios de develop en tu rama de forma lineal
```

Regla: cuanto más tiempo pasa una feature branch sin integrarse, más probable es el conflicto. PRs pequeños y frecuentes generan menos conflictos que PRs grandes y tardíos.

---

## Checklist de entrega

```
DEPLOY_STATUS.md — actualizar con:

## Branch protection
- [ ] main: requiere PR + 1 aprobación configurado
- [ ] develop: requiere PR + 1 aprobación configurado
- [ ] Verificado: push directo a main falla con error GH006

## Roles del equipo
- Dueño de main:    @_____________
- Dueño de develop: @_____________

## Evidencia de flujo de PR
- [ ] Al menos 1 PR mergeado a develop con review aprobado
      Link: https://github.com/.../pull/...
- [ ] Al menos 1 PR de develop → main
      Link: https://github.com/.../pull/...

## Conventional Commits
- [ ] Los últimos 5 commits del repo siguen el formato
      (verificar con: git log --oneline -5)

## Para continuar
(si no terminaste, describir qué falta)
```
