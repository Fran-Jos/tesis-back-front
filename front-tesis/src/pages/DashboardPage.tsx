import { useEffect, useMemo, useState } from "react";
import AreaTrendChart from "../components/charts/AreaTrendChart";
import BarComparisonChart from "../components/charts/BarComparisonChart";
import GoalRadialChart from "../components/charts/GoalRadialChart";
import PieDistributionChart from "../components/charts/PieDistributionChart";
import MetricCard from "../components/ui/MetricCard";
import api from "../lib/api";

type DashboardMetrics = {
  vehiculos: number;
  planes: number;
  ordenesAbiertas: number;
  ordenesCerradas: number;
  alertasPendientes: number;
};

const numberFormatter = new Intl.NumberFormat("es-EC");

const DashboardPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    vehiculos: 0,
    planes: 0,
    ordenesAbiertas: 0,
    ordenesCerradas: 0,
    alertasPendientes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehiculosList, setVehiculosList] = useState<Record<string, unknown>[]>([]);
  const [ordenesList, setOrdenesList] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const [vehiculosRes, planesRes, ordenesRes, alertasRes] = await Promise.all([
          api.get("/vehiculos"),
          api.get("/planes/activos"),
          api.get("/ordenes"),
          api.get("/alertas/proximas", { params: { dias: 30 } }),
        ]);

        const vehiculos = Array.isArray(vehiculosRes.data) ? vehiculosRes.data : [];
        const planes = Array.isArray(planesRes.data) ? planesRes.data : [];
        const ordenes = Array.isArray(ordenesRes.data) ? ordenesRes.data : [];
        const alertas = Array.isArray(alertasRes.data) ? alertasRes.data : [];

        const ordenesAbiertas = ordenes.filter(
          (orden) => orden.estado === "ABIERTA" || orden.estado === "EN_PROCESO",
        ).length;
        const ordenesCerradas = ordenes.filter((orden) => orden.estado === "CERRADA").length;

        setMetrics({
          vehiculos: vehiculos.length,
          planes: planes.length,
          ordenesAbiertas,
          ordenesCerradas,
          alertasPendientes: alertas.length,
        });
        setVehiculosList(vehiculos);
        setOrdenesList(ordenes);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los indicadores";
        setError(message);
        setVehiculosList([]);
        setOrdenesList([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchMetrics();
  }, []);

  const cumplimientoPreventivo = useMemo(() => {
    const total = metrics.ordenesAbiertas + metrics.ordenesCerradas;
    if (total === 0) {
      return 0;
    }
    return Math.round((metrics.ordenesCerradas / total) * 100);
  }, [metrics.ordenesAbiertas, metrics.ordenesCerradas]);

  const ordenesPorEstado = useMemo(() => {
    const statusOrder = ["ABIERTA", "EN_PROCESO", "CERRADA", "CANCELADA"] as const;
    const statusLabels: Record<(typeof statusOrder)[number], string> = {
      ABIERTA: "Abiertas",
      EN_PROCESO: "En proceso",
      CERRADA: "Cerradas",
      CANCELADA: "Canceladas",
    };

    const counts: Record<string, number> = {};
    statusOrder.forEach((status) => {
      counts[status] = 0;
    });

    ordenesList.forEach((orden) => {
      const estado = typeof orden.estado === "string" ? orden.estado : null;
      if (!estado) {
        return;
      }
      if (!(estado in counts)) {
        counts[estado] = 0;
      }
      counts[estado] += 1;
    });

    const labels = statusOrder.map((status) => statusLabels[status]);
    const series = statusOrder.map((status) => counts[status] ?? 0);

    const extraStatuses = Object.keys(counts).filter(
      (status): status is string => !statusOrder.includes(status as (typeof statusOrder)[number]),
    );
    if (extraStatuses.length > 0) {
      const extraTotal = extraStatuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
      if (extraTotal > 0) {
        labels.push("Otros");
        series.push(extraTotal);
      }
    }

    return { labels, series };
  }, [ordenesList]);

  const vehiculosPorEstado = useMemo(() => {
    const statusOrder = ["ACTIVO", "INACTIVO"] as const;
    const statusLabels: Record<(typeof statusOrder)[number], string> = {
      ACTIVO: "Activos",
      INACTIVO: "Inactivos",
    };

    const counts: Record<string, number> = {};
    statusOrder.forEach((status) => {
      counts[status] = 0;
    });

    vehiculosList.forEach((vehiculo) => {
      const estado = typeof vehiculo.estado === "string" ? vehiculo.estado : null;
      if (!estado) {
        return;
      }
      if (!(estado in counts)) {
        counts[estado] = 0;
      }
      counts[estado] += 1;
    });

    const labels = statusOrder.map((status) => statusLabels[status]);
    const series = statusOrder.map((status) => counts[status] ?? 0);

    const extraStatuses = Object.keys(counts).filter(
      (status): status is string => !statusOrder.includes(status as (typeof statusOrder)[number]),
    );
    if (extraStatuses.length > 0) {
      const extraTotal = extraStatuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
      if (extraTotal > 0) {
        labels.push("Otros");
        series.push(extraTotal);
      }
    }

    return { labels, series };
  }, [vehiculosList]);

  return (
    <div className="space-y-10">
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">{error}</div>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Vehículos registrados"
          value={numberFormatter.format(metrics.vehiculos)}
          delta={metrics.vehiculos > 0 ? "+100%" : ""}
          trend="up"
          caption="Unidades de transporte gestionadas"
        />
        <MetricCard
          title="Planes activos"
          value={numberFormatter.format(metrics.planes)}
          delta={metrics.planes > 0 ? "+12%" : ""}
          trend="up"
          caption="Programas preventivos en curso"
        />
        <MetricCard
          title="Órdenes en progreso"
          value={numberFormatter.format(metrics.ordenesAbiertas)}
          delta={metrics.ordenesAbiertas > 0 ? "+6%" : ""}
          trend={metrics.ordenesAbiertas > metrics.ordenesCerradas ? "up" : "down"}
          caption="Incluye órdenes abiertas y en proceso"
        />
        <MetricCard
          title="Alertas próximas"
          value={numberFormatter.format(metrics.alertasPendientes)}
          delta={metrics.alertasPendientes > 0 ? "+3%" : ""}
          trend={metrics.alertasPendientes > 0 ? "up" : "down"}
          caption="Eventos programados para los próximos 30 días"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaTrendChart />
        </div>
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <div>
            <p className="text-sm font-medium text-slate-500">Ejecución preventiva</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Cumplimiento de planes</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <GoalRadialChart label="Cerradas" value={cumplimientoPreventivo} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <GoalRadialChart label="Pendientes" value={100 - cumplimientoPreventivo} color="#f97316" />
            </div>
          </div>
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">{numberFormatter.format(metrics.ordenesCerradas)}</span> órdenes se
              cerraron en el periodo reciente.
            </p>
            <p>
              <span className="font-semibold text-slate-900">{numberFormatter.format(metrics.alertasPendientes)}</span> alertas
              requieren seguimiento durante los próximos 30 días.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PieDistributionChart
          title="Distribución de órdenes"
          subtitle="Estado actual de mantenimiento"
          labels={ordenesPorEstado.labels}
          series={ordenesPorEstado.series}
          loading={loading}
        />
        <BarComparisonChart
          title="Estado de la flota"
          subtitle="Vehículos por disponibilidad"
          categories={vehiculosPorEstado.labels}
          series={vehiculosPorEstado.series}
          loading={loading}
          seriesName="Vehículos"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Seguimiento en tiempo real</p>
            <h2 className="text-lg font-semibold text-slate-900">Resumen operativo</h2>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
            Actualizado {loading ? "..." : "hoy"}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Flota</p>
            <p className="mt-2 text-sm text-slate-500">Vehículos con planes asignados</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {loading ? "--" : `${Math.round((metrics.planes / Math.max(metrics.vehiculos, 1)) * 100)}%`}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Órdenes cerradas</p>
            <p className="mt-2 text-sm text-slate-500">Últimos 30 días</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {loading ? "--" : numberFormatter.format(metrics.ordenesCerradas)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Alertas activas</p>
            <p className="mt-2 text-sm text-slate-500">Requieren planificación</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {loading ? "--" : numberFormatter.format(metrics.alertasPendientes)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Órdenes abiertas</p>
            <p className="mt-2 text-sm text-slate-500">Monitoreadas por el equipo</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {loading ? "--" : numberFormatter.format(metrics.ordenesAbiertas)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
