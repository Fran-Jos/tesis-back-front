import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { enumOptions } from "../../config/entities";
import { formatValue } from "../../utils/formatters";

type ReporteRepuesto = {
  id: number;
  nombre: string | null;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
};

type ReporteTarea = {
  id: number;
  nombre: string | null;
  descripcion: string;
  estado: string;
  asignadoANombre: string | null;
  horas: number | null;
  costoManoObra: number | null;
  totalRepuestos: number | null;
  totalTarea: number | null;
  repuestos: ReporteRepuesto[];
};

type ReporteOrden = {
  ordenId: number;
  codigo: string;
  tipo: string;
  estado: string;
  vehiculoPlaca: string;
  vehiculoDescripcion: string | null;
  planNombre: string | null;
  responsableNombre: string | null;
  fechaApertura: string | null;
  fechaCierre: string | null;
  totalManoObra: number | null;
  totalRepuestos: number | null;
  subtotal: number | null;
  ivaValor: number | null;
  total: number | null;
  tareas: ReporteTarea[];
};

type VehiculoOption = {
  value: string;
  label: string;
};

type FiltersState = {
  desde: string;
  hasta: string;
  vehiculoId: string;
  estado: string;
};

const defaultFilters: FiltersState = {
  desde: "",
  hasta: "",
  vehiculoId: "",
  estado: "",
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
  if (filters.estado) {
    params.estado = filters.estado;
  }
  return params;
};

const MantenimientoDetalladoReportPage = () => {
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]);
  const [reportes, setReportes] = useState<ReporteOrden[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  const estadoOptions = useMemo(() => enumOptions.estadoOrden ?? [], []);

  const handleBuscar = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams(filters);
      const response = await api.get("/ordenes/reportes/detallado", { params });
      const data = Array.isArray(response.data) ? (response.data as ReporteOrden[]) : [];
      setReportes(data);
      if (!data.length) {
        setError("No se encontraron resultados para los filtros seleccionados.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo generar el reporte";
      setError(message);
      setReportes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarPorCodigo = async () => {
    if (!codigoBusqueda.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ReporteOrden>(`/ordenes/reportes/detallado/codigo/${codigoBusqueda.trim()}`);
      setReportes([response.data]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se encontró una orden con ese código";
      setError(message);
      setReportes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPdf = async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const params = buildParams(filters);
      const response = await api.get<ArrayBuffer>("/ordenes/reportes/detallado/pdf", {
        params,
        responseType: "arraybuffer",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reporte_mantenimiento_detallado.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo descargar el PDF";
      setDownloadError(message);
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">Reportes</p>
        <h1 className="text-3xl font-semibold text-slate-900">Reporte detallado de mantenimiento</h1>
        <p className="text-sm text-slate-500">
          Consulta órdenes cerradas o en proceso con el detalle de tareas y repuestos utilizados.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Filtros por rango</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-600">
              Fecha desde
              <input
                type="datetime-local"
                value={filters.desde}
                onChange={(event) => setFilters((prev) => ({ ...prev, desde: event.target.value }))}
                className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-600">
              Fecha hasta
              <input
                type="datetime-local"
                value={filters.hasta}
                onChange={(event) => setFilters((prev) => ({ ...prev, hasta: event.target.value }))}
                className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-600">
              Vehículo
              <select
                value={filters.vehiculoId}
                onChange={(event) => setFilters((prev) => ({ ...prev, vehiculoId: event.target.value }))}
                className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Todos</option>
                {vehiculos.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-600">
              Estado de la orden
              <select
                value={filters.estado}
                onChange={(event) => setFilters((prev) => ({ ...prev, estado: event.target.value }))}
                className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Todos</option>
                {estadoOptions.map((option) => (
                  <option key={option.value as string} value={option.value as string}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleBuscar}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={loading}
            >
              {loading ? "Buscando..." : "Generar reporte"}
            </button>
            <button
              type="button"
              onClick={handleDescargarPdf}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={downloadLoading}
            >
              {downloadLoading ? "Descargando..." : "Descargar PDF"}
            </button>
          </div>
          {downloadError ? (
            <p className="text-sm text-red-600">{downloadError}</p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Buscar por código</h2>
          <p className="text-sm text-slate-500">
            Ingresa el código exacto de la orden para obtener el detalle inmediatamente.
          </p>
          <input
            type="text"
            value={codigoBusqueda}
            onChange={(event) => setCodigoBusqueda(event.target.value)}
            placeholder="Ej. OM-2024-0012"
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="button"
            onClick={handleBuscarPorCodigo}
            className="inline-flex items-center justify-center rounded-2xl border border-indigo-200 bg-white px-5 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            Buscar orden
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      <section className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-xl">
            Cargando información...
          </div>
        ) : null}

        {!loading && !reportes.length ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-xl">
            Utiliza los filtros para generar un reporte detallado.
          </div>
        ) : null}

        {reportes.map((orden) => (
          <article key={orden.ordenId} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <header className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Orden</p>
                <p className="text-base font-semibold text-slate-900">{orden.codigo}</p>
                <p className="text-sm text-slate-500">{formatValue(orden.tipo, "enum")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Estado</p>
                <p className="text-base font-semibold text-slate-900">{formatValue(orden.estado, "enum")}</p>
                <p className="text-sm text-slate-500">{orden.responsableNombre ?? "Sin responsable"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Vehículo</p>
                <p className="text-base font-semibold text-slate-900">{orden.vehiculoPlaca}</p>
                <p className="text-sm text-slate-500">{orden.vehiculoDescripcion ?? "Sin detalle"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Totales</p>
                <p className="text-base font-semibold text-slate-900">
                  {formatValue(orden.total, "decimal")}
                </p>
                <p className="text-sm text-slate-500">
                  Mano de obra: {formatValue(orden.totalManoObra, "decimal")} · Repuestos: {formatValue(orden.totalRepuestos, "decimal")}
                </p>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Plan asociado</p>
                <p className="text-sm text-slate-600">{orden.planNombre ?? "No aplica"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Apertura</p>
                <p className="text-sm text-slate-600">{formatValue(orden.fechaApertura, "datetime")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Cierre</p>
                <p className="text-sm text-slate-600">{formatValue(orden.fechaCierre, "datetime")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Tareas</h3>
              {orden.tareas.length === 0 ? (
                <p className="text-sm text-slate-500">No hay tareas registradas para esta orden.</p>
              ) : (
                <div className="space-y-4">
                  {orden.tareas.map((tarea) => (
                    <div key={tarea.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {tarea.nombre ?? tarea.descripcion}
                          </p>
                          <p className="text-xs uppercase tracking-widest text-indigo-500">{formatValue(tarea.estado, "enum")}</p>
                        </div>
                        <div className="text-sm text-slate-500">
                          {tarea.asignadoANombre ? `Asignado a ${tarea.asignadoANombre}` : "Sin asignación"}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          Horas: {formatValue(tarea.horas, "decimal")}
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          Mano de obra: {formatValue(tarea.costoManoObra, "decimal")}
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          Total tarea: {formatValue(tarea.totalTarea, "decimal")}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-slate-800">Repuestos utilizados</p>
                        {tarea.repuestos.length === 0 ? (
                          <p className="text-sm text-slate-500">No se registraron repuestos para esta tarea.</p>
                        ) : (
                          <ul className="space-y-2">
                            {tarea.repuestos.map((repuesto) => (
                              <li
                                key={repuesto.id}
                                className="flex flex-col gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800">
                                    {repuesto.nombre ?? repuesto.descripcion}
                                  </span>
                                  {repuesto.descripcion && repuesto.nombre !== repuesto.descripcion ? (
                                    <span className="text-xs text-slate-500">{repuesto.descripcion}</span>
                                  ) : null}
                                </div>
                                <span>
                                  Cant.: {formatValue(repuesto.cantidad, "decimal")} · Costo unit.: {formatValue(repuesto.costoUnitario, "decimal")}
                                </span>
                                <span className="font-semibold text-slate-900">{formatValue(repuesto.costoTotal, "decimal")}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default MantenimientoDetalladoReportPage;
