/**
 * Dashboard principal de la aplicación.
 *
 * Centraliza todas las consultas necesarias para mostrar métricas de vehículos,
 * planes, órdenes y alertas. Los comentarios a lo largo del archivo explican
 * cómo se normalizan los datos y de qué endpoint proviene cada sección.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AreaTrendChart from "../components/charts/AreaTrendChart";
import BarComparisonChart from "../components/charts/BarComparisonChart";
import GoalRadialChart from "../components/charts/GoalRadialChart";
import PieDistributionChart from "../components/charts/PieDistributionChart";
import MetricCard from "../components/ui/MetricCard";
import api from "../lib/api";
import useAuth from "../hooks/useAuth";

type DashboardMetrics = {
  vehiculos: number;
  planes: number;
  ordenesAbiertas: number;
  ordenesCerradas: number;
  alertasPendientes: number;
};

const numberFormatter = new Intl.NumberFormat("es-EC");
const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DashboardPage = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  // Guardamos los totales principales que se muestran en las tarjetas superiores.
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    vehiculos: 0,
    planes: 0,
    ordenesAbiertas: 0,
    ordenesCerradas: 0,
    alertasPendientes: 0,
  });
  // Estados para manejar el ciclo de vida de la petición HTTP.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Listas completas que obtenemos desde la API. Se usan para crear analíticas más ricas.
  const [vehiculosList, setVehiculosList] = useState<Record<string, unknown>[]>([]);
  const [planesList, setPlanesList] = useState<Record<string, unknown>[]>([]);
  const [ordenesList, setOrdenesList] = useState<Record<string, unknown>[]>([]);
  const [alertasList, setAlertasList] = useState<Record<string, unknown>[]>([]);
  const [tareasList, setTareasList] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    // Descargamos toda la información relevante del backend al cargar el dashboard.
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const [vehiculosRes, planesRes, ordenesRes, tareasRes, alertasRes] = await Promise.all([
          api.get("/vehiculos"),
          api.get("/planes/activos"),
          api.get("/ordenes"),
          api.get("/tareas"),
          api.get("/alertas/mis-alertas"),
        ]);

        const vehiculos = Array.isArray(vehiculosRes.data) ? vehiculosRes.data : [];
        const planes = Array.isArray(planesRes.data) ? planesRes.data : [];
        const ordenes = Array.isArray(ordenesRes.data) ? ordenesRes.data : [];
        const tareas = Array.isArray(tareasRes.data) ? tareasRes.data : [];
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
        setPlanesList(planes);
        setOrdenesList(ordenes);
        setTareasList(tareas);
        setAlertasList(alertas);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudieron cargar los indicadores";
        setError(message);
        setVehiculosList([]);
        setPlanesList([]);
        setOrdenesList([]);
        setAlertasList([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchMetrics();
  }, []);

  // Filtrados relacionados al usuario autenticado: órdenes donde es responsable o tiene tareas asignadas; planes asociados.
  const relatedOrders = useMemo(() => {
    if (!authUser) return [] as Record<string, unknown>[];
    const userId = Number(authUser.usuarioId);
    // órdenes donde es responsable
    const ordResponsable = ordenesList.filter((o) => Number(o.responsableId) === userId);
    // órdenes que contienen tareas asignadas al usuario
    const ordenesDesdeTareasIds = new Set<number>();
    tareasList.forEach((t) => {
      if (Number(t.asignadoAId) === userId && t.ordenId) {
        ordenesDesdeTareasIds.add(Number(t.ordenId));
      }
    });
    const ordDesdeTareas = ordenesList.filter((o) => ordenesDesdeTareasIds.has(Number(o.id)));
    const map = new Map<number, Record<string, unknown>>();
    ordResponsable.concat(ordDesdeTareas).forEach((o) => map.set(Number(o.id), o));
    return Array.from(map.values());
  }, [authUser, ordenesList, tareasList]);

  const relatedTasks = useMemo(() => {
    if (!authUser) return [] as Record<string, unknown>[];
    const userId = Number(authUser.usuarioId);
    return tareasList.filter((t) => Number(t.asignadoAId) === userId);
  }, [authUser, tareasList]);

  const relatedPlans = useMemo(() => {
    if (!authUser) return [] as Record<string, unknown>[];
    // planes asociados a los vehículos de las órdenes relacionadas
    const vehiculoIds = new Set<number>(relatedOrders.map((o) => Number(o.vehiculoId ?? -1)).filter((id) => id > 0));
    return planesList.filter((p) => vehiculoIds.has(Number(p.vehiculoId)));
  }, [authUser, planesList, relatedOrders]);

  // Calculamos el porcentaje de cumplimiento preventivo a partir de las órdenes cerradas.
  const cumplimientoPreventivo = useMemo(() => {
    const total = metrics.ordenesAbiertas + metrics.ordenesCerradas;
    if (total === 0) {
      return 0;
    }
    return Math.round((metrics.ordenesCerradas / total) * 100);
  }, [metrics.ordenesAbiertas, metrics.ordenesCerradas]);

  // Agrupamos las órdenes por estado para alimentar el gráfico de pastel.
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
      counts[estado] = (counts[estado] ?? 0) + 1;
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

  // Agrupamos los vehículos por estado operativo para alimentar el gráfico de barras.
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
      counts[estado] = (counts[estado] ?? 0) + 1;
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

  // Calculamos qué porcentaje de la flota cuenta con un plan preventivo registrado en la API.
  const coberturaPlanes = useMemo(() => {
    const vehiculosIds = new Set(
      vehiculosList
        .map((vehiculo) => (typeof vehiculo.id === "string" ? vehiculo.id : null))
        .filter((id): id is string => Boolean(id)),
    );

    const vehiculosConPlan = new Set(
      planesList
        .map((plan) => (typeof plan.vehiculoId === "string" ? plan.vehiculoId : null))
        .filter((id): id is string => Boolean(id)),
    );

    const totalVehiculos = vehiculosIds.size || vehiculosList.length;
    const conPlan = Array.from(vehiculosIds).filter((id) => vehiculosConPlan.has(id)).length;
    const sinPlan = Math.max(totalVehiculos - conPlan, 0);

    return {
      labels: ["Con plan", "Sin plan"],
      series: [conPlan, sinPlan],
      porcentajeConPlan: totalVehiculos === 0 ? 0 : Math.round((conPlan / totalVehiculos) * 100),
    };
  }, [planesList, vehiculosList]);

  // Construimos un ranking con los vehículos que más intervenciones han tenido.
  const rankingVehiculosPorOrdenes = useMemo(() => {
    const counts = new Map<
      string,
      {
        total: number;
        placa: string;
        descripcion: string;
      }
    >();

    ordenesList.forEach((orden) => {
      const rawId = typeof orden.vehiculoId === "string" ? orden.vehiculoId : null;
      const placa = typeof orden.vehiculoPlaca === "string" ? orden.vehiculoPlaca : rawId ?? "Sin identificar";
      const descripcion =
        typeof orden.vehiculoDescripcion === "string" ? orden.vehiculoDescripcion : "Sin descripción disponible";
      const key = rawId ?? placa;

      if (!counts.has(key)) {
        counts.set(key, { total: 0, placa, descripcion });
      }

      const current = counts.get(key);
      if (current) {
        current.total += 1;
      }
    });

    const ranking = Array.from(counts.values()).sort((a, b) => b.total - a.total);

    return {
      top: ranking[0] ?? null,
      listado: ranking.slice(0, 5),
    };
  }, [ordenesList]);

  // Determinamos qué vehículos no tienen un plan activo asociado para priorizar la planificación.
  const vehiculosSinPlan = useMemo(() => {
    const planesPorVehiculo = new Set(
      planesList
        .map((plan) => (typeof plan.vehiculoId === "string" ? plan.vehiculoId : null))
        .filter((id): id is string => Boolean(id)),
    );

    return vehiculosList
      .map((vehiculo) => {
        const id = typeof vehiculo.id === "string" ? vehiculo.id : null;
        const placa = typeof vehiculo.placa === "string" ? vehiculo.placa : "Sin placa";
        const marca = typeof vehiculo.marca === "string" ? vehiculo.marca : "Marca no registrada";
        return {
          id,
          placa,
          marca,
          tienePlan: id ? planesPorVehiculo.has(id) : false,
        };
      })
      .filter((item) => !item.tienePlan)
      .slice(0, 5);
  }, [planesList, vehiculosList]);

  // Ordenamos las alertas más próximas para mostrar qué tareas vencen antes.
  const alertasProximas = useMemo(() => {
    return [...alertasList]
      .map((alerta) => {
        const fechaTexto = typeof alerta.fechaProgramada === "string" ? alerta.fechaProgramada : null;
        const fecha = fechaTexto ? new Date(fechaTexto) : null;
        return {
          fecha,
          fechaTexto,
          vehiculo: typeof alerta.vehiculoPlaca === "string" ? alerta.vehiculoPlaca : "Vehículo sin placa",
          plan: typeof alerta.planNombre === "string" ? alerta.planNombre : "Plan sin nombre",
        };
      })
      .filter((alerta) => Boolean(alerta.fecha))
      .sort((a, b) => (a.fecha && b.fecha ? a.fecha.getTime() - b.fecha.getTime() : 0))
      .slice(0, 5);
  }, [alertasList]);

  // Calculamos el tiempo promedio (en días) que tardan las órdenes en cerrarse.
  const tiempoPromedioCierre = useMemo(() => {
    const duraciones: number[] = [];

    ordenesList.forEach((orden) => {
      const aperturaTexto = typeof orden.fechaApertura === "string" ? orden.fechaApertura : null;
      const cierreTexto = typeof orden.fechaCierre === "string" ? orden.fechaCierre : null;
      if (!aperturaTexto || !cierreTexto) {
        return;
      }

      const apertura = new Date(aperturaTexto);
      const cierre = new Date(cierreTexto);
      const diffMs = cierre.getTime() - apertura.getTime();
      if (Number.isFinite(diffMs) && diffMs >= 0) {
        duraciones.push(diffMs / (1000 * 60 * 60 * 24));
      }
    });

    if (duraciones.length === 0) {
      return {
        dias: null,
        texto: "Sin datos de cierre disponibles",
      };
    }

    const promedio = duraciones.reduce((sum, dias) => sum + dias, 0) / duraciones.length;

    return {
      dias: promedio,
      texto: `${promedio.toFixed(1)} días promedio`,
    };
  }, [ordenesList]);

  // Seleccionamos las órdenes más recientes para brindar contexto operativo inmediato.
  const ordenesRecientes = useMemo(() => {
    return [...ordenesList]
      .map((orden) => {
        const aperturaTexto = typeof orden.fechaApertura === "string" ? orden.fechaApertura : null;
        const apertura = aperturaTexto ? new Date(aperturaTexto) : null;
        return {
          codigo: typeof orden.codigo === "string" ? orden.codigo : "Sin código",
          vehiculo: typeof orden.vehiculoPlaca === "string" ? orden.vehiculoPlaca : "Vehículo no asignado",
          estado: typeof orden.estado === "string" ? orden.estado : "Sin estado",
          apertura,
          aperturaTexto,
        };
      })
      .filter((orden) => Boolean(orden.apertura))
      .sort((a, b) => (a.apertura && b.apertura ? b.apertura.getTime() - a.apertura.getTime() : 0))
      .slice(0, 5);
  }, [ordenesList]);

  return (
    <div className="space-y-10">
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">{error}</div>
      ) : null}

      {/* Información: órdenes, planes y tareas asignadas al usuario */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Información</h2>
        <p className="mt-1 text-sm text-slate-500">Resumen de órdenes, planes y tareas asignadas a tu usuario.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium">Órdenes</h3>
            {relatedOrders.length === 0 ? (
              <div className="text-sm text-slate-500 mt-2">No hay órdenes asignadas o relacionadas.</div>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {relatedOrders.map((o) => (
                  <li key={String(o.id)} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{String(o.codigo ?? `Orden #${o.id}`)}</div>
                      <div className="text-xs text-slate-500">{String(o.vehiculoPlaca ?? "-")} · {String(o.estado ?? "-")}</div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/ordenes/${o.id}`)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Ver
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium">Planes</h3>
            {relatedPlans.length === 0 ? (
              <div className="text-sm text-slate-500 mt-2">No hay planes relacionados.</div>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {relatedPlans.map((p) => (
                  <li key={String(p.id)}>
                    <div className="font-medium">{String(p.nombre ?? `Plan #${p.id}`)}</div>
                    <div className="text-xs text-slate-500">{String(p.vehiculoPlaca ?? "-")} · Próx: {String(p.proximaFecha ?? "-")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium">Tareas asignadas</h3>
            {relatedTasks.length === 0 ? (
              <div className="text-sm text-slate-500 mt-2">No tienes tareas asignadas.</div>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {relatedTasks.map((t) => (
                  <li key={String(t.id)} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{String(t.descripcion ?? `Tarea #${t.id}`)}</div>
                      <div className="text-xs text-slate-500">Orden: {String(t.ordenId ?? "-")}</div>
                    </div>
                    <div>
                      {t.ordenId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/app/ordenes/${t.ordenId}`)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Ver orden
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

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

      {/* Bloque de tarjetas con hallazgos clave adicionales. */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Vehículo destacado</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Mayor cantidad de intervenciones</h3>
          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p className="text-base font-semibold text-slate-900">
              {rankingVehiculosPorOrdenes.top ? rankingVehiculosPorOrdenes.top.placa : "Sin registros"}
            </p>
            <p>{rankingVehiculosPorOrdenes.top ? rankingVehiculosPorOrdenes.top.descripcion : "Aún no hay órdenes."}</p>
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest text-indigo-500">
            {rankingVehiculosPorOrdenes.top ? `${rankingVehiculosPorOrdenes.top.total} intervenciones acumuladas` : "Sin información"}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Ritmo de resolución</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Tiempo promedio de cierre</h3>
          <p className="mt-6 text-3xl font-semibold text-slate-900">
            {tiempoPromedioCierre.dias === null ? "--" : `${tiempoPromedioCierre.dias.toFixed(1)} días`}
          </p>
          <p className="mt-2 text-sm text-slate-600">{tiempoPromedioCierre.texto}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Cobertura de planes</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Flota con planificación</h3>
          <p className="mt-6 text-3xl font-semibold text-slate-900">{coberturaPlanes.porcentajeConPlan}%</p>
          <p className="mt-2 text-sm text-slate-600">Basado en vehículos registrados en la API.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Alertas monitoreadas</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Próximos vencimientos</h3>
          <p className="mt-6 text-3xl font-semibold text-slate-900">{alertasProximas.length}</p>
          <p className="mt-2 text-sm text-slate-600">Alertas priorizadas para los siguientes días.</p>
        </div>
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

      {/* Analítica de cobertura de planes en formato de gráfico para comparar proporciones. */}
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Planificación preventiva</p>
            <h2 className="text-lg font-semibold text-slate-900">Distribución de cobertura</h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
            {loading ? "Calculando..." : `${coberturaPlanes.porcentajeConPlan}% con plan`}
          </span>
        </div>
        <div className="mt-6 max-w-xl">
          <PieDistributionChart
            title="Cobertura de planes"
            subtitle="Comparación entre vehículos con y sin planificación"
            labels={coberturaPlanes.labels}
            series={coberturaPlanes.series}
            loading={loading}
          />
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

      {/* Listados operativos para la toma de decisiones diaria. */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Ranking de flota</p>
              <h2 className="text-lg font-semibold text-slate-900">Vehículos con más intervenciones</h2>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
              {rankingVehiculosPorOrdenes.listado.length} vehículos
            </span>
          </div>
          <ul className="mt-6 space-y-4">
            {rankingVehiculosPorOrdenes.listado.map((vehiculo, index) => (
              <li key={`${vehiculo.placa}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{vehiculo.placa}</p>
                  <p className="text-xs text-slate-500">{vehiculo.descripcion}</p>
                </div>
                <span className="text-sm font-semibold text-indigo-600">{vehiculo.total} órdenes</span>
              </li>
            ))}
            {rankingVehiculosPorOrdenes.listado.length === 0 ? (
              <li className="rounded-2xl bg-white/70 p-4 text-sm text-slate-500">Aún no hay órdenes registradas.</li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Próximas tareas</p>
              <h2 className="text-lg font-semibold text-slate-900">Alertas priorizadas</h2>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
              {alertasProximas.length} alertas
            </span>
          </div>
          <ul className="mt-6 space-y-4">
            {alertasProximas.map((alerta, index) => (
              <li key={`${alerta.vehiculo}-${index}`} className="rounded-2xl bg-white/70 p-4">
                <p className="text-sm font-semibold text-slate-900">{alerta.vehiculo}</p>
                <p className="text-xs text-slate-500">{alerta.plan}</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-orange-500">
                  {alerta.fecha ? dateFormatter.format(alerta.fecha) : alerta.fechaTexto ?? "Sin fecha"}
                </p>
              </li>
            ))}
            {alertasProximas.length === 0 ? (
              <li className="rounded-2xl bg-white/70 p-4 text-sm text-slate-500">No hay alertas próximas para mostrar.</li>
            ) : null}
          </ul>
        </div>
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

      {/* Seguimiento de pendientes de planificación para priorizar recursos. */}
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Planificación pendiente</p>
            <h2 className="text-lg font-semibold text-slate-900">Vehículos sin plan asignado</h2>
          </div>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
            {vehiculosSinPlan.length} vehículos prioritarios
          </span>
        </div>
        <ul className="mt-6 space-y-4">
          {vehiculosSinPlan.map((vehiculo) => (
            <li key={vehiculo.id ?? vehiculo.placa} className="rounded-2xl bg-white/70 p-4">
              <p className="text-sm font-semibold text-slate-900">{vehiculo.placa}</p>
              <p className="text-xs text-slate-500">{vehiculo.marca}</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-rose-500">Sin plan preventivo asociado</p>
            </li>
          ))}
          {vehiculosSinPlan.length === 0 ? (
            <li className="rounded-2xl bg-white/70 p-4 text-sm text-slate-500">Todos los vehículos cuentan con un plan asignado.</li>
          ) : null}
        </ul>
      </section>

      {/* Bitácora rápida de las últimas órdenes registradas. */}
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Actividad reciente</p>
            <h2 className="text-lg font-semibold text-slate-900">Últimas órdenes creadas</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {ordenesRecientes.length} registros
          </span>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Vehículo</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Fecha de apertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordenesRecientes.map((orden) => (
                <tr key={orden.codigo} className="bg-white/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">{orden.codigo}</td>
                  <td className="px-4 py-3 text-slate-600">{orden.vehiculo}</td>
                  <td className="px-4 py-3 text-slate-600">{orden.estado}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {orden.apertura ? dateFormatter.format(orden.apertura) : orden.aperturaTexto ?? "Sin fecha"}
                  </td>
                </tr>
              ))}
              {ordenesRecientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-center text-sm text-slate-500">
                    No hay órdenes recientes registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
