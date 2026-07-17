# Bambú Checador 🎋

Sistema seguro de asistencia y control de nómina para el personal de **Bambú**. Este repositorio contiene una arquitectura dividida en dos módulos principales: un panel de administración/nómina para gerencia y un checador público seguro con geolocalización.

---

## 🏗 Arquitectura del Proyecto

El proyecto está dividido en dos carpetas principales:

1. **/admin** (Frontend Administrativo & Checador)
   - **Tecnologías:** Vue 3, Vite, TailwindCSS, TypeScript.
   - **Propósito:** Contiene tanto el panel administrativo privado (gestión de empleados, turnos, nómina, reportes y descargas en CSV) como la vista pública del **/checador** (donde los empleados marcan sus entradas y salidas).
2. **/server** (Backend & API)
   - **Tecnologías:** Node.js, Express, PostgreSQL (alojado en Neon).
   - **Propósito:** API que gestiona la base de datos de empleados, registros de asistencia, geolocalización de checado (máximo 200m del restaurante), generación de tokens de enlace para vincular dispositivos, y el planificador automático del corte de nómina.

---

## 🚀 Guía de Inicio Rápido (Local)

Sigue estos pasos para correr el proyecto en tu entorno local.

### 1. Requisitos Previos
- **Node.js** (v18 o superior).
- Base de datos **PostgreSQL** (Neon Tech).

### 2. Configuración de Entorno (.env)
Asegúrate de que las variables de entorno estén configuradas en cada módulo.

**En `/server/.env`:**
```env
DATABASE_URL=postgresql://neondb_owner:npg_rVa5LBcR3Ixz@ep-dry-fog-ats3t5hi-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3001
RESTAURANTE_LAT=19.4422797
RESTAURANTE_LNG=-99.2032339
```

**En `/admin/.env`:**
```env
VITE_API_URL=http://localhost:3001
```

### 3. Instalación y Ejecución

Abre dos terminales en tu editor y ejecuta los siguientes comandos:

**Terminal 1 (Backend - Server):**
```bash
cd server
npm install
npm run dev
```
*(El servidor correrá en `http://localhost:3001`)*

**Terminal 2 (Frontend - Admin):**
```bash
cd admin
npm install
npm run dev
```
*(El panel administrativo correrá en `http://localhost:5173`)*

---

## 📝 Últimos Cambios y Contexto Actual (Julio 2026)

### 🗓 14 de Julio 2026

- **Control de Empleados (Renombrado y Filtro):**
  - Se reestructuró el módulo de "Usuarios" a **"Empleados"** en todo el panel (sidebar y títulos).
  - Se ocultó al usuario administrador de las tablas de empleados para evitar su edición o eliminación.
  - Se eliminó el rol `Administrador` del selector de roles en la creación y edición de empleados para asegurar que solo exista el admin principal.
- **Simplificación del Sidebar:**
  - Se eliminaron todos los módulos ajenos a este proyecto (Caja, POS, Compras, Ventas, etc.). El sidebar ahora contiene exclusivamente accesos directos y limpios a **Empleados** y **Nómina**.
- **Vinculación Segura de Dispositivos (Checador Móvil):**
  - Se implementó una interfaz de confirmación al abrir el enlace único del checador. En lugar de registrar el dispositivo automáticamente, el empleado ve una pantalla dedicada con un botón de **"Vincular este Celular"**.
- **Control de Dispositivos en el Panel (Desvincular y Generar):**
  - Se agregaron botones de **"Desvincular Celular"** (limpia el token activo del empleado en la base de datos) y **"Link Checador"** (genera un nuevo link de registro) lado a lado dentro del modal de detalles del empleado.
- **Corte Automático Quincenal:**
  - Se programó un scheduler en segundo plano (`scheduler.js`) que corre a la 1:00 PM los días 15 y el último día de cada mes para consolidar el reporte de asistencia quincenal de los empleados de forma automática en `server/cortes/`.
  - Se habilitó la ruta `POST /api/nomina/corte-automatico-trigger` para que el administrador pueda disparar el cálculo manualmente en cualquier momento.
- **Exportación de Reportes a Excel (CSV):**
  - Se agregaron botones nativos de descarga CSV en las pestañas de **Asistencia Diaria** y **Corte Quincenal** formateados en UTF-8 con soporte de caracteres especiales y acentos.

### 🗓 15 de Julio 2026

- **Gestión Avanzada de Horarios (Plantillas Permanentes y Excepciones):**
  - Se dividió la gestión de horarios en el panel en **Horario Permanente** (plantilla semanal base que se repite indefinidamente) y **Excepción Temporal** (rango de fechas flexible, ej. vacaciones, incapacidades o turnos especiales).
  - Al seleccionar un rango de excepción en el modal, el selector de días masivo y el listado de días se filtran dinámicamente en tiempo real para mostrar **únicamente** los días de la semana incluidos en dicho rango.
  - Se ajustó el selector masivo de horarios para que sobrescriba y limpie los días no seleccionados en el lote actual, asegurando una asignación precisa.
  - Se eliminaron las etiquetas numeradas de secciones en el modal y la visualización de fechas específicas junto a los días de la semana cuando se define la plantilla base, mejorando la estética y claridad.
- **Auto-generación Inteligente en Nómina Diaria:**
  - El backend ahora genera automáticamente las jornadas diarias pendientes conforme el administrador visualiza la nómina de cualquier fecha en el calendario. Resuelve prioridades automáticamente: primero excepciones de rango y luego plantilla permanente base.
- **Reporte Quincenal Dinámico y Depurado:**
  - Se reestructuró el endpoint de generación de corte quincenal en el backend. Ahora realiza una resolución temporal día por día, omitiendo los días de descanso y mostrando únicamente las jornadas laborales programadas (más las excepciones temporales activas).
  - Se corrigió un bug en el cálculo del rango de la segunda quincena en el panel administrativo, asegurando que inicie estrictamente a partir del día 16 de cada mes.

### 🗓 17 de Julio 2026

- **Excepciones de Horario por Fecha Detalladas:**
  - Se implementó la opción de programar excepciones en modo **"Individual (por fecha específica)"** dentro de un rango de fechas, permitiendo configurar detalladamente el horario o descanso día por día del calendario.
  - **Sincronización de Pestañas:** Al cambiar de la pestaña "Repetitivo" a la pestaña "Individual" en el modal de horario, el sistema copia automáticamente la configuración definida en la pestaña repetitiva a todos los días individuales para facilitar una edición rápida sobre un patrón general.
  - **Pre-carga al Editar:** Al dar clic en editar un registro de nómina diario, el formulario se inicializa automáticamente con la hora y estado de la fila seleccionada, facilitando modificaciones directas.
- **Control de Tolerancia y Horas Extras en la Salida:**
  - Se implementó una ventana de tolerancia de **30 minutos** posteriores al fin de la jornada teórica.
  - **Estado "Salida NO Checada":** Si un empleado marca entrada pero no registra su salida pasados los 30 minutos de tolerancia, su estado cambia automáticamente a "Salida NO Checada" (en rojo).
  - **Estado "Horas Extras":** Si el empleado registra su salida después del periodo de tolerancia de 30 minutos, su estado cambia a "Horas Extras" (en morado) y se calcula de forma dinámica el tiempo extra trabajado (ej. `+2h 15m`).
  - **Resolución de Bug de Zona Horaria (UTC) en Asistencias:** Se corrigieron las consultas de agrupación de asistencias de `DATE(created_at)` a `(created_at AT TIME ZONE 'America/Mexico_City')::date` para evitar que los registros realizados después de las 6:00 PM (hora local de México) se interpreten como del día siguiente (UTC), solucionando el problema de registros perdidos.
