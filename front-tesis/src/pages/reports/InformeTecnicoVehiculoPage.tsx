import { isAxiosError } from "axios";
import { useMemo, useState } from "react";
import api from "../../lib/api";
import { formatValue } from "../../utils/formatters";

type VehiculoResumen = {
  id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  chasis: string | null;
  capacidadCarga: number | null;
  color: string | null;
  kmActual: number | null;
  estado: string | null;
};

type EstadisticasVehiculo = {
  totalPlanes: number;
  planesActivos: number;
  totalOrdenes: number;
  ordenesAbiertas: number;
  ordenesEnProceso: number;
  ordenesCerradas: number;
  ordenesCanceladas: number;
  totalAlertas: number;
  alertasPendientes: number;
  alertasAtendidas: number;
  alertasCanceladas: number;
};

type RegistroKilometrajeResumen = {
  id: number;
  fecha: string | null;
  odometro: number | null;
  registradoPor: string | null;
};

type OrdenResumen = {
  id: number;
  codigo: string | null;
  tipo: string | null;
  estado: string | null;
  fechaApertura: string | null;
  fechaCierre: string | null;
  responsable: string | null;
  total: number | null;
  totalManoObra: number | null;
  totalRepuestos: number | null;
};

type PlanResumen = {
  id: number;
  nombre: string | null;
  frecuenciaKm: number | null;
  frecuenciaDias: number | null;
  proximoKm: number | null;
  proximaFecha: string | null;
  activo: boolean | null;
};

type AlertaResumen = {
  id: number;
  tipo: string | null;
  clasificacion: string | null;
  estado: string | null;
  fechaProgramada: string | null;
  mensaje: string | null;
  planNombre: string | null;
};

type InformeTecnicoVehiculo = {
  vehiculo: VehiculoResumen | null;
  estadisticas: EstadisticasVehiculo | null;
  ultimoKilometraje: RegistroKilometrajeResumen | null;
  ultimaOrden: OrdenResumen | null;
  historialOrdenes: OrdenResumen[];
  planesActivos: PlanResumen[];
  alertasPendientes: AlertaResumen[];
};

const defaultInforme: InformeTecnicoVehiculo = {
  vehiculo: null,
  estadisticas: null,
  ultimoKilometraje: null,
  ultimaOrden: null,
  historialOrdenes: [],
  planesActivos: [],
  alertasPendientes: [],
};

const InformeTecnicoVehiculoPage = () => {
  const [placa, setPlaca] = useState("");
  const [informe, setInforme] = useState<InformeTecnicoVehiculo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const stats = useMemo<{ label: string; value: string }[]>(() => {
    if (!informe?.estadisticas) {
      return [];
    }
    const { estadisticas } = informe;
    return [
      { label: "Planes registrados", value: formatValue(estadisticas.totalPlanes, "number") },
      { label: "Planes activos", value: formatValue(estadisticas.planesActivos, "number") },
      { label: "Órdenes registradas", value: formatValue(estadisticas.totalOrdenes, "number") },
      { label: "Órdenes abiertas", value: formatValue(estadisticas.ordenesAbiertas, "number") },
      { label: "Órdenes cerradas", value: formatValue(estadisticas.ordenesCerradas, "number") },
      { label: "Alertas pendientes", value: formatValue(estadisticas.alertasPendientes, "number") },
      { label: "Alertas atendidas", value: formatValue(estadisticas.alertasAtendidas, "number") },
      { label: "Alertas canceladas", value: formatValue(estadisticas.alertasCanceladas, "number") },
    ];
  }, [informe]);

  const handleBuscar = async () => {
    const normalizedPlaca = placa.trim();
    if (!normalizedPlaca) {
      setError("Ingresa una placa para consultar el informe técnico.");
      setInforme(null);
      return;
    }
    setLoading(true);
    setError(null);
    setDownloadError(null);
    try {
      const response = await api.get<InformeTecnicoVehiculo>(`/vehiculos/informe-tecnico/${encodeURIComponent(normalizedPlaca)}`);
      setInforme(response.data ?? defaultInforme);
    } catch (err) {
      if (isAxiosError(err)) {
        const message = (err.response?.data as { message?: string })?.message;
        setError(message ?? "No se pudo obtener el informe técnico del vehículo.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo obtener el informe técnico del vehículo.");
      }
      setInforme(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async () => {
    if (!informe?.vehiculo?.placa) {
      return;
    }
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const response = await api.get<ArrayBuffer>(
        `/vehiculos/informe-tecnico/${encodeURIComponent(informe.vehiculo.placa)}/pdf`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `informe_tecnico_${informe.vehiculo.placa}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (isAxiosError(err)) {
        const message = (err.response?.data as { message?: string })?.message;
        setDownloadError(message ?? "No se pudo descargar el informe en PDF.");
      } else if (err instanceof Error) {
        setDownloadError(err.message);
      } else {
        setDownloadError("No se pudo descargar el informe en PDF.");
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">Reportes</p>
        <h1 className="text-3xl font-semibold text-slate-900">Informe técnico del vehículo</h1>
        <p className="text-sm text-slate-500">
          Consulta la información consolidada de un vehículo ingresando su placa para revisar métricas, historial y alertas.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="grid gap-4 sm:flex sm:items-end">
          <label className="flex w-full flex-col text-sm font-medium text-slate-600 sm:max-w-xs">
            Placa del vehículo
            <input
              type="text"
              value={placa}
              onChange={(event) => setPlaca(event.target.value.toUpperCase())}
              placeholder="Ej. ABC1234"
              className="mt-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBuscar}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={loading}
            >
              {loading ? "Buscando..." : "Generar informe"}
            </button>
            <button
              type="button"
              onClick={handleDescargar}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={downloadLoading || !informe}
            >
              {downloadLoading ? "Descargando..." : "Descargar PDF"}
            </button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {downloadError ? <p className="mt-3 text-sm text-red-600">{downloadError}</p> : null}
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500 shadow-xl">
          Cargando información técnica del vehículo...
        </div>
      ) : null}

      {!loading && !informe ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-xl">
          Ingresa una placa y genera el informe técnico para visualizar los detalles del vehículo.
        </div>
      ) : null}

      {!loading && informe ? (
        <div className="space-y-8">
          {informe.vehiculo ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Datos del vehículo</h2>
              <dl className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Placa</dt>
                  <dd className="text-sm font-semibold text-slate-900">{informe.vehiculo.placa}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Marca</dt>
                  <dd className="text-sm text-slate-700">{formatValue(informe.vehiculo.marca ?? "-", "text")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Modelo</dt>
                  <dd className="text-sm text-slate-700">{formatValue(informe.vehiculo.modelo ?? "-", "text")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Año</dt>
                  <dd className="text-sm text-slate-700">{formatValue(informe.vehiculo.anio, "number")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Chasis</dt>
                  <dd className="text-sm text-slate-700">{informe.vehiculo.chasis ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Capacidad de carga</dt>
                  <dd className="text-sm text-slate-700">{formatValue(informe.vehiculo.capacidadCarga, "decimal")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Color</dt>
                  <dd className="text-sm text-slate-700">{informe.vehiculo.color ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Kilometraje actual</dt>
                  <dd className="text-sm text-slate-700">{formatValue(informe.vehiculo.kmActual, "number")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Estado</dt>
                  <dd className="text-sm text-slate-700">{formatValue(informe.vehiculo.estado, "enum")}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {stats.length ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Indicadores principales</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {informe.ultimoKilometraje || informe.ultimaOrden ? (
            <section className="grid gap-6 lg:grid-cols-2">
              {informe.ultimoKilometraje ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                  <h2 className="text-lg font-semibold text-slate-900">Último registro de kilometraje</h2>
                  <dl className="mt-4 space-y-2 text-sm text-slate-600">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fecha</dt>
                      <dd>{formatValue(informe.ultimoKilometraje.fecha, "datetime")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Odómetro</dt>
                      <dd>{formatValue(informe.ultimoKilometraje.odometro, "number")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Registrado por</dt>
                      <dd>{informe.ultimoKilometraje.registradoPor ?? "-"}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}

              {informe.ultimaOrden ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                  <h2 className="text-lg font-semibold text-slate-900">Última orden de mantenimiento</h2>
                  <dl className="mt-4 space-y-2 text-sm text-slate-600">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Código</dt>
                      <dd>{informe.ultimaOrden.codigo ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Estado</dt>
                      <dd>{formatValue(informe.ultimaOrden.estado, "enum")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tipo</dt>
                      <dd>{formatValue(informe.ultimaOrden.tipo, "enum")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fecha apertura</dt>
                      <dd>{formatValue(informe.ultimaOrden.fechaApertura, "datetime")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fecha cierre</dt>
                      <dd>{formatValue(informe.ultimaOrden.fechaCierre, "datetime")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Responsable</dt>
                      <dd>{informe.ultimaOrden.responsable ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total</dt>
                      <dd>{formatValue(informe.ultimaOrden.total, "decimal")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Mano de obra</dt>
                      <dd>{formatValue(informe.ultimaOrden.totalManoObra, "decimal")}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">Repuestos</dt>
                      <dd>{formatValue(informe.ultimaOrden.totalRepuestos, "decimal")}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </section>
          ) : null}

          {informe.historialOrdenes.length ? (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Historial reciente de órdenes</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Código</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2">Apertura</th>
                      <th className="px-4 py-2">Cierre</th>
                      <th className="px-4 py-2">Responsable</th>
                      <th className="px-4 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {informe.historialOrdenes.map((orden, index) => (
                      <tr key={orden.id ?? orden.codigo ?? `orden-${index}`}>
                        <td className="px-4 py-2 font-medium text-slate-800">{orden.codigo ?? "-"}</td>
                        <td className="px-4 py-2">{formatValue(orden.estado, "enum")}</td>
                        <td className="px-4 py-2">{formatValue(orden.fechaApertura, "datetime")}</td>
                        <td className="px-4 py-2">{formatValue(orden.fechaCierre, "datetime")}</td>
                        <td className="px-4 py-2">{orden.responsable ?? "-"}</td>
                        <td className="px-4 py-2">{formatValue(orden.total, "decimal")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {informe.planesActivos.length ? (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Planes de mantenimiento activos</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {informe.planesActivos.map((plan, index) => (
                  <div
                    key={plan.id ?? plan.nombre ?? `plan-${index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600"
                  >
                    <p className="text-base font-semibold text-slate-900">{plan.nombre ?? "Plan sin nombre"}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
                      Frecuencia: {formatValue(plan.frecuenciaKm, "number")} km · {formatValue(plan.frecuenciaDias, "number")} días
                    </p>
                    <p className="mt-2">
                      Próximo mantenimiento: {formatValue(plan.proximoKm, "number")} km · {formatValue(plan.proximaFecha, "date")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Alertas pendientes destacadas</h2>
            {informe.alertasPendientes.length ? (
              <ul className="space-y-3">
                {informe.alertasPendientes.map((alerta, index) => (
                  <li
                    key={alerta.id ?? alerta.mensaje ?? `alerta-${index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {formatValue(alerta.tipo, "enum")} · {formatValue(alerta.clasificacion, "enum")}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-400">
                      Programada para {formatValue(alerta.fechaProgramada, "date")}
                    </p>
                    <p className="mt-1">{alerta.mensaje ?? "Sin descripción"}</p>
                    <p className="mt-1 text-xs text-slate-500">Plan asociado: {alerta.planNombre ?? "No asignado"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">El vehículo no registra alertas pendientes en este momento.</p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default InformeTecnicoVehiculoPage;
