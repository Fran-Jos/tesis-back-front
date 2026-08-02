/**
 * Formulario dinámico para crear o editar entidades.
 *
 * Se basa completamente en la definición de `config.form.fields`. Cada campo
 * puede tener valores por defecto, opciones remotas y reglas de visibilidad.
 */
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import type { EntityConfig, FieldConfig, Option } from "../../config/entities";
import api from "../../lib/api";
import useAuth from "../../hooks/useAuth";
import { useAlerts } from "../../context/AlertsContext";

const methodMap = {
  post: api.post.bind(api),
  put: api.put.bind(api),
  patch: api.patch.bind(api),
  delete: api.delete.bind(api),
} as const;

type EntityFormPageProps = {
  config: EntityConfig;
  mode: "create" | "edit";
};

type ValuesState = Record<string, unknown>;

type OptionsState = Record<string, Option[]>;

const isBooleanField = (field: FieldConfig) => field.type === "boolean";

const addDaysToToday = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim().length > 0) {
      return data;
    }
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
};

const EntityFormPage = ({ config, mode }: EntityFormPageProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const recordId = params.id;
  const isEdit = mode === "edit";
  const preselectedOrdenId = config.key === "tareas" && mode === "create" ? searchParams.get("ordenId") : null;
  const preselectedTareaId = config.key === "repuestos-usados" && mode === "create" ? searchParams.get("tareaId") : null;
  const preselectedAlertVehicle = config.key === "ordenes" && mode === "create" ? searchParams.get("vehiculoId") : null;
  const preselectedAlertPlan = config.key === "ordenes" && mode === "create" ? searchParams.get("planId") : null;
  const preselectedAlertType = config.key === "ordenes" && mode === "create" ? searchParams.get("tipo") : null;
  const preselectedAlertaId = config.key === "ordenes" && mode === "create" ? searchParams.get("alertaId") : null;

  const { user: authUser } = useAuth();
  const { refreshAlerts } = useAlerts();

  // Generador de código para órdenes: COD + YYYYMMDD + NNN
  const generateOrderCode = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePart = `${yyyy}${mm}${dd}`;
    const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `COD${datePart}${randomPart}`;
  };

  // Inicializamos el estado con los valores por defecto definidos en la configuración.
  const [values, setValues] = useState<ValuesState>(() => {
    const initial: ValuesState = {};
    config.form.fields.forEach((field) => {
      if (isBooleanField(field)) {
        initial[field.name] = field.defaultValue ?? false;
      } else if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      } else {
        initial[field.name] = "";
      }
    });
    return initial;
  });

  // Si estamos creando una nueva orden, prellenamos `codigo` y `creadoPorId` con valores sugeridos
  useEffect(() => {
    if (mode !== "create") return;
    if (config.key !== "ordenes") return;
    setValues((prev) => {
      const next = { ...prev };
      // prellenar código si no hay valor actual
      if (!prev["codigo"] || String(prev["codigo"]).trim() === "") {
        next.codigo = generateOrderCode();
      }
      // prellenar creadoPorId con el usuario logueado
      if (authUser && (!prev["creadoPorId"] || prev["creadoPorId"] === "")) {
        next.creadoPorId = authUser.usuarioId;
      }
      if (preselectedAlertVehicle) next.vehiculoId = preselectedAlertVehicle;
      if (preselectedAlertPlan) next.planId = preselectedAlertPlan;
      if (preselectedAlertType) next.tipo = preselectedAlertType;
      return next;
    });
  }, [config.key, mode, authUser, preselectedAlertVehicle, preselectedAlertPlan, preselectedAlertType]);

  useEffect(() => {
    if (!preselectedOrdenId) return;
    setValues((prev) => ({ ...prev, ordenId: prev.ordenId || preselectedOrdenId }));
  }, [preselectedOrdenId]);

  useEffect(() => {
    if (!preselectedTareaId) return;
    setValues((prev) => ({ ...prev, tareaId: prev.tareaId || preselectedTareaId }));
  }, [preselectedTareaId]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionsState, setOptionsState] = useState<OptionsState>({});
  const [selectSearchState, setSelectSearchState] = useState<Record<string, string>>({});
  const [addRepuestoAfterTask, setAddRepuestoAfterTask] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<string | null>(null);
  const [lastVehicleKm, setLastVehicleKm] = useState<number | null>(null);
  const [planKmMessage, setPlanKmMessage] = useState<string | null>(null);
  const [odometerReferenceMessage, setOdometerReferenceMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!dialogMessage) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialogMessage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialogMessage]);

  const visibleFields = useMemo(
    () =>
      config.form.fields.filter((field) => {
        // Si estamos en modo edición ocultamos los campos marcados con `hideOnEdit`.
        // Si estamos en creación ocultamos los que tienen `hideOnCreate`.
        return isEdit ? !field.hideOnEdit : !field.hideOnCreate;
      }),
    [config.form.fields, isEdit],
  );

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      // Limpiamos opciones previas para evitar inconsistencias
      setOptionsState({});

      await Promise.all(
        config.form.fields
          .filter((field) => field.type === "select" && field.fetchOptions)
          .map(async (field) => {
            const fetchOptions = field.fetchOptions;
            if (!fetchOptions) {
              return;
            }

            if (
              config.key === "tareas" &&
              mode === "create" &&
              field.name === "asignadoAId" &&
              authUser
            ) {
              const option = {
                value: authUser.usuarioId,
                label: authUser.nombreCompleto,
              } as Option;
              if (isMounted) {
                setOptionsState((prev) => ({ ...prev, [field.name]: [option] }));
                setValues((prev) => ({ ...prev, [field.name]: prev[field.name] || authUser.usuarioId }));
              }
              return;
            }

            // Comportamiento por defecto: obtener lista completa desde el endpoint
            try {
              const response = await api.get(fetchOptions.endpoint);
              if (!isMounted) return;

              const data = Array.isArray(response.data) ? response.data : [];
              const options = data.map((item: Record<string, unknown>) => {
                const value = item[fetchOptions.valueKey];
                const label = fetchOptions.transformLabel
                  ? fetchOptions.transformLabel(item)
                  : String(item[fetchOptions.labelKey] ?? value);
                return {
                  value: typeof value === "number" || typeof value === "boolean" ? value : String(value ?? ""),
                  label,
                } satisfies Option;
              });
              setOptionsState((prev) => ({ ...prev, [field.name]: options }));
            } catch (err) {
              console.error(`Error cargando opciones para campo ${field.name}:`, err);
            }
          }),
      );
    };

    void loadOptions();
    return () => {
      isMounted = false;
    };
  }, [config.key, config.form.fields, mode, authUser]);

  // Si estamos en modo edición, cargamos el registro existente desde la API.
  useEffect(() => {
    if (!isEdit || !recordId) {
      return;
    }

    const loadRecord = async () => {
      setLoading(true);
      try {
        const response = await api.get(`${config.apiPath}/${recordId}`);
        const data = response.data as Record<string, unknown>;
        setValues((prev) => {
          const next = { ...prev };
          config.form.fields.forEach((field) => {
            const value = data[field.name];
            if (value === undefined || value === null) {
              next[field.name] = isBooleanField(field) ? false : "";
            } else if (isBooleanField(field)) {
              next[field.name] = Boolean(value);
            } else if (config.key === "vehiculos" && field.name === "capacidadCarga") {
              next[field.name] = Number(value) / 1000;
            } else if (field.type === "text" || field.type === "textarea") {
              next[field.name] = String(value);
            } else {
              next[field.name] = value;
            }
          });
          return next;
        });
        setError(null);
      } catch (err) {
        const message = resolveErrorMessage(err, "No se pudo cargar el registro");
        setError(message);
        setDialogMessage(message);
      } finally {
        setLoading(false);
      }
    };

    void loadRecord();
  }, [config.apiPath, config.form.fields, isEdit, recordId]);

  useEffect(() => {
    if (config.key !== "planes" || mode !== "create") {
      return;
    }

    const vehiculoId = values.vehiculoId;
    if (!vehiculoId) {
      setLastVehicleKm(null);
      setPlanKmMessage(null);
      setValues((prev) => ({ ...prev, proximoKm: "" }));
      return;
    }

    let isMounted = true;
    const loadLastKm = async () => {
      try {
        const response = await api.get(`/registrokm/vehiculo/${String(vehiculoId)}/ultimo`);
        if (!isMounted) return;
        const odometro = Number((response.data as { odometro?: unknown }).odometro);
        if (Number.isFinite(odometro)) {
          setLastVehicleKm(odometro);
          setPlanKmMessage(`Último kilometraje registrado: ${odometro.toLocaleString("es-EC")} km`);
        } else {
          setLastVehicleKm(null);
          setPlanKmMessage("Este vehículo no tiene kilometraje registrado");
          setValues((prev) => ({ ...prev, proximoKm: "" }));
        }
      } catch (err) {
        if (!isMounted) return;
        setLastVehicleKm(null);
        setPlanKmMessage("Este vehículo no tiene kilometraje registrado");
        setValues((prev) => ({ ...prev, proximoKm: "" }));
      }
    };

    void loadLastKm();
    return () => {
      isMounted = false;
    };
  }, [config.key, mode, values.vehiculoId]);

  useEffect(() => {
    if (config.key !== "registrokm" || mode !== "create") {
      return;
    }

    const vehiculoId = values.vehiculoId;
    if (!vehiculoId) {
      setOdometerReferenceMessage(null);
      setValues((prev) => ({ ...prev, odometro: "" }));
      return;
    }

    let isMounted = true;
    const loadLastOdometer = async () => {
      try {
        const response = await api.get(`/registrokm/vehiculo/${String(vehiculoId)}/ultimo`);
        if (!isMounted) return;
        const odometro = Number((response.data as { odometro?: unknown }).odometro);
        if (Number.isFinite(odometro)) {
          setValues((prev) => ({ ...prev, odometro: Math.trunc(odometro) }));
          setOdometerReferenceMessage(`Último kilometraje registrado: ${odometro.toLocaleString("es-EC")} km`);
        } else {
          setValues((prev) => ({ ...prev, odometro: "" }));
          setOdometerReferenceMessage("Este vehículo no tiene registros de kilometraje previos");
        }
      } catch (err) {
        if (!isMounted) return;
        setValues((prev) => ({ ...prev, odometro: "" }));
        setOdometerReferenceMessage("Este vehículo no tiene registros de kilometraje previos");
      }
    };

    void loadLastOdometer();
    return () => {
      isMounted = false;
    };
  }, [config.key, mode, values.vehiculoId]);

  useEffect(() => {
    if (config.key !== "planes" || mode !== "create") {
      return;
    }

    const frecuenciaKm = Number(values.frecuenciaKm);
    if (lastVehicleKm === null || !Number.isFinite(frecuenciaKm) || frecuenciaKm <= 0) {
      return;
    }

    setValues((prev) => ({
      ...prev,
      proximoKm: Math.trunc(lastVehicleKm + frecuenciaKm),
    }));
  }, [config.key, mode, lastVehicleKm, values.frecuenciaKm]);

  useEffect(() => {
    if (config.key !== "planes" || mode !== "create") {
      return;
    }

    const frecuenciaDias = Number(values.frecuenciaDias);
    if (!Number.isFinite(frecuenciaDias) || frecuenciaDias <= 0) {
      return;
    }

    setValues((prev) => ({
      ...prev,
      proximaFecha: addDaysToToday(Math.trunc(frecuenciaDias)),
    }));
  }, [config.key, mode, values.frecuenciaDias]);

  // Maneja cambios de inputs controlados asegurando que campos de solo lectura no se modifiquen.
  const handleChange = (field: FieldConfig, value: unknown) => {
    if (field.readOnly || (isEdit && field.readOnlyOnEdit)) {
      return;
    }
    setValues((prev) => ({ ...prev, [field.name]: value }));
  };

  /**
   * Sincroniza una alerta buscando si ya existe una pendiente para el mismo plan o vehículo.
   * Evita duplicados y actualiza la información si es necesario.
   */
  const upsertAlert = async (alertData: Record<string, unknown>) => {
    try {
      const res = await api.get(`/alertas/vehiculo/${String(alertData.vehiculoId)}`);
      const existingAlerts = Array.isArray(res.data) ? res.data : [];
      
      // Buscamos una coincidencia lógica (mismo plan, o mismo mensaje base si no hay plan)
      const match = existingAlerts.find((a: any) => 
        a.estado === "PENDIENTE" && 
        (
          (alertData.planId && a.planId === alertData.planId) ||
          (!alertData.planId && String(a.mensaje).startsWith(String(alertData.mensaje).split(":")[0] ?? ""))
        )
      );

      if (match) {
        await api.put(`/alertas/${String(match.id)}`, {
          ...match,
          ...alertData,
          id: match.id
        });
      } else {
        await api.post("/alertas", alertData);
      }
    } catch (err) {
      console.error("Error al sincronizar alerta:", err);
    }
  };

  // Normaliza los valores y emite la petición HTTP adecuada (`post`, `put` o `patch`).
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {};

    visibleFields.forEach((field) => {
      const rawValue = values[field.name];
      if (isBooleanField(field)) {
        payload[field.name] = Boolean(rawValue);
        return;
      }

      if (field.type === "number" || field.type === "decimal") {
        if (rawValue === "" || rawValue === null || rawValue === undefined) {
          payload[field.name] = null;
        } else {
          const numericValue = Number(rawValue);
          payload[field.name] =
            config.key === "vehiculos" && field.name === "capacidadCarga"
              ? numericValue * 1000
              : numericValue;
        }
        return;
      }

      payload[field.name] = rawValue === "" ? null : rawValue;
    });

    if (isEdit && recordId) {
      payload.id = Number(recordId);
    }

    try {
      const method = isEdit ? config.form.updateMethod ?? "put" : config.form.createMethod ?? "post";
      const endpoint = isEdit && method !== "post" ? `${config.apiPath}/${recordId}` : config.apiPath;
      const request = methodMap[method];
      const response = await request(endpoint, payload);

      if (config.key === "ordenes" && mode === "create" && preselectedAlertaId) {
        const ordenId = (response.data as { id?: number }).id;
        if (ordenId) {
          await api.patch(`/alertas/${preselectedAlertaId}`, {
            estado: "PENDIENTE",
            ordenAtendidaId: ordenId,
          });
        }
      }

      // --- Lógica Inteligente de Alertas ---
      
      if (false && config.key === "planes") {
        // Al guardar un plan (nuevo o editado), sincronizamos su alerta verde
        const planId = isEdit ? Number(recordId) : (response.data as { id: number }).id;
        await upsertAlert({
          vehiculoId: payload.vehiculoId,
          planId: planId,
          tipo: "PREVENTIVO",
          clasificacion: "PROXIMA",
          severidad: "VERDE",
          mensaje: `Plan de mantenimiento: ${String(payload.nombre)}`,
          fechaProgramada: payload.proximaFecha || new Date().toISOString().split("T")[0],
          odometroObjetivo: payload.proximoKm,
          estado: "PENDIENTE",
        });
      } 
      
      else if (false && config.key === "ordenes") {
        if (!isEdit) {
          // Al crear una orden, actualizamos la alerta del plan si existe
          await upsertAlert({
            vehiculoId: payload.vehiculoId,
            planId: payload.planId || null,
            tipo: payload.tipo === "PREVENTIVA" ? "PREVENTIVO" : "CORRECTIVO",
            clasificacion: "PROXIMA",
            severidad: "VERDE",
            mensaje: `Mantenimiento en ejecución: ${String(payload.codigo)}`,
            fechaProgramada: payload.fechaApertura || new Date().toISOString().split("T")[0],
            estado: "PENDIENTE",
          });
        } 
        else if (payload.estado === "CERRADA" || payload.estado === "CANCELADA") {
          // Al cerrar o cancelar la orden, eliminamos las alertas del ciclo actual
          const alertasRes = await api.get(`/alertas/vehiculo/${String(payload.vehiculoId)}`);
          const alertas = Array.isArray(alertasRes.data) ? alertasRes.data : [];
          const alertasAEliminar = alertas.filter(
            (a: any) => 
              (payload.planId && a.planId === payload.planId) || 
              String(a.mensaje).includes(String(payload.codigo))
          );
          
          for (const alerta of alertasAEliminar) {
            await api.delete(`/alertas/${String(alerta.id)}`);
          }

          // Si la orden se CERRÓ y tenía un plan, creamos la alerta para el SIGUIENTE ciclo
          if (payload.estado === "CERRADA" && payload.planId) {
            try {
              const planRes = await api.get(`/planes/${String(payload.planId)}`);
              const plan = planRes.data;
              await api.post("/alertas", {
                vehiculoId: plan.vehiculoId,
                planId: plan.id,
                tipo: "PREVENTIVO",
                clasificacion: "PROXIMA",
                severidad: "VERDE",
                mensaje: `Plan de mantenimiento: ${String(plan.nombre)}`,
                fechaProgramada: plan.proximaFecha || new Date().toISOString().split("T")[0],
                odometroObjetivo: plan.proximoKm,
                estado: "PENDIENTE",
              });
            } catch (planErr) {
              console.error("No se pudo programar la siguiente alerta del plan", planErr);
            }
          }
        }
      }
      
      // Sincronizar UI de alertas de forma inmediata
      void refreshAlerts();
      // ------------------------------------

      if (config.key === "tareas" && mode === "create" && addRepuestoAfterTask) {
        const tareaId = (response.data as { id?: unknown }).id;
        if (tareaId) {
          navigate(`/app/repuestos-usados/nuevo?tareaId=${encodeURIComponent(String(tareaId))}`);
          return;
        }
      }

      navigate(`/app/${config.key}`);
    } catch (err) {
      const message = resolveErrorMessage(err, "No se pudo guardar la información");
      setError(message);
      setDialogMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">{config.label}</p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {isEdit ? "Editar registro" : "Nuevo registro"}
        </h1>
        <p className="text-sm text-slate-500">
          {isEdit
            ? "Actualiza la información y guarda los cambios para mantener los datos al día."
            : "Completa el formulario para crear un nuevo registro en el sistema."}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 py-16 text-sm text-slate-500">
            Cargando información...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {visibleFields.map((field) => {
              const isPreselectedTaskOrder = Boolean(preselectedOrdenId && config.key === "tareas" && field.name === "ordenId");
              const isPreselectedRepuestoTask = Boolean(preselectedTareaId && config.key === "repuestos-usados" && field.name === "tareaId");
              const isReadOnly = Boolean(field.readOnly || (isEdit && field.readOnlyOnEdit) || isPreselectedTaskOrder || isPreselectedRepuestoTask);
              const value = values[field.name];
              if (isBooleanField(field)) {
                return (
                  <label key={field.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => handleChange(field, event.target.checked)}
                      disabled={isReadOnly}
                      className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                    />
                    {field.label}
                  </label>
                );
              }

              if (field.type === "select") {
                const options = field.options ?? optionsState[field.name] ?? [];
                const isOrdenesCreadoPor = config.key === "ordenes" && field.name === "creadoPorId";
                const isTareasAsignadoA =
                  config.key === "tareas" &&
                  mode === "create" &&
                  field.name === "asignadoAId" &&
                  authUser;

                if (isOrdenesCreadoPor || isTareasAsignadoA) {
                  // Mostrar solo el nombre del usuario (autenticado al crear, o del registro al editar)
                  let display = "";
                  if (isTareasAsignadoA) {
                    display = authUser?.nombreCompleto ?? "";
                  } else if (isOrdenesCreadoPor) {
                    if (mode === "create") {
                      display = authUser?.nombreCompleto ?? "";
                    } else {
                      const selected = options.find((opt) => opt.value.toString() === String(value));
                      display = selected ? selected.label : (value ? `Usuario #${String(value)}` : "-");
                    }
                  }

                  return (
                    <div key={field.name} className="space-y-2 text-sm">
                      <label className="font-medium text-slate-700" htmlFor={field.name}>
                        {field.label}
                      </label>
                      <input
                        id={`${field.name}_display`}
                        type="text"
                        value={display}
                        readOnly
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 bg-slate-100"
                      />
                    </div>
                  );
                }

                if (isPreselectedTaskOrder || isPreselectedRepuestoTask) {
                  const selected = options.find((opt) => opt.value.toString() === String(value));
                  const fallbackLabel = isPreselectedRepuestoTask ? `Tarea #${String(value)}` : `Orden #${String(value)}`;
                  return (
                    <div key={field.name} className="space-y-2 text-sm md:col-span-2">
                      <label className="font-medium text-slate-700" htmlFor={`${field.name}_display`}>
                        {field.label}
                      </label>
                      <input
                        id={`${field.name}_display`}
                        type="text"
                        value={selected ? selected.label : value ? fallbackLabel : ""}
                        readOnly
                        className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-700"
                      />
                      <p className="text-xs text-slate-500">
                        {isPreselectedRepuestoTask
                          ? "Tarea seleccionada desde el flujo de tareas. El repuesto se asociará a esa tarea."
                          : "Orden seleccionada desde el detalle de mantenimiento."}
                      </p>
                    </div>
                  );
                }

                const searchValue = selectSearchState[field.name] ?? "";
                const normalizedSearch = searchValue.trim().toLowerCase();
                const selectedOption = options.find((option) => option.value.toString() === String(value));
                const filteredOptions = normalizedSearch
                  ? options.filter((option) => option.label.toLowerCase().includes(normalizedSearch))
                  : options;
                const visibleOptions =
                  selectedOption && !filteredOptions.some((option) => option.value.toString() === selectedOption.value.toString())
                    ? [selectedOption, ...filteredOptions]
                    : filteredOptions;

                return (
                  <div key={field.name} className={`space-y-2 text-sm ${
                    (config.key === "tareas" && field.name === "ordenId") ||
                    (config.key === "repuestos-usados" && field.name === "tareaId")
                      ? "md:col-span-2"
                      : ""
                  }`}>
                    <label className="font-medium text-slate-700" htmlFor={field.name}>
                      {field.label}
                    </label>
                    {field.fetchOptions && (
                      options.length > 8 ||
                      (config.key === "tareas" && field.name === "ordenId") ||
                      (config.key === "repuestos-usados" && field.name === "tareaId")
                    ) ? (
                      <input
                        type="search"
                        value={searchValue}
                        onChange={(event) => setSelectSearchState((prev) => ({ ...prev, [field.name]: event.target.value }))}
                        placeholder={
                          config.key === "tareas" && field.name === "ordenId"
                            ? "Buscar por código, placa, plan, tipo, estado o fecha"
                            : "Buscar opción"
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    ) : null}
                    <select
                      id={field.name}
                      value={value === null || value === undefined ? "" : String(value)}
                      onChange={(event) => {
                        if (isReadOnly) {
                          return;
                        }
                        const selected = options.find((option) => option.value.toString() === event.target.value);
                        handleChange(field, selected ? selected.value : "");
                      }}
                      required={field.required}
                      disabled={isReadOnly}
                      className={`w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                        isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">Selecciona una opción</option>
                      {visibleOptions.map((option) => (
                        <option key={option.value.toString()} value={option.value.toString()}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={field.name} className="space-y-2 text-sm md:col-span-2">
                    <label className="font-medium text-slate-700" htmlFor={field.name}>
                      {field.label}
                    </label>
                    <textarea
                      id={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={value === null || value === undefined ? "" : String(value)}
                      onChange={(event) => {
                        if (isReadOnly) {
                          return;
                        }
                        handleChange(field, event.target.value);
                      }}
                      readOnly={isReadOnly}
                      className={`min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                        isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                );
              }

              const inputType = field.type === "date" || field.type === "datetime" ? field.type : "text";

              return (
                <div key={field.name} className="space-y-2 text-sm">
                  <label className="font-medium text-slate-700" htmlFor={field.name}>
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    type={inputType === "datetime" ? "datetime-local" : inputType}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={value === null || value === undefined ? "" : String(value)}
                    onChange={(event) => {
                      if (isReadOnly) {
                        return;
                      }
                      handleChange(field, event.target.value);
                    }}
                    readOnly={isReadOnly}
                    className={`w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                      isReadOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                    }`}
                  />
                  {config.key === "planes" && field.name === "proximoKm" && planKmMessage ? (
                    <p className={`text-xs ${lastVehicleKm === null ? "text-amber-600" : "text-slate-500"}`}>
                      {planKmMessage}
                    </p>
                  ) : null}
                  {config.key === "registrokm" && field.name === "odometro" && odometerReferenceMessage ? (
                    <p className="text-xs text-slate-500">
                      {odometerReferenceMessage}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {config.key === "tareas" && mode === "create" && !loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
            <p className="font-medium text-slate-700">¿Se ocuparon repuestos en esta tarea?</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
                <input
                  type="radio"
                  name="addRepuestoAfterTask"
                  checked={addRepuestoAfterTask}
                  onChange={() => setAddRepuestoAfterTask(true)}
                  className="size-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Sí, agregar repuesto
              </label>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700">
                <input
                  type="radio"
                  name="addRepuestoAfterTask"
                  checked={!addRepuestoAfterTask}
                  onChange={() => setAddRepuestoAfterTask(false)}
                  className="size-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                No, continuar sin repuestos
              </label>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
      {dialogMessage ? (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={() => setDialogMessage(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{dialogMessage}</div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDialogMessage(null)}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EntityFormPage;
