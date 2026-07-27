# 🛠️ Ways of Work (WoW) - Metodología de Trabajo

Estándares y flujo de trabajo colaborativo para el equipo de desarrollo de **Bambú Asistente**. Todo el ciclo de vida de desarrollo se gestiona a través de **Git e Issues / Pull Requests (PRs)** para garantizar trazabilidad, orden y alta calidad en cada entrega.

---

## 📋 1. Planificación y Asignación de Tareas (Issues)

1. **Revisión de Contexto y Avances:** Se revisa periódicamente el estado actual y contexto del repositorio para definir objetivos operativos.
2. **Creación de Issues:** El trabajo se divide en tareas claras y modulares, creando un *Issue* en Git por cada requerimiento o historia.
3. **Asignación:** Cada tarea es asignada explícitamente a **Yael (Dev)** con criterios de aceptación definidos y prioridad establecida.

---

## 👨‍💻 2. Ejecución y Creación del Pull Request (Dev Workflow)

Cuando **Yael** comienza a trabajar en un Issue asignado:

1. **Creación de Rama (Branch):** Crea una rama de trabajo limpia a partir de la rama principal (ej. `feature/checador-ui` o `fix/calculo-horas`).
2. **Desarrollo:** Ejecuta la tarea cumpliendo estrictamente con la *Definition of Done (DoD)*.
3. **Apertura de PR (Pull Request):** Una vez terminada y probada la tarea, abre un PR hacia la rama principal con las siguientes reglas obligatorias:

### 📌 Reglas de Formato para el Pull Request (PR):
- **Título Descriptivo con Prefijo de Etiqueta:** El título del PR debe identificar inmediatamente el área técnica del proyecto usando etiquetas entre corchetes:
  - `[FRONTEND]` Cambios en componentes, vistas o UX de Vue 3 (`/admin`).
  - `[BACKEND]` Cambios en API, endpoints, middlewares o servicios de Node.js (`/server`).
  - `[CHECADOR]` Lógica o interfaz del reloj checador y geolocalización.
  - `[NOMINA]` Lógica de cálculo, cortes quincenales, horas extra o reportes CSV.
  - `[COMPRAS]` Módulo de compras, gastos y procesamiento de archivos XML.
  - `[HORARIOS]` Gestión de turnos permanentes o excepciones temporales.
  - `[BUG] / [HOTFIX]` Corrección de errores en producción o lógica existente.
  - *Ejemplo:* `[NOMINA] Implementar cálculo de 30 mins de tolerancia en salida`

- **Descripción del PR:** Debe contener un **resumen claro de lo que se hizo en el PR** (qué archivos o lógica principal cambió y cómo se probó).
- **Referencia al Issue (`#`):** En la descripción, es **obligatorio referenciar el número de issue** que el PR resuelve utilizando la sintaxis `#` (ejemplo: `Resolves #14` o `Refs #8`).
- **Asignación de Revisión:** Al subir el PR, Yael **debe asignar el PR a Ricardo (Tech Lead / Revisión)** para notificar que está listo para evaluación.

---

## 🔍 3. Proceso de Revisión y Criterios Minuciosos (Code Review)

Una vez que el PR está asignado para revisión, el Tech Lead evalúa rigurosamente el código, la arquitectura y la funcionalidad.

> [!CAUTION]
> **Estándar Minucioso de Revisión:**
> Respecto a las revisiones, **se tiene que ser muy minucioso al momento de aprobar un PR**. El revisor debe tener **especial cuidado en el scope** y verificar estrictamente que:
> 1. No se haya inflado el alcance (cero modificaciones fuera de lo solicitado en el Issue).
> 2. No contenga código basura (sin `console.log`, sin código comentado ni alertas temporales).
> 3. No existan componentes huérfanos (archivos creados que no se usan en ninguna parte o restos de componentes viejos no eliminados).
> 4. No venga arrastrando cambios, conflictos o commits ajenos pertenecientes a otro branch en desarrollo.

### 🟢 Escenario A: Aprobación (Todo cumple la DoD)
1. **Aprobar PR:** Se constata que el código es limpio, funcional y no rompe el pipeline de CI/CD ni otras áreas del sistema.
2. **Merge:** Se realiza el merge (fusión) de los cambios a la rama principal.
3. **Cierre de Rama:** Se elimina/cierra la rama (branch) de desarrollo utilizada para mantener el repositorio limpio.
4. **Cierre de Issue:** Se va al Issue original, se agrega un comentario poniendo exactamente: **`Resuelto en PR#<número>`** y se procede a **cerrar el Issue**.

### 🟡 Escenario B: Regreso para Cambios (Feedback / Correcciones)
1. **Comentar Observaciones:** Si se detecta código basura, arrastre de commits, regresiones o falta de alineación al scope, se escribe un comentario en el PR detallando con precisión **qué falló y qué se necesita cambiar**.
2. **Reasignar a Yael:** Se cambia el asignado del PR de vuelta a **Yael** para que ejecute los ajustes en su misma rama.
3. **Resolución:** Yael realiza las modificaciones requeridas, sube los nuevos commits y **vuelve a reasignar el PR al revisor**.
4. **Ciclo de Iteración:** Este proceso (revisión ↔ ajuste ↔ reasignación) se repite las veces necesarias hasta que el PR cumpla minuciosamente con todos los estándares y logre cerrarse en el Escenario A.
