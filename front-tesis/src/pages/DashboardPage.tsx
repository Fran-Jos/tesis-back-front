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
  tecnicosActivos: number;
};

type DashboardVehiculo = {
  id: number;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  estado?: string | null;
  kmActual?: number | null;
};

type DashboardOrden = {
  id: number;
  codigo: string;
  estado: string | null;
  tipo: string | null;
  fechaApertura: string | null;
  fechaCierre: string | null;
  vehiculoId: number | null;
  vehiculoPlaca: string | null;
};

type DashboardTarea = {
  id: number;
  nombre: string | null;
  estado: string | null;
  asignadoANombre: string | null;
};

type DashboardSummaryResponse = {
  vehiculos: number;
  planesActivos: number;
  ordenesAbiertas: number;
  ordenesCerradas: number;
  alertasPendientes: number;
  tecnicosActivos: number;
  vehiculosList: DashboardVehiculo[];
  ordenesList: DashboardOrden[];
  tareasList: DashboardTarea[];
};

const numberFormatter = new Intl.NumberFormat("es-EC");

const DashboardPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    vehiculos: 0,
    planes: 0,
    ordenesAbiertas: 0,
    ordenesCerradas: 0,
    alertasPendientes: 0,
    tecnicosActivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehiculosList, setVehiculosList] = useState<DashboardVehiculo[]>([]);
  const [ordenesList, setOrdenesList] = useState<DashboardOrden[]>([]);
  const [tareasList, setTareasList] = useState<DashboardTarea[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<DashboardSummaryResponse>("/dashboard/resumen");
        const summary = data ?? ({} as DashboardSummaryResponse);

        const {
          vehiculos = 0,
          planesActivos = 0,
          ordenesAbiertas = 0,
          ordenesCerradas = 0,
          alertasPendientes = 0,
          tecnicosActivos = 0,
          vehiculosList: vehiculosData = [],
          ordenesList: ordenesData = [],
          tareasList: tareasData = [],
        } = summary;

        setMetrics({
          vehiculos,
          planes: planesActivos,
          ordenesAbiertas,
          ordenesCerradas,
          alertasPendientes,
          tecnicosActivos,
        });
        setVehiculosList(Array.isArray(vehiculosData) ? vehiculosData : []);
        setOrdenesList(Array.isArray(ordenesData) ? ordenesData : []);
        setTareasList(Array.isArray(tareasData) ? tareasData : []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los indicadores";
        setError(message);
        setVehiculosList([]);
        setOrdenesList([]);
        setTareasList([]);
        setMetrics({
          vehiculos: 0,
          planes: 0,
          ordenesAbiertas: 0,
          ordenesCerradas: 0,
          alertasPendientes: 0,
          tecnicosActivos: 0,
        });
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

  const maintenanceTrend = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat("es-EC", { month: "short" });
    const formatMonth = (date: Date) => {
      const raw = monthFormatter.format(date).replace(".", "");
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    };

    const parseDate = (value: unknown): Date | null => {
      if (value instanceof Date) {
        return value;
      }
      if (typeof value === "string" && value) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };

    const isSameMonth = (value: Date | null, reference: Date) =>
      !!value && value.getMonth() === reference.getMonth() && value.getFullYear() === reference.getFullYear();

    const now = new Date();
    const labels: string[] = [];
    const closed: number[] = [];
    const opened: number[] = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const current = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      labels.push(formatMonth(current));

      const closedCount = ordenesList.reduce((total, orden) => {
        const fecha = parseDate(orden.fechaCierre);
        return total + (isSameMonth(fecha, current) ? 1 : 0);
      }, 0);

      const openedCount = ordenesList.reduce((total, orden) => {
        const fecha = parseDate(orden.fechaApertura);
        return total + (isSameMonth(fecha, current) ? 1 : 0);
      }, 0);

      closed.push(closedCount);
      opened.push(openedCount);
    }

    return {
      labels,
      series: [
        { name: "Órdenes cerradas", data: closed },
        { name: "Órdenes abiertas", data: opened },
      ],
      closedThisMonth: closed.length > 0 ? closed[closed.length - 1] : 0,
    };
  }, [ordenesList]);

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

  const monthlyVehicleLeaders = useMemo(() => {
    const now = new Date();
    const parseDate = (value: unknown): Date | null => {
      if (value instanceof Date) {
        return value;
      }
      if (typeof value === "string" && value) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };

    const counts = new Map<string, number>();

    ordenesList.forEach((orden) => {
      const fechaCierre = parseDate(orden.fechaCierre);
      if (!fechaCierre || fechaCierre.getMonth() !== now.getMonth() || fechaCierre.getFullYear() !== now.getFullYear()) {
        return;
      }
      const placaRaw = typeof orden.vehiculoPlaca === "string" ? orden.vehiculoPlaca.trim() : "";
      const label = placaRaw
        ? placaRaw
        : typeof orden.vehiculoId === "number"
          ? `Vehículo #${orden.vehiculoId}`
          : "Sin placa";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5);

    return {
      categories: top.map(([label]) => label),
      data: top.map(([, total]) => total),
    };
  }, [ordenesList]);

  const vehicleMileageData = useMemo(() => {
    const sorted = vehiculosList
      .filter((vehiculo) => typeof vehiculo.kmActual === "number")
      .sort((a, b) => Number(b.kmActual ?? 0) - Number(a.kmActual ?? 0))
      .slice(0, 5);

    const categories = sorted.map((vehiculo) => {
      const placa = typeof vehiculo.placa === "string" ? vehiculo.placa : `Vehículo #${vehiculo.id ?? ""}`;
      const modelo = typeof vehiculo.modelo === "string" ? vehiculo.modelo : null;
      return modelo ? `${placa} · ${modelo}` : placa;
    });

    const data = sorted.map((vehiculo) => Number(vehiculo.kmActual ?? 0));

    return { categories, data };
  }, [vehiculosList]);

  const workloadByTechnician = useMemo(() => {
    if (tareasList.length === 0) {
      return { labels: [] as string[], series: [] as number[] };
    }

    const pendientes = tareasList.filter((tarea) => {
      const estado = typeof tarea.estado === "string" ? tarea.estado : "";
      return estado !== "OK";
    });
    const source = pendientes.length > 0 ? pendientes : tareasList;

    const counts = new Map<string, number>();
    source.forEach((tarea) => {
      const nombre = typeof tarea.asignadoANombre === "string" && tarea.asignadoANombre.trim()
        ? (tarea.asignadoANombre as string).trim()
        : "Sin asignar";
      counts.set(nombre, (counts.get(nombre) ?? 0) + 1);
    });

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return {
      labels: sorted.map(([label]) => label),
      series: sorted.map(([, total]) => total),
    };
  }, [tareasList]);

  const totalTecnicosActivos = metrics.tecnicosActivos;

  const tecnicosConTareas = useMemo(() => {
    const asignados = new Set<string>();
    tareasList.forEach((tarea) => {
      if (typeof tarea.asignadoANombre === "string" && tarea.asignadoANombre.trim()) {
        asignados.add((tarea.asignadoANombre as string).trim());
      }
    });
    return asignados.size;
  }, [tareasList]);

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
          <AreaTrendChart
            title="Órdenes de mantenimiento"
            subtitle="Evolución mensual"
            labels={maintenanceTrend.labels}
            series={maintenanceTrend.series}
            loading={loading}
          />
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
              <span className="font-semibold text-slate-900">{numberFormatter.format(maintenanceTrend.closedThisMonth)}</span>
              {" "}
              órdenes se cerraron en el mes actual.
            </p>
            <p>
              <span className="font-semibold text-slate-900">{numberFormatter.format(tecnicosConTareas)}</span> técnicos tienen
              tareas activas asignadas.
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

      <section className="grid gap-6 xl:grid-cols-3">
        <BarComparisonChart
          title="Mantenimientos por vehículo"
          subtitle="Órdenes cerradas en el mes actual"
          categories={monthlyVehicleLeaders.categories}
          series={monthlyVehicleLeaders.data}
          loading={loading}
          seriesName="Órdenes"
        />
        <BarComparisonChart
          title="Kilometraje de la flota"
          subtitle="Top 5 vehículos por kilometraje"
          categories={vehicleMileageData.categories}
          series={vehicleMileageData.data}
          loading={loading}
          seriesName="Kilómetros"
          colors={["#0ea5e9", "#38bdf8", "#0284c7", "#0369a1", "#075985"]}
        />
        <PieDistributionChart
          title="Carga por técnico"
          subtitle="Tareas activas por responsable"
          labels={workloadByTechnician.labels}
          series={workloadByTechnician.series}
          loading={loading}
          colors={["#6366f1", "#22c55e", "#f97316", "#06b6d4", "#f43f5e", "#a855f7"]}
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
            <p className="mt-2 text-sm text-slate-500">Mes en curso</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {loading ? "--" : numberFormatter.format(maintenanceTrend.closedThisMonth)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Equipo técnico</p>
            <p className="mt-2 text-sm text-slate-500">Profesionales activos</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">
              {loading ? "--" : numberFormatter.format(totalTecnicosActivos)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "" : `${numberFormatter.format(tecnicosConTareas)} con tareas asignadas`}
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
