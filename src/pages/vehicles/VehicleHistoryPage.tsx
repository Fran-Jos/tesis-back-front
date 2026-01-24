/**
 * Módulo de historial de vehículo.
 *
 * Permite consultar información histórica por vehículo, con filtros de fechas
 * y acceso a métricas clave como kilometraje e intervenciones.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import { formatValue } from "../../utils/formatters";

type VehiculoOption = {
  value: string;
  label: string;
};

type VehiculoDetalle = Record<string, unknown>;

type RegistroKm = {
  id: number;
  fecha: string;
  odometro: number;
  usuarioNombre?: string | null;
};

type ReporteOrden = {
  ordenId: number;
  codigo: string;
  tipo: string;
  estado: string;
  planNombre?: string | null;
  responsableNombre?: string | null;
  fechaApertura?: string | null;
  fechaCierre?: string | null;
  total?: number | null;
};

type FiltersState = {
  vehiculoId: string;
  desde: string;
  hasta: string;
};

const defaultFilters: FiltersState = {
  vehiculoId: "",
  desde: "",
  hasta: "",
};

const normalizeDateTime = (value: string) => {
  if (!value) {
    return undefined;
  }
  return value.length === 16 ? `${value}:00` : value;
};

const buildParams = (filters: FiltersState) => {
  const params: Record<string, string> = {};
  const desde = normalizeDateTime(filters.desde);
  const hasta = normalizeDateTime(filters.hasta);
  if (desde) {
    params.desde = desde;
  }
  if (hasta) {
    params.hasta = hasta;
  }
  if (filters.vehiculoId) {
    params.vehiculoId = filters.vehiculoId;
  }
  return params;
};

const VehicleHistoryPage = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FiltersState>(() => ({
    ...defaultFilters,
    vehiculoId: searchParams.get("vehiculoId") ?? "",
  }));
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [vehiculoDetalle, setVehiculoDetalle] = useState<VehiculoDetalle | null>(null);
  const [registrosKm, setRegistrosKm] = useState<RegistroKm[]>([]);
  const [ordenes, setOrdenes] = useState<ReporteOrden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehiculos = async () => {
      try {
        const response = await api.get("/vehiculos");
        const options = Array.isArray(response.data)
          ? (response.data as Record<string, unknown>[]).map((item) => ({
              value: String(item.id ?? ""),
              label: `${item.placa as string} · ${item.marca as string}`,
            }))
          : [];
        setVehiculos(options);
      } catch (err) {
        console.error("No se pudieron cargar los vehículos", err);
      }
    };

    void loadVehiculos();
  }, []);

  const filteredRegistrosKm = useMemo(() => {
    if (!filters.desde && !filters.hasta) {
      return registrosKm;
    }
    const desde = filters.desde ? new Date(filters.desde) : null;
    const hasta = filters.hasta ? new Date(filters.hasta) : null;
    return registrosKm.filter((registro) => {
      if (!registro.fecha) {
        return false;
      }
      const fechaRegistro = new Date(registro.fecha);
      if (desde && fechaRegistro < desde) {
        return false;
      }
      if (hasta && fechaRegistro > hasta) {
        return false;
      }
      return true;
    });
  }, [filters.desde, filters.hasta, registrosKm]);

  const handleBuscar = async () => {
    if (!filters.vehiculoId) {
      setError("Selecciona un vehículo para consultar el historial.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const [vehiculoRes, registroRes, ordenesRes] = await Promise.all([
        api.get(`/vehiculos/${filters.vehiculoId}`),
        api.get(`/registrokm/vehiculo/${filters.vehiculoId}`),
        api.get("/ordenes/reportes/detallado", { params }),
      ]);
      setVehiculoDetalle(vehiculoRes.data as VehiculoDetalle);
      setRegistrosKm(Array.isArray(registroRes.data) ? (registroRes.data as RegistroKm[]) : []);
      setOrdenes(Array.isArray(ordenesRes.data) ? (ordenesRes.data as ReporteOrden[]) : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar el historial del vehículo";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.vehiculoId) {
      void handleBuscar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">Historial de vehículo</p>
        <h1 className="text-3xl font-semibold text-slate-900">Consulta histórica por unidad</h1>
        <p className="text-sm text-slate-500">
          Filtra por vehículo y rango de fechas para revisar kilometraje, intervenciones y datos generales.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2 text-sm">
            <label className="font-medium text-slate-600" htmlFor="vehiculoId">
              Vehículo
            </label>
            <select
              id="vehiculoId"
              value={filters.vehiculoId}
              onChange={(event) => setFilters((prev) => ({ ...prev, vehiculoId: event.target.value }))}
              className="w-64 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Selecciona...</option>
              {vehiculos.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="font-medium text-slate-600" htmlFor="desde">
              Desde
            </label>
            <input
              id="desde"
              type="datetime-local"
              value={filters.desde}
              onChange={(event) => setFilters((prev) => ({ ...prev, desde: event.target.value }))}
              className="w-56 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="font-medium text-slate-600" htmlFor="hasta">
              Hasta
            </label>
            <input
              id="hasta"
              type="datetime-local"
              value={filters.hasta}
              onChange={(event) => setFilters((prev) => ({ ...prev, hasta: event.target.value }))}
              className="w-56 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void handleBuscar()}
              className="rounded-2xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700"
            >
              Buscar
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 py-16 text-sm text-slate-500">
          Cargando historial...
        </div>
      ) : null}

      {vehiculoDetalle ? (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900">Información general del vehículo</h2>
          <dl className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Placa", value: vehiculoDetalle.placa },
              { label: "Marca", value: vehiculoDetalle.marca },
              { label: "Modelo", value: vehiculoDetalle.modelo },
              { label: "Año", value: vehiculoDetalle.anio },
              { label: "Estado", value: vehiculoDetalle.estado },
              { label: "Kilometraje actual", value: vehiculoDetalle.kmActual },
              { label: "Chasis", value: vehiculoDetalle.chasis },
              { label: "Color", value: vehiculoDetalle.color },
              { label: "Capacidad de carga", value: vehiculoDetalle.capacidadCarga },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</dt>
                <dd className="text-sm font-medium text-slate-800">{formatValue(item.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Historial de kilometraje</h2>
          <span className="text-sm text-slate-500">{filteredRegistrosKm.length} registros</span>
        </div>
        {filteredRegistrosKm.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay registros de kilometraje para los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Odómetro</th>
                  <th className="px-4 py-3">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrosKm.map((registro) => (
                  <tr key={registro.id}>
                    <td className="px-4 py-3 text-slate-700">{formatValue(registro.fecha, "datetime")}</td>
                    <td className="px-4 py-3 text-slate-700">{formatValue(registro.odometro, "number")}</td>
                    <td className="px-4 py-3 text-slate-700">{registro.usuarioNombre ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Intervenciones y órdenes</h2>
          <span className="text-sm text-slate-500">{ordenes.length} órdenes</span>
        </div>
        {ordenes.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay intervenciones registradas para el rango seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Apertura</th>
                  <th className="px-4 py-3">Cierre</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordenes.map((orden) => (
                  <tr key={orden.ordenId}>
                    <td className="px-4 py-3 text-slate-700">{orden.codigo}</td>
                    <td className="px-4 py-3 text-slate-700">{orden.tipo}</td>
                    <td className="px-4 py-3 text-slate-700">{orden.estado}</td>
                    <td className="px-4 py-3 text-slate-700">{orden.planNombre ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{orden.responsableNombre ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatValue(orden.fechaApertura, "datetime")}</td>
                    <td className="px-4 py-3 text-slate-700">{formatValue(orden.fechaCierre, "datetime")}</td>
                    <td className="px-4 py-3 text-slate-700">{formatValue(orden.total, "decimal")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default VehicleHistoryPage;
