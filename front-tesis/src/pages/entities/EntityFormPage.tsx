/**
 * Formulario dinámico para crear o editar entidades.
 *
 * Se basa completamente en la definición de `config.form.fields`. Cada campo
 * puede tener valores por defecto, opciones remotas y reglas de visibilidad.
 */
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import type { EntityConfig, FieldConfig, Option } from "../../config/entities";
import api from "../../lib/api";

const methodMap = {
  post: api.post.bind(api),
  put: api.put.bind(api),
  patch: api.patch.bind(api),
} as const;

type EntityFormPageProps = {
  config: EntityConfig;
  mode: "create" | "edit";
};

type ValuesState = Record<string, unknown>;

type OptionsState = Record<string, Option[]>;

const isBooleanField = (field: FieldConfig) => field.type === "boolean";

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

const EntityFormPage = ({ config, mode }: EntityFormPageProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const recordId = params.id;
  const isEdit = mode === "edit";

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
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionsState, setOptionsState] = useState<OptionsState>({});

  const visibleFields = useMemo(
    () =>
      config.form.fields.filter((field) => {
        if (isEdit && field.hideOnEdit) {
          return false;
        }
        if (!isEdit && field.hideOnCreate) {
          return false;
        }
        return true;
      }),
    [config.form.fields, isEdit],
  );

  useEffect(() => {
    const loadOptions = async () => {
      await Promise.all(
        config.form.fields
          .filter((field) => field.type === "select" && field.fetchOptions)
          .map(async (field) => {
            const fetchOptions = field.fetchOptions;
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
            setOptionsState((prev) => ({ ...prev, [field.name]: options }));
          }),
      );
    };

    void loadOptions();
  }, [config.form.fields]);

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
        setError(resolveErrorMessage(err, "No se pudo cargar el registro"));
      } finally {
        setLoading(false);
      }
    };

    void loadRecord();
  }, [config.apiPath, config.form.fields, isEdit, recordId]);

  // Maneja cambios de inputs controlados asegurando que campos de solo lectura no se modifiquen.
  const handleChange = (field: FieldConfig, value: unknown) => {
    if (field.readOnly || (isEdit && field.readOnlyOnEdit)) {
      return;
    }
    setValues((prev) => ({ ...prev, [field.name]: value }));
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
          payload[field.name] = Number(rawValue);
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
      await request(endpoint, payload);
      navigate(`/app/${config.key}`);
    } catch (err) {
      setError(resolveErrorMessage(err, "No se pudo guardar la información"));
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
              const isReadOnly = Boolean(field.readOnly || (isEdit && field.readOnlyOnEdit));
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
                return (
                  <div key={field.name} className="space-y-2 text-sm">
                    <label className="font-medium text-slate-700" htmlFor={field.name}>
                      {field.label}
                    </label>
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
                      {options.map((option) => (
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
                </div>
              );
            })}
          </div>
        )}

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
    </div>
  );
};

export default EntityFormPage;
