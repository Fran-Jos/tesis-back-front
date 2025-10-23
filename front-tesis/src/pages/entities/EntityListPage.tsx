/**
 * Vista genérica para listar entidades configuradas en `config/entities`.
 *
 * Se alimenta con un objeto `EntityConfig` que describe columnas, filtros y
 * permisos. El componente se encarga de consultar el endpoint indicado,
 * renderizar la tabla y gestionar acciones CRUD básicas.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  defaultEstadoAlertaStyles,
  estadoAlertaStyleMap,
  getEstadoAlertaLabel,
  type EntityConfig,
  type Option,
} from "../../config/entities";
import api from "../../lib/api";
import { formatValue } from "../../utils/formatters";

type EntityListPageProps = {
  config: EntityConfig;
};

type ItemRecord = Record<string, unknown> & { id?: number };

type FilterState = Record<string, string>;

type FetchState = {
  loading: boolean;
  error: string | null;
};

type ActionFeedback = {
  type: "success" | "error";
  message: string;
};

const EntityListPage = ({ config }: EntityListPageProps) => {
  // Datos obtenidos desde la API correspondiente (definida en `config.apiPath`).
  const [items, setItems] = useState<ItemRecord[]>([]);
  // Estado para manejar loading/error de la petición principal.
  const [fetchState, setFetchState] = useState<FetchState>({ loading: true, error: null });
  const [searchTerm, setSearchTerm] = useState("");
  // Cada filtro se inicializa según la configuración para mantener controlados sus valores.
  const [filters, setFilters] = useState<FilterState>(() => {
    const initial: FilterState = {};
    config.list.filters?.forEach((filter) => {
      initial[filter.name] = "";
    });
    return initial;
  });
  // Las opciones dinámicas (como selects remotos) se cargan y guardan aquí para reuso.
  const [filterOptions, setFilterOptions] = useState<Record<string, Option[]>>({});
  const [inlineFeedback, setInlineFeedback] = useState<ActionFeedback | null>(null);
  const [dialogFeedback, setDialogFeedback] = useState<ActionFeedback | null>(null);
  const isAlertEntity = config.key === "alertas";
  const [selectedAlert, setSelectedAlert] = useState<ItemRecord | null>(null);
  const [alertActionState, setAlertActionState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });
  const selectedAlertEstado =
    selectedAlert && typeof selectedAlert.estado === "string" ? selectedAlert.estado : null;
  const selectedAlertStyles =
    selectedAlertEstado && estadoAlertaStyleMap[selectedAlertEstado]
      ? estadoAlertaStyleMap[selectedAlertEstado]
      : defaultEstadoAlertaStyles;
  const selectedAlertEstadoLabel = selectedAlertEstado ? getEstadoAlertaLabel(selectedAlertEstado) : "-";
  const selectedAlertMessage =
    selectedAlert && typeof selectedAlert.mensaje === "string" && selectedAlert.mensaje.trim().length > 0
      ? selectedAlert.mensaje.trim()
      : null;

  const closeAlertModal = useCallback(() => {
    if (alertActionState.loading) {
      return;
    }
    setSelectedAlert(null);
    setAlertActionState({ loading: false, error: null });
  }, [alertActionState.loading]);

  const handleAlertClick = (item: ItemRecord) => {
    if (!isAlertEntity) {
      return;
    }
    setSelectedAlert(item);
    setAlertActionState({ loading: false, error: null });
  };

  const handleActionClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (isAlertEntity) {
      event.stopPropagation();
    }
  };

  useEffect(() => {
    if (!dialogFeedback) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialogFeedback(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialogFeedback]);

  useEffect(() => {
    if (!isAlertEntity || !selectedAlert) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAlertModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAlertModal, isAlertEntity, selectedAlert]);

  useEffect(() => {
    setSelectedAlert(null);
    setAlertActionState({ loading: false, error: null });
  }, [config.key]);

  const loadFilterOptions = async () => {
    if (!config.list.filters) {
      return;
    }

    await Promise.all(
      config.list.filters
        .filter((filter) => filter.type === "select" && filter.fetchOptions)
        .map(async (filter) => {
          const fetchOptions = filter.fetchOptions;
          if (!fetchOptions) {
            return;
          }
          const response = await api.get(fetchOptions.endpoint);
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
          setFilterOptions((prev) => ({ ...prev, [filter.name]: options }));
        }),
    );
  };

  useEffect(() => {
    void loadFilterOptions();
  }, []);

  const resolvedEndpoint = useMemo(() => {
    const endpoint = config.list.endpoint;
    if (typeof endpoint === "function") {
      return endpoint(filters);
    }
    if (endpoint) {
      return endpoint;
    }
    return config.apiPath;
  }, [config.apiPath, config.list.endpoint, filters]);

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
      if (typeof error.message === "string" && error.message.trim().length > 0) {
        return error.message;
      }
    }
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return fallback;
  };

  const handleMarkAlertAsAttended = async () => {
    if (!selectedAlert?.id) {
      return;
    }

    setAlertActionState({ loading: true, error: null });

    try {
      const response = await api.patch(`${config.apiPath}/${selectedAlert.id}`, {
        estado: "ATENDIDA",
      });
      const updatedAlert = (response?.data ?? {}) as ItemRecord;
      const updatedAlertId = (updatedAlert.id ?? selectedAlert.id) as number | undefined;

      if (updatedAlertId !== undefined) {
        setItems((prev) =>
          prev.map((current) =>
            current.id === updatedAlertId ? { ...current, ...updatedAlert, id: updatedAlertId } : current,
          ),
        );
      }

      setInlineFeedback({
        type: "success",
        message: "La alerta se marcó como atendida correctamente.",
      });
      setAlertActionState({ loading: false, error: null });
      setSelectedAlert(null);
    } catch (error) {
      const message = resolveErrorMessage(error, "No se pudo actualizar la alerta");
      setAlertActionState({ loading: false, error: message });
    }
  };

  // Consulta el listado cada vez que cambia el endpoint (por filtros dinámicos, etc.).
  useEffect(() => {
    const loadItems = async () => {
      if (!resolvedEndpoint) {
        setFetchState({ loading: false, error: null });
        setItems([]);
        return;
      }

      setFetchState({ loading: true, error: null });
      try {
        const response = await api.get(resolvedEndpoint);
        const data = Array.isArray(response.data) ? (response.data as ItemRecord[]) : [];
        setItems(data);
        setFetchState({ loading: false, error: null });
      } catch (error) {
        const message = resolveErrorMessage(error, "No se pudo cargar la información");
        setFetchState({ loading: false, error: message });
        setItems([]);
      }
    };

    void loadItems();
  }, [resolvedEndpoint]);

  // Filtrado en memoria usando las claves declaradas en `config.searchKeys`.
  const filteredItems = useMemo(() => {
    if (!searchTerm || !config.searchKeys?.length) {
      return items;
    }

    const normalizedSearch = searchTerm.toLowerCase();
    return items.filter((item) =>
      config.searchKeys?.some((key) => {
        const value = item[key];
        if (value === undefined || value === null) {
          return false;
        }
        return String(value).toLowerCase().includes(normalizedSearch);
      }),
    );
  }, [config.searchKeys, items, searchTerm]);

  // Elimina un registro llamando al endpoint `/entidad/:id` cuando la entidad lo permite.
  const handleDelete = async (item: ItemRecord) => {
    if (!item.id) {
      return;
    }

    const confirmMessage =
      config.messages?.deleteConfirm ?? "¿Deseas eliminar este registro? Esta acción es irreversible.";
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await api.delete(`${config.apiPath}/${item.id}`);
      setItems((prev) => prev.filter((current) => current.id !== item.id));
      setInlineFeedback({
        type: "success",
        message: config.messages?.deleteSuccess ?? "El registro se eliminó correctamente.",
      });
      setDialogFeedback(null);
    } catch (error) {
      const message = resolveErrorMessage(error, "No se pudo eliminar el registro");
      setInlineFeedback(null);
      setDialogFeedback({ type: "error", message });
    }
  };

  const missingRequiredFilter = config.list.filters?.some((filter) => filter.required && !filters[filter.name]);
  const allowView = config.actions?.allowView ?? true;
  const allowEdit = (config.actions?.allowEdit ?? true) && !config.form.disableEdit;
  const allowDelete = config.actions?.allowDelete ?? true;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">{config.label}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">{config.description}</h1>
          {!config.form.disableCreate ? (
            <Link
              to={`/app/${config.key}/nuevo`}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
            >
              Nuevo registro
            </Link>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        {inlineFeedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              inlineFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {inlineFeedback.message}
          </div>
        ) : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm font-medium text-slate-600" htmlFor="search">
              Búsqueda
            </label>
            <input
              id="search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filtra por texto"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-64"
            />
          </div>

          {config.list.filters?.length ? (
            <div className="flex flex-wrap gap-4">
              {config.list.filters.map((filter) => (
                <div key={filter.name} className="flex flex-col gap-2 text-sm">
                  <label className="font-medium text-slate-600" htmlFor={filter.name}>
                    {filter.label}
                  </label>
                  {filter.type === "select" ? (
                    <select
                      id={filter.name}
                      value={filters[filter.name] ?? ""}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          [filter.name]: event.target.value,
                        }))
                      }
                      className="w-52 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Selecciona...</option>
                      {(filter.options ?? filterOptions[filter.name] ?? []).map((option) => (
                        <option key={option.value} value={option.value as string | number}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={filter.name}
                      type="text"
                      placeholder={filter.placeholder}
                      value={filters[filter.name] ?? ""}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          [filter.name]: event.target.value,
                        }))
                      }
                      className="w-48 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {missingRequiredFilter ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Selecciona todos los filtros requeridos para visualizar los registros.
          </div>
        ) : fetchState.loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 py-16 text-sm text-slate-500">
            Cargando datos...
          </div>
        ) : fetchState.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {fetchState.error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 py-16 text-sm text-slate-500">
            No hay registros que coincidan con la búsqueda actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  {config.list.columns.map((column) => (
                    <th key={column.field} className="px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredItems.map((item) => {
                  const estado = typeof item.estado === "string" ? item.estado : null;
                  const estadoStyles =
                    isAlertEntity && estado
                      ? estadoAlertaStyleMap[estado] ?? defaultEstadoAlertaStyles
                      : undefined;
                  const rowClassName = [
                    "transition hover:bg-slate-50/70",
                    isAlertEntity ? "cursor-pointer" : "",
                    estadoStyles?.row ?? "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const cellTextClass = estadoStyles?.text ?? "";

                  return (
                    <tr
                      key={item.id ?? crypto.randomUUID()}
                      className={rowClassName || "transition hover:bg-slate-50/70"}
                      onClick={isAlertEntity ? () => handleAlertClick(item) : undefined}
                      role={isAlertEntity ? "button" : undefined}
                      tabIndex={isAlertEntity ? 0 : undefined}
                      onKeyDown={
                        isAlertEntity
                          ? (event: ReactKeyboardEvent<HTMLTableRowElement>) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleAlertClick(item);
                              }
                            }
                          : undefined
                      }
                    >
                      {config.list.columns.map((column) => (
                        <td
                          key={column.field}
                          className={`px-4 py-3 align-top${cellTextClass ? ` ${cellTextClass}` : ""}`}
                        >
                          {column.render
                            ? column.render(item[column.field], item)
                            : formatValue(item[column.field], column.type)}
                        </td>
                      ))}
                      <td className={`px-4 py-3${cellTextClass ? ` ${cellTextClass}` : ""}`}>
                        <div className="flex flex-wrap gap-2">
                          {allowView && item.id ? (
                            <Link
                              to={`/app/${config.key}/${item.id}`}
                              className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-500"
                              onClick={isAlertEntity ? handleActionClick : undefined}
                            >
                              Ver
                            </Link>
                          ) : null}
                          {allowEdit && item.id ? (
                            <Link
                              to={`/app/${config.key}/${item.id}/editar`}
                              className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                              onClick={isAlertEntity ? handleActionClick : undefined}
                            >
                              Editar
                            </Link>
                          ) : null}
                          {allowDelete && item.id ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                if (isAlertEntity) {
                                  event.stopPropagation();
                                }
                                void handleDelete(item);
                              }}
                              className="rounded-xl border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Eliminar
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isAlertEntity && selectedAlert ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="alerta-detalle-titulo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          onClick={closeAlertModal}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Detalle de alerta</p>
                <h2 id="alerta-detalle-titulo" className="mt-1 text-xl font-semibold text-slate-900">
                  {selectedAlert.vehiculoPlaca ?? "Alerta"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedAlert.planNombre ? `Plan asociado: ${selectedAlert.planNombre}` : "Sin plan asociado"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAlertModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-lg font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Cerrar detalle de alerta"
                disabled={alertActionState.loading}
              >
                &times;
              </button>
            </div>
            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${selectedAlertStyles.badge}`}
              >
                <span className={`h-2 w-2 rounded-full ${selectedAlertStyles.dot}`} aria-hidden="true" />
                {selectedAlertEstadoLabel}
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Fecha objetivo</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatValue(selectedAlert.fechaProgramada, "date")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tipo</p>
                <p className="mt-1 text-sm text-slate-600">{formatValue(selectedAlert.tipo, "enum")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Clasificación</p>
                <p className="mt-1 text-sm text-slate-600">{formatValue(selectedAlert.clasificacion, "enum")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Plan</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedAlert.planNombre ?? "Sin plan asociado"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Orden asociada</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedAlert.ordenAtendidaId ? `#${selectedAlert.ordenAtendidaId}` : "Sin orden vinculada"}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Descripción</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {selectedAlertMessage ?? "Sin detalles adicionales."}
              </p>
            </div>
            {alertActionState.error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {alertActionState.error}
              </div>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAlertModal}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={alertActionState.loading}
              >
                Cerrar
              </button>
              {selectedAlertEstado !== "ATENDIDA" ? (
                <button
                  type="button"
                  onClick={() => void handleMarkAlertAsAttended()}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={alertActionState.loading}
                >
                  {alertActionState.loading ? "Actualizando..." : "Marcar como atendida"}
                </button>
              ) : (
                <div className="inline-flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
                  Procesada
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {dialogFeedback ? (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={() => setDialogFeedback(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                dialogFeedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {dialogFeedback.message}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDialogFeedback(null)}
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

export default EntityListPage;
