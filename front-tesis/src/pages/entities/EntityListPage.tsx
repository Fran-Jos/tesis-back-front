import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { EntityConfig, Option } from "../../config/entities";
import api from "../../lib/api";
import { formatValue } from "../../utils/formatters";
import { getErrorMessage } from "../../utils/errors";

type EntityListPageProps = {
  config: EntityConfig;
};

type ItemRecord = Record<string, unknown> & { id?: number };

type FilterState = Record<string, string>;

type FetchState = {
  loading: boolean;
  error: string | null;
};

const EntityListPage = ({ config }: EntityListPageProps) => {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>({ loading: true, error: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>(() => {
    const initial: FilterState = {};
    config.list.filters?.forEach((filter) => {
      if (filter.defaultValue === undefined || filter.defaultValue === null) {
        initial[filter.name] = "";
        return;
      }

      const value = filter.defaultValue;
      initial[filter.name] = typeof value === "string" ? value : String(value);
    });
    return initial;
  });
  const [filterOptions, setFilterOptions] = useState<Record<string, Option[]>>({});

  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const loadFilterOptions = useCallback(async () => {
    if (!config.list.filters) {
      return;
    }

    const asyncFilters = config.list.filters.filter((filter) => filter.type === "select" && filter.fetchOptions);

    await Promise.allSettled(
      asyncFilters.map(async (filter) => {
        const fetchOptions = filter.fetchOptions;
        if (!fetchOptions) {
          return;
        }

        try {
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

          if (isMountedRef.current) {
            setFilterOptions((prev) => ({ ...prev, [filter.name]: options }));
          }
        } catch (error) {
          console.error(`No se pudieron cargar las opciones del filtro "${filter.label}"`, error);
        }
      }),
    );
  }, [config.list.filters]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  const missingRequiredFilter = useMemo(
    () => config.list.filters?.some((filter) => filter.required && !filters[filter.name]) ?? false,
    [config.list.filters, filters],
  );

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

  const loadItems = useCallback(async () => {
    if (!resolvedEndpoint || missingRequiredFilter) {
      if (isMountedRef.current) {
        setFetchState({ loading: false, error: null });
        setItems([]);
      }
      return;
    }

    if (isMountedRef.current) {
      setFetchState({ loading: true, error: null });
    }

    try {
      const response = await api.get(resolvedEndpoint);
      const data = Array.isArray(response.data) ? (response.data as ItemRecord[]) : [];

      if (isMountedRef.current) {
        setItems(data);
        setFetchState({ loading: false, error: null });
      }
    } catch (error) {
      console.error("Error al cargar registros", error);
      const message = getErrorMessage(error, "No se pudo cargar la información. Intenta nuevamente.");

      if (isMountedRef.current) {
        setFetchState({ loading: false, error: message });
        setItems([]);
      }
    }
  }, [missingRequiredFilter, resolvedEndpoint]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar el registro";
      alert(message);
    }
  };

  const allowView = config.actions?.allowView ?? true;
  const allowEdit = (config.actions?.allowEdit ?? true) && !config.form.disableEdit;
  const allowDelete = config.actions?.allowDelete ?? true;

  const handleRetry = useCallback(() => {
    void loadItems();
  }, [loadItems]);

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
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-600">
            <p className="font-semibold">No se pudo cargar la información.</p>
            <p className="mt-1 text-red-500/80">{fetchState.error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleRetry()}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Recargar página
              </button>
            </div>
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
                {filteredItems.map((item) => (
                  <tr key={item.id ?? crypto.randomUUID()} className="transition hover:bg-slate-50/70">
                    {config.list.columns.map((column) => (
                      <td key={column.field} className="px-4 py-3 align-top">
                        {column.render
                          ? column.render(item[column.field], item)
                          : formatValue(item[column.field], column.type)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {allowView && item.id ? (
                          <Link
                            to={`/app/${config.key}/${item.id}`}
                            className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-500"
                          >
                            Ver
                          </Link>
                        ) : null}
                        {allowEdit && item.id ? (
                          <Link
                            to={`/app/${config.key}/${item.id}/editar`}
                            className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                          >
                            Editar
                          </Link>
                        ) : null}
                        {allowDelete && item.id ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityListPage;
