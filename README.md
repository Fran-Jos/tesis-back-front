# Frontend de Gestión de Mantenimiento

Aplicación React + Vite que consume la API Spring Boot del proyecto `Tesis_BACK`. El panel incluye autenticación por JWT, rutas protegidas y páginas CRUD para las entidades principales expuestas por el backend.

## Requisitos previos

- Node.js 18+
- Variables de entorno configuradas en un archivo `.env` o `.env.local` en la raíz del front:

```bash
VITE_API_BASE_URL=http://localhost:8080/API/v1.0/Mantenimiento
```

Ajusta la URL al host/puerto donde esté desplegado el backend.

## Scripts disponibles

```bash
npm install           # Instala dependencias
npm run dev           # Levanta el entorno de desarrollo (puerto 5173 por defecto)
npm run build         # Genera la build de producción
npm run preview       # Sirve la build generada
npm run lint          # Ejecuta ESLint
```

## Autenticación

- Ruta pública: `/login`.
- Envío de credenciales a `POST /auth/login`.
- El token JWT se almacena en `localStorage` y se incluye automáticamente en el header `Authorization`.
- Respuestas 401 limpian la sesión y redirigen a `/login`.

## Ruteo de la aplicación

Todas las rutas protegidas viven bajo `/app/*`.

| Ruta | Descripción |
| --- | --- |
| `/app/dashboard` | Panel con métricas de flota, órdenes y alertas. |
| `/app/vehiculos` | Listado, detalle, creación y edición de vehículos. |
| `/app/usuarios` | Gestión de usuarios del sistema. |
| `/app/planes` | Planes de mantenimiento preventivo (se listan los activos). |
| `/app/ordenes` | Órdenes de mantenimiento (solo creación y detalle, edición deshabilitada). |
| `/app/tareas` | Tareas por orden (requiere seleccionar la orden). |
| `/app/repuestos-usados` | Repuestos asociados a una tarea (requiere ingresar el ID de la tarea). |
| `/app/registrokm` | Registros de kilometraje por vehículo (selección obligatoria del vehículo). |
| `/app/alertas` | Alertas preventivas/correctivas (listado de próximas alertas por defecto). |

Cada entidad expone las rutas auxiliares:

- `/app/{entidad}/nuevo`
- `/app/{entidad}/{id}`
- `/app/{entidad}/{id}/editar` (cuando el backend soporta actualización)

## Integración con la API

- Cliente HTTP centralizado en `src/lib/api.ts` con interceptores de autenticación y manejo global de 401.
- Servicios CRUD genéricos implementados mediante los componentes reutilizables de entidades (`EntityListPage`, `EntityFormPage`, `EntityDetailPage`).
- Para endpoints que requieren filtros (p. ej. tareas por orden o alertas por estado) se incluyen controles interactivos que construyen dinámicamente la URL adecuada.
- El panel de control (`/app/dashboard`) consulta los endpoints de vehículos, planes, órdenes y alertas para generar métricas en tiempo real.

## Compatibilidad backend

- No se añadieron nuevos DTOs ni se modificaron las entidades JPA existentes.
- La edición de alertas usa `POST /alertas` (upsert existente) enviando el `id` cuando corresponde.
- Los módulos sin endpoint de actualización o borrado (`ordenes`, `registrokm`) omiten automáticamente las acciones en la interfaz.

## Estructura relevante

```
src/
 ├── App.tsx                     # Definición de rutas y protección
 ├── config/entities.ts          # Configuración declarativa de cada entidad
 ├── context/AuthContext.tsx     # Manejo global de la sesión
 ├── lib/api.ts                  # Axios configurado con interceptores
 ├── components/
 │   ├── layout/AppShell.tsx     # Layout principal con sidebar/topbar
 │   └── routing/PrivateRoute.tsx
 └── pages/
     ├── auth/LoginPage.tsx      # Vista pública de login
     ├── DashboardPage.tsx       # Panel con métricas
     └── entities/               # Páginas genéricas CRUD
```

## Entidades soportadas

- Vehículos
- Usuarios
- Planes de mantenimiento
- Órdenes de mantenimiento
- Tareas
- Repuestos usados
- Registros de kilometraje
- Alertas

Cada una dispone de formularios validados, estados de carga/error y confirmaciones al eliminar, reutilizando la estética original del template (sidebar, topbar y paleta de colores).

