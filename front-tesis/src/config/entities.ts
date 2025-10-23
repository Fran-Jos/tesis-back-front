/**
 * Configuración centralizada de todas las entidades CRUD que renderiza el frontend.
 *
 * Cada objeto describe cómo listar, crear, editar y detallar recursos que provienen
 * del backend (por ejemplo `/vehiculos`). Las páginas de entidades consumen esta
 * estructura para construir dinámicamente tablas, formularios y vistas de detalle.
 */
import type { ReactNode } from "react";

// definimos los tipos de campos soportados en formularios y tablas
export type FieldType = "text" | "textarea" | "number" | "decimal" | "select" | "date" | "datetime" | "boolean";

// opción reutilizable para selects y chips enum
export type Option = {
  value: string | number | boolean;
  label: string;
};


// configuración de un campo en formularios
export type FieldConfig = {
  // clave del campo en el objeto JSON
  name: string;
  // etiqueta legible
  label: string;
    // tipo de campo
  type: FieldType;
  // texto de ayuda
  placeholder?: string;
    // si es obligatorio
  required?: boolean;
    // opciones para selects
  options?: Option[];
  // configuración para obtener opciones dinámicamente desde un endpoint y obtenemos de nuestro backend
  fetchOptions?: {
    // endpoint REST para obtener las opciones
    endpoint: string;
    // clave del valor en el objeto retornado
    valueKey: string;
    // clave de la etiqueta en el objeto retornado
    labelKey: string;
    // función opcional para transformar la etiqueta (útil para concatenar varios campos)
    transformLabel?: (item: Record<string, unknown>) => string;
  };
  // si el campo es solo lectura
  readOnly?: boolean;
  // si el campo es solo lectura al editar (útil para campos únicos como email o cédula)
  readOnlyOnEdit?: boolean;
  // si el campo se oculta al crear (útil para contraseñas)
  hideOnCreate?: boolean;
  // si el campo se oculta al editar (útil para contraseñas)
  hideOnEdit?: boolean;
  // valor por defecto (útil para checkboxes booleanos)
  defaultValue?: string | number | boolean | null;
};

// configuración de una columna en tablas
export type ColumnConfig = {
  // clave del campo en el objeto JSON
  field: string;
    // etiqueta legible
  label: string;
    // tipo de dato (útil para formateo)
  type?: FieldType | "enum" | "datetime" | "chip";
    // función opcional para renderizar el contenido de la celda
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
};

// configuración de un campo en la vista de detalle (similar a ColumnConfig)
export type DetailFieldConfig = {
  field: string;
  label: string;
  type?: FieldType | "enum" | "datetime" | "list";
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
};

// configuración de un filtro en la vista de listado
export type FilterConfig = {
  name: string;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: Option[];
  fetchOptions?: {
    endpoint: string;
    valueKey: string;
    labelKey: string;
    transformLabel?: (item: Record<string, unknown>) => string;
  };
  required?: boolean;
};

// métodos HTTP soportados para formularios
export type HttpMethod = "post" | "put" | "patch" | "delete";

// configuración completa de una entidad CRUD
export type EntityConfig = {
    // clave única de la entidad (usada en rutas y menús)
  key: string;
    // endpoint base en el backend (por ejemplo /vehiculos)
  apiPath: string;
    // etiqueta legible para menús y títulos
  label: string;
    // descripción corta de la entidad
  description: string;
    // campos que se buscan en la barra de búsqueda global
  searchKeys?: string[];
    // configuración de la vista de listado
  list: {
    columns: ColumnConfig[];
    endpoint?: string | ((filters: Record<string, unknown>) => string | null);
    filters?: FilterConfig[];
  };
  form: {
    fields: FieldConfig[];
    createMethod?: HttpMethod;
    updateMethod?: HttpMethod;
    disableCreate?: boolean;
    disableEdit?: boolean;
  };
  detail: {
    fields: DetailFieldConfig[];
  };
  messages?: {
    deleteConfirm?: string;
    deleteSuccess?: string;
  };
  actions?: {
    allowDelete?: boolean;
    allowView?: boolean;
    allowEdit?: boolean;
  };
};

// Catálogos reutilizables para poblar selects y chips en tablas y formularios.
export const enumOptions = {
  roles: [
    { value: "ADMIN", label: "Administrador" },
    { value: "OPERADOR", label: "Operador" },
    { value: "TECNICO", label: "Técnico" },
  ],
  estadoUsuario: [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
  ],
  estadoVehiculo: [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
  ],
  estadoTarea: [
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "OK", label: "Completada" },
    { value: "NOK", label: "Observada" },
  ],
  estadoOrden: [
    { value: "ABIERTA", label: "Abierta" },
    { value: "EN_PROCESO", label: "En proceso" },
    { value: "CERRADA", label: "Cerrada" },
    { value: "CANCELADA", label: "Cancelada" },
  ],
  tipoOrden: [
    { value: "PREVENTIVA", label: "Preventiva" },
    { value: "CORRECTIVA", label: "Correctiva" },
  ],
  tipoAlerta: [
    { value: "KILOMETRAJE", label: "Kilometraje" },
    { value: "FECHA", label: "Fecha" },
    { value: "CORRECTIVO", label: "Correctiva" },
    { value: "PREVENTIVO", label: "Preventiva" },
  ],
  clasificacionAlerta: [
    { value: "PROXIMA", label: "Próxima" },
    { value: "VENCIDA", label: "Vencida" },
  ],
  estadoAlerta: [
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "ATENDIDA", label: "Atendida" },
    { value: "CANCELADA", label: "Cancelada" },
  ],
};

const humanizeEnum = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export type EstadoAlertaVisualConfig = {
  badge: string;
  dot: string;
  row?: string;
  text?: string;
};

export const defaultEstadoAlertaStyles: EstadoAlertaVisualConfig = {
  badge: "border-slate-200 bg-slate-100 text-slate-600",
  dot: "bg-slate-400",
};

export const estadoAlertaStyleMap: Record<string, EstadoAlertaVisualConfig> = {
  PENDIENTE: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  ATENDIDA: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    row: "bg-emerald-50/70",
    text: "text-slate-600",
  },
  CANCELADA: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    row: "bg-rose-50/70",
    text: "text-rose-700",
  },
};

export const getEstadoAlertaLabel = (value: unknown) => {
  if (value === null || value === undefined) {
    return "-";
  }
  const stringValue = String(value);
  const option = enumOptions.estadoAlerta.find((estado) => String(estado.value) === stringValue);
  if (option) {
    return option.label;
  }
  return humanizeEnum(stringValue);
};

// Conjunto de entidades expuestas en el menú principal. Cada entrada define el endpoint REST (`apiPath`).
export const entityConfigs: EntityConfig[] = [
  {
    key: "vehiculos",
    apiPath: "/vehiculos",
    label: "Vehículos",
    description: "Administra la flota y su información técnica.",
    searchKeys: ["placa", "marca", "modelo", "chasis", "color"],
    list: {
      columns: [
        { field: "placa", label: "Placa" },
        { field: "marca", label: "Marca" },
        { field: "modelo", label: "Modelo" },
        { field: "anio", label: "Año", type: "number" },
        { field: "estado", label: "Estado", type: "enum" },
        { field: "kmActual", label: "Kilometraje actual", type: "number" },
      ],
    },
    form: {
      fields: [
        { name: "placa", label: "Placa", type: "text", required: true, readOnlyOnEdit: true },
        { name: "marca", label: "Marca", type: "text", required: true },
        { name: "modelo", label: "Modelo", type: "text", required: true },
        { name: "anio", label: "Año", type: "number", required: true },
        { name: "chasis", label: "Chasis", type: "text", required: true, readOnlyOnEdit: true },
        { name: "capacidadCarga", label: "Capacidad de carga (kg)", type: "decimal" },
        { name: "color", label: "Color", type: "text" },
        { name: "kmActual", label: "Kilometraje actual", type: "number" },
        { name: "estado", label: "Estado", type: "select", required: true, options: enumOptions.estadoVehiculo },
      ],
    },
    detail: {
      fields: [
        { field: "placa", label: "Placa" },
        { field: "marca", label: "Marca" },
        { field: "modelo", label: "Modelo" },
        { field: "anio", label: "Año", type: "number" },
        { field: "chasis", label: "Chasis" },
        { field: "capacidadCarga", label: "Capacidad de carga (kg)", type: "decimal" },
        { field: "color", label: "Color" },
        { field: "kmActual", label: "Kilometraje", type: "number" },
        { field: "estado", label: "Estado", type: "enum" },
      ],
    },
  },
  {
    key: "usuarios",
    apiPath: "/usuarios",
    label: "Usuarios",
    description: "Gestiona operadores, técnicos y administradores.",
    searchKeys: ["nombre", "apellido", "cedula", "email"],
    list: {
      columns: [
        { field: "nombre", label: "Nombre" },
        { field: "apellido", label: "Apellido" },
        { field: "email", label: "Correo" },
        { field: "rol", label: "Rol", type: "enum" },
        { field: "estado", label: "Estado", type: "enum" },
      ],
    },
    form: {
      fields: [
        { name: "nombre", label: "Nombre", type: "text", required: true },
        { name: "apellido", label: "Apellido", type: "text", required: true },
        { name: "cedula", label: "Cédula", type: "text", required: true, readOnlyOnEdit: true },
        { name: "numeroCelular", label: "Celular", type: "text" },
        { name: "email", label: "Correo electrónico", type: "text", required: true },
        { name: "password", label: "Contraseña", type: "text", required: true, hideOnEdit: true },
        { name: "rol", label: "Rol", type: "select", required: true, options: enumOptions.roles },
        { name: "estado", label: "Estado", type: "select", required: true, options: enumOptions.estadoUsuario },
      ],
    },
    detail: {
      fields: [
        { field: "nombre", label: "Nombre" },
        { field: "apellido", label: "Apellido" },
        { field: "cedula", label: "Cédula" },
        { field: "numeroCelular", label: "Celular" },
        { field: "email", label: "Correo" },
        { field: "rol", label: "Rol", type: "enum" },
        { field: "estado", label: "Estado", type: "enum" },
      ],
    },
    messages: {
      deleteConfirm: "¿Eliminar este usuario? Esta acción no se puede deshacer.",
    },
  },
  {
    key: "planes",
    apiPath: "/planes",
    label: "Planes de mantenimiento",
    description: "Define los planes preventivos asociados a cada vehículo.",
    searchKeys: ["nombre", "vehiculoPlaca"],
    list: {
      columns: [
        { field: "nombre", label: "Nombre" },
        { field: "vehiculoPlaca", label: "Vehículo" },
        { field: "frecuenciaKm", label: "Frecuencia (km)", type: "number" },
        { field: "frecuenciaDias", label: "Frecuencia (días)", type: "number" },
        { field: "activo", label: "Activo", type: "boolean" },
      ],
      endpoint: "/planes/activos",
    },
    form: {
      fields: [
        {
          name: "vehiculoId",
          label: "Vehículo",
          type: "select",
          required: true,
          fetchOptions: {
            endpoint: "/vehiculos",
            valueKey: "id",
            labelKey: "placa",
            transformLabel: (vehiculo) => `${vehiculo.placa as string} · ${vehiculo.marca as string}`,
          },
        },
        { name: "nombre", label: "Nombre del plan", type: "text", required: true },
        { name: "frecuenciaKm", label: "Frecuencia (km)", type: "number" },
        { name: "frecuenciaDias", label: "Frecuencia (días)", type: "number" },
        { name: "activo", label: "Activo", type: "boolean", defaultValue: true },
        { name: "proximoKm", label: "Próximo km", type: "number" },
        { name: "proximaFecha", label: "Próxima fecha", type: "date" },
      ],
    },
    detail: {
      fields: [
        { field: "vehiculoPlaca", label: "Vehículo" },
        { field: "nombre", label: "Nombre" },
        { field: "frecuenciaKm", label: "Frecuencia (km)", type: "number" },
        { field: "frecuenciaDias", label: "Frecuencia (días)", type: "number" },
        { field: "activo", label: "Activo", type: "boolean" },
        { field: "proximoKm", label: "Próximo km", type: "number" },
        { field: "proximaFecha", label: "Próxima fecha", type: "date" },
      ],
    },
  },
  {
    key: "ordenes",
    apiPath: "/ordenes",
    label: "Órdenes de mantenimiento",
    description: "Coordina las órdenes preventivas y correctivas en curso.",
    searchKeys: ["codigo", "vehiculoPlaca", "planNombre"],
    list: {
      columns: [
        { field: "codigo", label: "Código" },
        { field: "vehiculoPlaca", label: "Vehículo" },
        { field: "tipo", label: "Tipo", type: "enum" },
        { field: "estado", label: "Estado", type: "enum" },
        { field: "fechaApertura", label: "Apertura", type: "datetime" },
      ],
    },
    form: {
      fields: [
        { name: "codigo", label: "Código", type: "text", required: true },
        {
          name: "tipo",
          label: "Tipo",
          type: "select",
          required: true,
          options: enumOptions.tipoOrden,
        },
        {
          name: "estado",
          label: "Estado",
          type: "select",
          required: true,
          options: enumOptions.estadoOrden,
        },
        {
          name: "vehiculoId",
          label: "Vehículo",
          type: "select",
          required: true,
          fetchOptions: {
            endpoint: "/vehiculos",
            valueKey: "id",
            labelKey: "placa",
            transformLabel: (vehiculo) => `${vehiculo.placa as string} · ${vehiculo.marca as string}`,
          },
        },
        {
          name: "planId",
          label: "Plan asociado",
          type: "select",
          fetchOptions: {
            endpoint: "/planes/activos",
            valueKey: "id",
            labelKey: "nombre",
            transformLabel: (plan) => `${plan.nombre as string} (${plan.vehiculoPlaca as string})`,
          },
        },
        {
          name: "responsableId",
          label: "Responsable",
          type: "select",
          fetchOptions: {
            endpoint: "/usuarios",
            valueKey: "id",
            labelKey: "nombre",
            transformLabel: (usuario) => `${usuario.nombre as string} ${usuario.apellido as string}`,
          },
        },
        { name: "ivaPorc", label: "IVA (%)", type: "decimal" },
      ],
    },
    detail: {
      fields: [
        { field: "codigo", label: "Código" },
        { field: "tipo", label: "Tipo", type: "enum" },
        { field: "estado", label: "Estado", type: "enum" },
        { field: "vehiculoPlaca", label: "Vehículo" },
        { field: "planNombre", label: "Plan" },
        { field: "creadoPorNombre", label: "Creado por" },
        { field: "responsableNombre", label: "Responsable" },
        { field: "fechaApertura", label: "Fecha apertura", type: "datetime" },
        { field: "fechaCierre", label: "Fecha cierre", type: "datetime" },
        { field: "total", label: "Total", type: "decimal" },
      ],
    },
  },
  {
    key: "tareas",
    apiPath: "/tareas",
    label: "Tareas",
    description: "Gestiona las actividades ejecutadas dentro de una orden.",
    searchKeys: ["descripcion", "asignadoANombre"],
    list: {
      columns: [
        { field: "nombre", label: "Nombre" },
        { field: "descripcion", label: "Descripción" },
        { field: "estado", label: "Estado", type: "enum" },
        { field: "asignadoANombre", label: "Asignado a" },
        { field: "horas", label: "Horas", type: "decimal" },
      ],
      filters: [
        {
          name: "ordenId",
          label: "Orden",
          type: "select",
          required: true,
          fetchOptions: {
            endpoint: "/ordenes",
            valueKey: "id",
            labelKey: "codigo",
            transformLabel: (orden) => `${orden.codigo as string} · ${orden.vehiculoPlaca as string}`,
          },
        },
      ],
      endpoint: (filters) =>
        filters.ordenId ? `/tareas/orden/${filters.ordenId as string}` : null,
    },
    form: {
      fields: [
        {
          name: "ordenId",
          label: "Orden",
          type: "select",
          required: true,
          fetchOptions: {
            endpoint: "/ordenes",
            valueKey: "id",
            labelKey: "codigo",
            transformLabel: (orden) => `${orden.codigo as string} · ${orden.vehiculoPlaca as string}`,
          },
        },
        { name: "nombre", label: "Nombre", type: "text", required: true },
        {
          name: "asignadoAId",
          label: "Asignado a",
          type: "select",
          fetchOptions: {
            endpoint: "/usuarios",
            valueKey: "id",
            labelKey: "nombre",
            transformLabel: (usuario) => `${usuario.nombre as string} ${usuario.apellido as string}`,
          },
        },
        { name: "estado", label: "Estado", type: "select", required: true, options: enumOptions.estadoTarea },
        { name: "descripcion", label: "Descripción", type: "textarea", required: true },
        { name: "horas", label: "Horas", type: "decimal" },
        { name: "costoManoObra", label: "Costo mano de obra", type: "decimal" },
      ],
    },
    detail: {
      fields: [
        { field: "nombre", label: "Nombre" },
        { field: "descripcion", label: "Descripción" },
        { field: "estado", label: "Estado", type: "enum" },
        { field: "asignadoANombre", label: "Asignado a" },
        { field: "horas", label: "Horas", type: "decimal" },
        { field: "costoManoObra", label: "Costo mano de obra", type: "decimal" },
      ],
    },
    messages: {
      deleteConfirm: "¿Eliminar esta tarea?",
    },
  },
  {
    key: "repuestos-usados",
    apiPath: "/repuestos-usados",
    label: "Repuestos",
    description: "Controla los repuestos utilizados en cada tarea.",
    searchKeys: ["descripcion"],
    list: {
      columns: [
        {
          field: "tareaNombre",
          label: "Tarea",
          render: (value, row) => value ?? (row.tareaId ? `Tarea #${row.tareaId as number}` : "Sin asignar"),
        },
        { field: "descripcion", label: "Descripción" },
        { field: "cantidad", label: "Cantidad", type: "decimal" },
        { field: "costoUnitario", label: "Costo unitario", type: "decimal" },
      ],
      filters: [
        {
          name: "disponibilidad",
          label: "Disponibilidad",
          type: "select",
          options: [
            { value: "todos", label: "Todos" },
            { value: "sinTarea", label: "Sin asignar" },
          ],
        },
        {
          name: "tareaId",
          label: "Tarea",
          type: "select",
          fetchOptions: {
            endpoint: "/tareas",
            valueKey: "id",
            labelKey: "nombre",
            transformLabel: (tarea) => {
              const nombre = tarea.nombre as string;
              const orden = tarea.ordenId ? ` · Orden #${tarea.ordenId as number}` : "";
              return `${nombre}${orden}`;
            },
          },
        },
      ],
      endpoint: (filters) =>
        filters.tareaId
          ? `/repuestos-usados/tarea/${filters.tareaId as string}`
          : filters.disponibilidad === "sinTarea"
            ? "/repuestos-usados?sinTarea=true"
            : "/repuestos-usados",
    },
    form: {
      fields: [
        {
          name: "tareaId",
          label: "Tarea",
          type: "select",
          fetchOptions: {
            endpoint: "/tareas",
            valueKey: "id",
            labelKey: "nombre",
            transformLabel: (tarea) => {
              const nombre = tarea.nombre as string;
              const orden = tarea.ordenId ? ` · Orden #${tarea.ordenId as number}` : "";
              return `${nombre}${orden}`;
            },
          },
        },
        { name: "descripcion", label: "Descripción", type: "textarea", required: true },
        { name: "cantidad", label: "Cantidad", type: "decimal", required: true },
        { name: "costoUnitario", label: "Costo unitario", type: "decimal", required: true },
      ],
    },
    detail: {
      fields: [
        {
          field: "tareaNombre",
          label: "Tarea",
          render: (value, row) => value ?? (row.tareaId ? `Tarea #${row.tareaId as number}` : "Sin asignar"),
        },
        { field: "descripcion", label: "Descripción" },
        { field: "cantidad", label: "Cantidad", type: "decimal" },
        { field: "costoUnitario", label: "Costo unitario", type: "decimal" },
      ],
    },
  },
  {
    key: "registrokm",
    apiPath: "/registrokm",
    label: "Registros de kilometraje",
    description: "Historial de lecturas de odómetro para cada vehículo.",
    searchKeys: ["vehiculoPlaca", "usuarioNombre"],
    list: {
      columns: [
        { field: "vehiculoPlaca", label: "Vehículo" },
        { field: "fecha", label: "Fecha", type: "datetime" },
        { field: "odometro", label: "Odómetro", type: "number" },
        { field: "usuarioNombre", label: "Registrado por" },
      ],
      filters: [
        {
          name: "vehiculoId",
          label: "Vehículo",
          type: "select",
          required: true,
          fetchOptions: {
            endpoint: "/vehiculos",
            valueKey: "id",
            labelKey: "placa",
            transformLabel: (vehiculo) => `${vehiculo.placa as string} · ${vehiculo.marca as string}`,
          },
        },
      ],
      endpoint: (filters) =>
        filters.vehiculoId ? `/registrokm/vehiculo/${filters.vehiculoId as string}` : null,
    },
    form: {
      fields: [
        {
          name: "vehiculoId",
          label: "Vehículo",
          type: "select",
          required: true,
          fetchOptions: {
            endpoint: "/vehiculos",
            valueKey: "id",
            labelKey: "placa",
            transformLabel: (vehiculo) => `${vehiculo.placa as string} · ${vehiculo.marca as string}`,
          },
        },
        {
          name: "usuarioId",
          label: "Usuario",
          type: "select",
          fetchOptions: {
            endpoint: "/usuarios",
            valueKey: "id",
            labelKey: "nombre",
            transformLabel: (usuario) => `${usuario.nombre as string} ${usuario.apellido as string}`,
          },
        },
        { name: "fecha", label: "Fecha", type: "datetime" },
        { name: "odometro", label: "Odómetro", type: "number", required: true },
      ],
      disableEdit: true,
    },
    actions: {
      allowDelete: false,
      allowEdit: false,
    },
    detail: {
      fields: [
        { field: "vehiculoPlaca", label: "Vehículo" },
        { field: "fecha", label: "Fecha", type: "datetime" },
        { field: "odometro", label: "Odómetro", type: "number" },
        { field: "usuarioNombre", label: "Registrado por" },
      ],
    },
  },
  {
    key: "alertas",
    apiPath: "/alertas",
    label: "Alertas",
    description: "Monitorea las alertas preventivas y correctivas.",
    searchKeys: ["vehiculoPlaca", "mensaje", "tipo"],
    list: {
        columns: [
          { field: "vehiculoPlaca", label: "Vehículo" },
          { field: "tipo", label: "Tipo", type: "enum" },
          { field: "clasificacion", label: "Clasificación", type: "enum" },
          {
            field: "estado",
            label: "Estado",
            type: "enum",
            render: (value) => {
              if (!value) {
                return "-";
              }
              const estado = String(value);
              const styles = estadoAlertaStyleMap[estado] ?? defaultEstadoAlertaStyles;
              return (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}
                >
                  <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden="true" />
                  {getEstadoAlertaLabel(estado)}
                </span>
              );
            },
          },
          { field: "fechaProgramada", label: "Fecha objetivo", type: "date" },
        ],
      filters: [
        {
          name: "vehiculoId",
          label: "Vehículo",
          type: "select",
          fetchOptions: {
            endpoint: "/vehiculos",
            valueKey: "id",
            labelKey: "placa",
            transformLabel: (vehiculo) => `${vehiculo.placa as string} · ${vehiculo.marca as string}`,
          },
        },
        {
          name: "estado",
          label: "Estado",
          type: "select",
          options: enumOptions.estadoAlerta,
        },
      ],
      endpoint: (filters) => {
        if (filters.vehiculoId) {
          return `/alertas/vehiculo/${filters.vehiculoId as string}`;
        }
        if (filters.estado) {
          return `/alertas/estado/${filters.estado as string}`;
        }
        return "/alertas/proximas?dias=30";
      },
    },
    form: {
      fields: [
        {
          name: "vehiculoId",
          label: "Vehículo",
          type: "select",
          required: true,
          fetchOptions: {
            endpoint: "/vehiculos",
            valueKey: "id",
            labelKey: "placa",
            transformLabel: (vehiculo) => `${vehiculo.placa as string} · ${vehiculo.marca as string}`,
          },
        },
        {
          name: "planId",
          label: "Plan",
          type: "select",
          fetchOptions: {
            endpoint: "/planes/activos",
            valueKey: "id",
            labelKey: "nombre",
            transformLabel: (plan) => `${plan.nombre as string} (${plan.vehiculoPlaca as string})`,
          },
        },
        { name: "tipo", label: "Tipo", type: "select", required: true, options: enumOptions.tipoAlerta },
        { name: "clasificacion", label: "Clasificación", type: "select", options: enumOptions.clasificacionAlerta },
        { name: "mensaje", label: "Mensaje", type: "textarea", required: true },
        { name: "fechaProgramada", label: "Fecha programada", type: "date" },
        { name: "estado", label: "Estado", type: "select", options: enumOptions.estadoAlerta },
      ],
      updateMethod: "post",
    },
    detail: {
      fields: [
        { field: "vehiculoPlaca", label: "Vehículo" },
        { field: "planNombre", label: "Plan" },
        { field: "tipo", label: "Tipo", type: "enum" },
        { field: "clasificacion", label: "Clasificación", type: "enum" },
        { field: "mensaje", label: "Mensaje" },
        { field: "fechaProgramada", label: "Fecha programada", type: "date" },
        { field: "estado", label: "Estado", type: "enum" },
      ],
    },
  },
];

export const entityConfigMap = entityConfigs.reduce<Record<string, EntityConfig>>((acc, config) => {
  acc[config.key] = config;
  return acc;
}, {});
