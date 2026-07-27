# Bambú Asistente 🎋

Sistema de apoyo gerencial y control operativo para la administración de personal, asistencia y compras del restaurante **Bambú**. 

Este repositorio está estructurado en una arquitectura modular separada en un panel administrativo web/celular (`/admin`) y un backend API con base de datos PostgreSQL (`/server`).

---

## 📚 Documentación del Proyecto

Toda la documentación técnica, guías de instalación, historial de cambios y metodologías de trabajo para el equipo de desarrollo se encuentra dentro de la carpeta **[`/docs`](file:///Users/ricardo/Documents/Deploy/bambu-checador/docs)**:

- 📖 **[Arquitectura y Guía Técnica (`/docs/README.md`)](file:///Users/ricardo/Documents/Deploy/bambu-checador/docs/README.md)**: Estructura del repositorio, configuración de entorno (`.env`), comandos de inicio local y el historial de cambios y contexto operativo del proyecto.
- 🛠️ **[Metodología de Trabajo - Ways of Work (`/docs/WoW.md`)](file:///Users/ricardo/Documents/Deploy/bambu-checador/docs/WoW.md)**: Flujo de trabajo con Git, reglas para nombres y etiquetas de Pull Requests (`[FRONTEND]`, `[BACKEND]`, etc.), asignación de Issues para Yael (Dev) y protocolo de Code Reviews.
- ✅ **[Criterios de Terminación - Definition of Done (`/docs/DoD.md`)](file:///Users/ricardo/Documents/Deploy/bambu-checador/docs/DoD.md)**: Checklist obligatorio que cada historia o Issue debe cumplir (calidad técnica, UX para gerencia, pruebas locales limpias y formato git) antes de ser aprobado y mergeado.

---

## 🚀 Inicio Rápido

Para levantar ambos servidores localmente, abre dos terminales:

**1. Servidor Backend (`/server`):**
```bash
cd server && npm run dev
```
*(Corre en el puerto `3001`)*

**2. Panel Administrativo / Checador (`/admin`):**
```bash
cd admin && npm run dev
```
*(Corre en el puerto `5173`)*
