/**
 * Gráfico de dona para visualizar distribuciones (por ejemplo, órdenes por estado).
 *
 * Este componente solamente recibe datos agregados y los proyecta con ApexCharts.
 * Se añade documentación para aclarar cómo se calcula el total y por qué se usan
 * ciertos estilos.
 */
import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type PieDistributionChartProps = {
  title: string;
  subtitle?: string;
  labels: string[];
  series: number[];
  colors?: string[];
  loading?: boolean;
};

const numberFormatter = new Intl.NumberFormat("es-EC");

const PieDistributionChart = ({ title, subtitle, labels, series, colors, loading }: PieDistributionChartProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Forzamos el render únicamente en cliente para evitar discrepancias con SSR.
    setReady(true);
  }, []);

  // Sumatoria de los valores recibidos para mostrarlo dentro de la dona.
  const total = useMemo(() => series.reduce((sum, value) => sum + value, 0), [series]);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      foreColor: "#64748b",
      fontFamily: "Outfit, sans-serif",
    },
    labels,
    colors: colors ?? ["#6366f1", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444"],
    dataLabels: {
      formatter: (value) => `${Math.round(value)}%`,
      dropShadow: { enabled: false },
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    legend: {
      position: "bottom",
      fontSize: "12px",
      fontWeight: 600,
      markers: {
        width: 10,
        height: 10,
        radius: 8,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            value: {
              formatter: (val) => numberFormatter.format(Number(val)),
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total",
              formatter: () => numberFormatter.format(total),
            },
          },
        },
      },
    },
    stroke: {
      width: 0,
    },
    states: {
      hover: { filter: { type: "lighten", value: 0.03 } },
      active: { filter: { type: "darken", value: 0.03 } },
    },
  };

  // Controlamos si existe información válida que justifique renderizar el gráfico.
  const hasData = total > 0;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
      <div>
        {subtitle ? <p className="text-sm font-medium text-slate-500">{subtitle}</p> : null}
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="mt-6 flex flex-1 items-center justify-center">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando información...</div>
        ) : !ready ? null : hasData ? (
          <ReactApexChart options={options} series={series} type="donut" height={280} />
        ) : (
          <div className="text-center text-sm text-slate-500">No hay datos suficientes para mostrar.</div>
        )}
      </div>
    </div>
  );
};

export default PieDistributionChart;
