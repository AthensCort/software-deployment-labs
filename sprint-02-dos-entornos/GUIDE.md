# Guía conceptual — Entornos, ramas y migraciones

Antes de configurar nada, entender **por qué** existe cada pieza hace que la configuración tenga sentido en lugar de parecer pasos arbitrarios.

---

## ¿Qué es un entorno?

Un entorno es una instancia completa y aislada de tu aplicación. "Completa" significa que tiene su propio frontend, su propio backend y su propia base de datos.

```
Entorno DEV                    Entorno PROD
────────────────────           ────────────────────
URL: dev-miapp.vercel.app      URL: miapp.vercel.app
BD:  proyecto-dev.supabase.co  BD:  proyecto.supabase.co
Datos: falsos / de prueba      Datos: reales de usuarios
```

La separación de base de datos es la parte crítica. Sin ella, experimentar en "dev" significa experimentar con los datos reales de tus usuarios.

---

## ¿Por qué las ramas y los entornos van juntos?

Vercel conecta ramas de git con entornos de forma automática:

```
git push origin main     →  deploy a producción
git push origin develop  →  deploy a desarrollo
git push origin feature/x →  deploy efímero (URL temporal, solo para ese PR)
```

Esto significa que el entorno que ven tus usuarios es exactamente lo que está en `main`. Si quieres cambiar algo en producción, tienes que cambiar `main`.

La pregunta que define toda tu estrategia de entornos es:

> **¿Quién tiene permiso de cambiar `main`?**

En este sprint la respuesta es: cualquiera puede hacerlo directamente. En el Sprint 3, la respuesta cambiará a: nadie puede tocarlo directamente, todo pasa por revisión.

---

## El modelo mental de los entornos

Piensa en los entornos como carriles paralelos que avanzan al mismo tiempo:

```
develop  ──●──●──●──●──────────────────────────────►
                    │ merge
main     ───────────●──────────────────────────────►
                    ↑
              este punto es cuando
              producción se actualiza
```

Cada círculo en `develop` es un conjunto de cambios que estás probando. Cuando estás seguro de que funciona, mergeas a `main` y esos cambios llegan a producción.

---

## Qué pasa con la base de datos en este modelo

El código vive en git y se puede mover entre ramas fácilmente. La base de datos **no**. Una vez que aplicas una migración, los datos existen. No hay un `git checkout` para la base de datos.

Esto crea una asimetría:

```
Código:   main ← develop ← feature  (fluye hacia atrás fácilmente)
BD:       se mueve hacia adelante con migraciones, no hacia atrás
```

Por eso el orden de operaciones importa tanto:

```
❌ Mal orden:
   1. Subir código nuevo (que usa columna X)
   2. Aplicar migración (que crea columna X)
   → La app falla entre los pasos 1 y 2

✅ Buen orden:
   1. Aplicar migración en DEV (crear columna X en la BD de dev)
   2. Probar que el código funciona en DEV
   3. Aplicar migración en PROD
   4. Subir código nuevo a PROD (via merge a main)
   → La app nunca ve un estado inconsistente
```

---

## Tipos de cambios y cómo manejarlos

No todos los cambios de base de datos son iguales. Hay tres categorías:

### Cambios aditivos (los más seguros)

Agregar una tabla, agregar una columna con valor por defecto, agregar un índice.

```sql
-- Seguro: si el código viejo no usa la columna nueva, simplemente la ignora
alter table tasks add column if not exists tags text[] default '{}';
```

Puedes aplicar la migración en producción antes de subir el código. Cero riesgo.

### Cambios que renombran o eliminan (peligrosos)

Renombrar una columna, eliminar una tabla, cambiar un tipo de dato.

```sql
-- Peligroso: el código viejo todavía referencia 'description'
alter table tasks rename column description to summary;
```

El código viejo fallará en el momento en que se aplique la migración. La estrategia correcta:

```
1. Agregar la columna nueva ('summary') sin borrar la vieja ('description')
2. Actualizar el código para usar 'summary'
3. Deploy del código nuevo
4. Borrar la columna vieja en una migración posterior
```

### Cambios de datos (los que más asustan)

Actualizar valores existentes, transformar datos, backfills.

```sql
-- Riesgoso en tablas grandes: puede tardar mucho y bloquear la tabla
update tasks set priority = 'media' where priority is null;
```

Para el nivel de este curso, ejecutar este tipo de cambios en horarios de bajo tráfico y con el equipo avisado.

---

## La regla de las migraciones

Todo cambio al esquema de base de datos:
1. Se escribe como un archivo `.sql` en `supabase/migrations/`
2. Se commitea junto con el código que lo necesita
3. Se aplica a DEV primero, luego a PROD

Nunca modificar el esquema desde el dashboard de Supabase sin crear la migración correspondiente. Si lo haces, tu base de datos local (o la de tus compañeros) quedará desincronizada.

---

## Preguntas frecuentes de este sprint

**¿Puedo tener los mismos datos en DEV y PROD para probar?**

No es recomendable. DEV debería tener datos falsos que puedas borrar y recrear sin consecuencias. Si necesitas datos reales para probar algo específico, copia solo los datos necesarios (sin información personal).

**¿Qué pasa si aplicé una migración en PROD pero no en DEV?**

Tu entorno de desarrollo queda desfasado. La forma de resincronizar:
```bash
supabase link --project-ref REF_DEV
supabase db push  # aplica las migraciones que faltan
```

**¿El proyecto gratuito de Supabase tiene limitaciones que afectan el dev?**

El tier gratuito pausa el proyecto después de 1 semana de inactividad. Esto es normal en DEV — al acceder de nuevo, Supabase lo reactiva en ~1 minuto. Si te molesta, mantener el proyecto activo con un ping periódico o aceptarlo como parte del flujo de trabajo de dev.

**¿Necesito aplicar las migraciones manualmente cada vez que hay una nueva?**

En este sprint: sí. En el Sprint 4 (CI/CD), el pipeline lo hace automáticamente cuando se mergea a cada rama. Por ahora el proceso manual es:
```bash
git pull                          # obtener las migraciones nuevas
supabase link --project-ref REF   # vincular al entorno correcto
supabase db push                  # aplicar lo que falta
```
