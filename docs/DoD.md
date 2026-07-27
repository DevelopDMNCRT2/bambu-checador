# ✅ Definition of Done (DoD) - Criterios de Terminación

Para que una tarea, historia de usuario o *Issue* se considere realmente **TERMINADA (Done)** en el proyecto **Bambú Asistente**, debe cumplir estrictamente con los siguientes 4 pilares fundamentales de calidad y arquitectura. 

Al momento de revisar un Pull Request (PR), se evaluará minuciosamente el cumplimiento de estos puntos antes de autorizar cualquier merge.

---

## 🎯 1. Scope Limpio y No Inflado (Revisar en PR)
- **Alineación estricta al Issue:** Los cambios en el código deben enfocarse única y exclusivamente en resolver lo solicitado en la tarea de Git. Está prohibido inflar el alcance del PR con modificaciones ajenas o "mejoras no solicitadas".
- **Cero Código Basura:** No se permite subir código comentado, variables sin utilizar, archivos de prueba temporales, ni `console.log()` o alertas de depuración.
- **Cero Componentes Huérfanos:** No se deben crear archivos, estilos o componentes que no estén importados, ruteados y utilizados en la aplicación. Si un componente es reemplazado o deja de usarse, debe eliminarse limpiamente.
- **Aislamiento de Rama (Cero Arrastre):** La rama de trabajo debe partir de la versión más reciente de la rama principal (`main`/`develop`) y contener **únicamente los commits de esa feature o fix**. No debe venir arrastrando cambios, conflictos o historial ajeno de otros branches en desarrollo.

---

## 🛡️ 2. Cambios Funcionales que No Rompen la Aplicación
- **Cumplimiento del 100% del requerimiento:** La nueva funcionalidad o corrección opera perfectamente en todos sus escenarios (Happy Path y Edge Cases) respetando la filosofía de uso gerencial sencilla ("cero tecnológico").
- **Cero Regresiones:** Los nuevos cambios están aislados adecuadamente y se ha verificado que **no rompen ni degradan ninguna funcionalidad existente** en el sistema (ejemplo: reloj checador móvil, geolocalización, cálculo de nómina quincenal o lectura de facturas XML).
- **Integridad de Datos:** Cualquier consulta a la base de datos PostgreSQL, lectura de archivos XML o exportación a Excel (CSV) maneja transacciones seguras y conserva intacta la codificación UTF-8 (acentos, tildes y caracteres especiales).

---

## 📚 3. Todo Documentado en la Carpeta `/docs`
- **Actualización Continua del Conocimiento:** Cualquier modificación que altere la arquitectura, agregue nuevas variables de entorno (`.env`), cree nuevos endpoints, o modifique la lógica operativa del checador o compras, **debe quedar obligatorimente registrada y explicada en la carpeta [`/docs`](file:///Users/ricardo/Documents/Deploy/bambu-checador/docs)** (actualizando `/docs/README.md` o el archivo que corresponda).
- **Trazabilidad en Git:** El Pull Request incluye la referencia explícita del Issue que resuelve (usando la sintaxis `#`, ej. `Resolves #15`) para vincular el historial de documentación con la ejecución de código.

---

## 🚀 4. Cruza sin Problemas el Pipeline de Infra / CI-CD
- **Compilación Limpia (Build Pass):** El proyecto compila y empaqueta perfectamente sin errores de sintaxis, fallas de TypeScript ni advertencias críticas. Al ejecutar en local `npm run build-only` (en `/admin`), el build debe finalizar con estatus exitoso (`✓ built in ...`).
- **Estabilidad de Entorno:** El backend en `/server` inicia sin arrojar excepciones de Node.js ni errores fatales de conexión a base de datos al ejecutar `npm run dev`.
- **Despliegue Continuo Seguro:** El código cumple con todas las reglas de linter y validaciones automatizadas del pipeline de Integración y Despliegue Continuo (CI/CD), asegurando un paso a producción ininterrumpido y sin caídas de servicio.
