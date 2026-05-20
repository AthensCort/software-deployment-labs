# Guía conceptual — Pull Requests, code review y dueños de entorno

---

## El problema que tiene todo equipo sin este sprint

Cuando un equipo trabaja sin ninguna estructura de revisión, el historial de git termina pareciendo esto:

```
* arreglo (hace 2 horas) — Carlos
* cambios (hace 3 horas) — Ana
* fix (hace 5 horas) — Carlos
* subiendo (hace 1 día) — Luis
* ahora sí (hace 1 día) — Ana
* FINAL DEFINITIVO (hace 2 días) — Luis
```

Nadie puede responder:
- ¿Qué cambió en cada commit?
- ¿Alguien revisó esto antes de que llegara a producción?
- ¿Por qué se tomó esta decisión de diseño?
- ¿Quién rompió la funcionalidad X?

Este sprint instala la infraestructura de comunicación que convierte un grupo de personas trabajando en paralelo en un equipo que trabaja de forma coordinada.

---

## ¿Qué es un Pull Request?

Un PR es una propuesta formal de cambio. Es la pregunta: *"¿Puedo integrar estos cambios al código base compartido?"*

Antes de los PRs, integrar código era así:
```
Ana termina su feature → push directo a main → todos se enteran cuando algo falla
```

Con PRs:
```
Ana termina su feature
  → abre un PR describiendo qué hizo y por qué
  → Carlos revisa el código
  → Carlos aprueba o pide cambios
  → Ana hace los ajustes si los hay
  → Carlos mergea → el código llega a main
```

El PR no es burocracia — es el momento donde el conocimiento del cambio se transfiere del que lo hizo al resto del equipo.

---

## ¿Qué es un code review y para qué sirve?

Un code review **no es** buscar errores para reprocharle al autor. Es un proceso de colaboración con tres objetivos:

**1. Detectar problemas antes de que lleguen a producción**
El autor lleva horas mirando el mismo código. Los ojos frescos ven cosas que el autor ya no puede ver: casos extremos, comportamientos inesperados, variables que no se usan.

**2. Transferir conocimiento**
Si solo una persona entiende cómo funciona una parte del sistema, el proyecto tiene un punto de falla. El reviewer aprende leyendo el código; el autor aprende explicándolo.

**3. Mantener consistencia**
Cinco personas escribiendo código de cinco formas distintas produce un proyecto que nadie puede mantener en 6 meses. El review es donde se acuerdan los estándares.

### Lo que es y lo que no es feedback en un review

```
✅ "Esta query no usa índice — en tablas grandes va a ser lenta"
✅ "Si el usuario no está autenticado, este endpoint devuelve datos de otro usuario"
✅ "Hay un caso no contemplado: ¿qué pasa si el array viene vacío?"
✅ "Podrías simplificar estas tres líneas usando Array.reduce()"

❌ "Yo lo haría diferente" (sin explicar por qué)
❌ "Esto está mal" (sin decir qué ni cómo arreglarlo)
❌ "¿Por qué no usaste X?" (cuando X no es claramente mejor)
```

---

## El modelo de dueños de entorno

En equipos reales, cada entorno tiene un responsable. No porque sea su "territorio", sino porque alguien tiene que tener la autoridad y la responsabilidad de decidir qué entra.

Con la estructura que tienen (develop → main):

```
EQUIPO DE 5 PERSONAS

Feature developers (3 personas)
  → Trabajan en feature branches
  → Abren PRs hacia develop
  → Responsabilidad: que su feature funcione correctamente

Dueño de develop (1 persona)  ← "guardián del entorno DEV"
  → Revisa todos los PRs que van a develop
  → Responsabilidad: que develop siempre compile y corra
  → Si algo llega roto a develop, es su responsabilidad

Dueño de main (1 persona)  ← "guardián de producción"
  → Revisa el PR de develop → main
  → Responsabilidad: que producción nunca se caiga
  → Tiene la última palabra sobre qué llega a los usuarios
```

Este modelo escala. En empresas reales:
- El dueño de develop es el "tech lead del sprint"
- El dueño de main es el "release manager"
- En equipos maduros estas responsabilidades rotan

---

## Conventional Commits — por qué importa el formato

Conventional Commits es un estándar para escribir mensajes de commit que comunican intención:

```
<tipo>: <descripción en imperativo, en minúsculas>

feat: agregar filtro por categoría en la lista de tareas
fix: corregir error al eliminar tarea con caracteres especiales
chore: actualizar dependencias de seguridad
docs: agregar instrucciones de setup en el README
refactor: extraer lógica de validación a función separada
test: agregar pruebas para el endpoint de autenticación
```

**Por qué importa más allá del estilo:**

1. **Automatización:** herramientas como `semantic-release` pueden generar CHANGELOGs automáticos y decidir si un release es major/minor/patch basándose en los prefijos
2. **Búsqueda:** `git log --grep="fix:"` encuentra todos los bugfixes de la historia del proyecto
3. **Contexto:** en 6 meses, "fix: corregir error al eliminar tarea" dice exactamente qué pasó y por qué existe ese commit

**La regla del imperativo:**

El mensaje del commit debe completar la frase: *"Si aplico este commit, el proyecto va a..."*

```
✅ "feat: agregar filtro por categoría"
   → "Si aplico este commit, el proyecto va a agregar filtro por categoría"

❌ "agregué el filtro"
❌ "filtro de categorías"
❌ "feat: se agregó filtro"
```

---

## Por qué branch protection en lugar de "confiar en el equipo"

Branch protection no es desconfianza — es protección contra accidentes. Incluso el desarrollador más cuidadoso hace `git push origin main` cuando quería hacer `git push origin feature/mi-cosa`.

Las rules que configurarás en el SETUP hacen que ese accidente sea imposible, no castigado.

Además, establece un contrato claro:

> "Todo lo que está en `main` fue revisado por al menos una persona además de quien lo escribió."

Eso tiene un valor enorme cuando algo falla en producción: puedes rastrear exactamente qué entró, cuándo, quién lo aprobó y qué se dijo en el review.

---

## El flujo completo que tendrán al final de este sprint

```
1. git checkout develop && git pull
   (siempre partir de develop actualizado)

2. git checkout -b feature/nombre-descriptivo
   (una rama por feature, no mezclar)

3. ... trabajo ... commits con formato Conventional ...

4. git push origin feature/nombre-descriptivo
   (subir la rama)

5. GitHub → New Pull Request
   Base: develop / Compare: feature/nombre-descriptivo
   Título: feat: descripción del cambio
   Descripción: qué hace, cómo probarlo, hay migraciones?

6. Dueño de develop recibe notificación y revisa
   → Aprueba o pide cambios con comentarios específicos

7. Autor hace ajustes si los hay, vuelve a pedir review

8. Dueño de develop mergea → deploy automático a develop

9. Dueño de develop valida en la URL de desarrollo

10. Cuando hay suficientes features validadas:
    PR: develop → main
    Dueño de main revisa y aprueba
    → deploy automático a producción
```

El Sprint 4 automatiza los pasos 8 y 10. Por ahora, el deploy sigue siendo manual después del merge.
