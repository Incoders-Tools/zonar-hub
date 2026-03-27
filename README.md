# Angular Org Template

Template mínimo de Angular listo para iniciar una aplicación nueva y con el contrato base de Copilot dentro de `.github/`.

## Qué trae

- Angular standalone
- estructura feature-first mínima
- contrato base para Copilot en `.github/`
- app inicial que levanta sin pasos extra fuera de Node/npm

## Requisitos

- Node.js 20.11.1 o superior
- npm 10 o superior

## Verificaciones previas

Ejecutá:

```bash
node -v
npm -v
```

## Primer uso

```bash
npm install
npm start
```

La aplicación debería quedar disponible en la URL que muestre Angular CLI, normalmente `http://localhost:4200`.

## Crear un repo nuevo desde este template

1. Crear el nuevo repositorio desde GitHub usando **Use this template**.
2. Clonar el repositorio nuevo, por ejemplo `zonar-hub`.
3. Ejecutar:

```bash
npm install
npm start
```

## Qué revisar si no levanta

- que la versión de Node sea 20+
- que `npm install` termine sin errores
- que el puerto 4200 no esté ocupado
- que estés parado en la raíz del proyecto al correr `npm start`

## Archivos importantes

- `.github/` → contrato base para Copilot
- `AGENTS.md` → reglas de entrada para agentes
- `src/` → aplicación Angular base

## 🤖 Copilot Guidelines
This repository uses a structured Copilot ecosystem.
See:
- .github/copilot-instructions.md
- AGENTS.md