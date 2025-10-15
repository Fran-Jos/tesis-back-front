import type { ReactNode } from "react";

export type FieldType = "text" | "textarea" | "number" | "decimal" | "select" | "date" | "datetime" | "boolean";

export type Option = {
  value: string | number | boolean;
  label: string;
};

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: Option[];
  fetchOptions?: {
    endpoint: string;
    valueKey: string;
    labelKey: string;
    transformLabel?: (item: Record<string, unknown>) => string;
  };
  readOnly?: boolean;
  readOnlyOnEdit?: boolean;
  hideOnCreate?: boolean;
  hideOnEdit?: boolean;
  defaultValue?: string | number | boolean | null;
};

export type ColumnConfig = {
  field: string;
  label: string;
  type?: FieldType | "enum" | "datetime" | "chip";
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
};

export type DetailFieldConfig = {
  field: string;
  label: string;
  type?: FieldType | "enum" | "datetime" | "list";
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
};

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
  defaultValue?: string | number | boolean | null;
};

export type HttpMethod = "post" | "put" | "patch";

export type EntityConfig = {
  key: string;
  apiPath: string;
  label: string;
  description: string;
  searchKeys?: string[];
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
  };
  actions?: {
    allowDelete?: boolean;
    allowView?: boolean;
    allowEdit?: boolean;
  };
};

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
      disableEdit: true,
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
    searchKeys: ["nombre", "descripcion"],
    list: {
      columns: [
        {
          field: "tareaNombre",
          label: "Tarea",
          render: (value, row) => value ?? (row.tareaId ? `Tarea #${row.tareaId as number}` : "Sin asignar"),
        },
        { field: "nombre", label: "Nombre" },
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
        { name: "nombre", label: "Nombre", type: "text", required: true },
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
        { field: "nombre", label: "Nombre" },
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
        { field: "estado", label: "Estado", type: "enum" },
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
