/**
 * Vista de detalle reutilizable para cualquier entidad configurada.
 *
 * Consulta el endpoint `/entidad/:id` y muestra los campos definidos en
 * `config.detail.fields`. Permite navegar de regreso o editar según permisos.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { EntityConfig } from "../../config/entities";
import api from "../../lib/api";
import { formatValue } from "../../utils/formatters";

type EntityDetailPageProps = {
  config: EntityConfig;
};

type ItemRecord = Record<string, unknown> & { id?: number };

const EntityDetailPage = ({ config }: EntityDetailPageProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadItem = async () => {
      setLoading(true);
      try {
        const response = await api.get(`${config.apiPath}/${id}`);
        setItem(response.data as ItemRecord);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el detalle";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadItem();
  }, [config.apiPath, id]);

  const allowEdit = (config.actions?.allowEdit ?? true) && !config.form.disableEdit;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">{config.label}</p>
        <h1 className="text-3xl font-semibold text-slate-900">Detalle del registro</h1>
        <p className="text-sm text-slate-500">
          Consulta los datos más relevantes y accede rápidamente a las acciones disponibles.
        </p>
      </header>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">{error}</div>
      ) : loading || !item ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-xl">
          Cargando información...
        </div>
      ) : (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <dl className="grid gap-6 md:grid-cols-2">
            {config.detail.fields.map((field) => (
              <div key={field.field} className="space-y-1 rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{field.label}</dt>
                <dd className="text-sm font-medium text-slate-800">
                  {field.render ? field.render(item[field.field], item) : formatValue(item[field.field], field.type)}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-500"
            >
              Regresar
            </button>
            {allowEdit && id ? (
              <Link
                to={`/app/${config.key}/${id}/editar`}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                Editar registro
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityDetailPage;
