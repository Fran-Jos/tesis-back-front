import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type AreaSeries = {
  name: string;
  data: number[];
};

type AreaTrendChartProps = {
  title: string;
  subtitle?: string;
  labels: string[];
  series: AreaSeries[];
  colors?: string[];
  loading?: boolean;
};

const AreaTrendChart = ({ title, subtitle, labels, series, colors, loading }: AreaTrendChartProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const hasData = useMemo(
    () =>
      series.length > 0 &&
      series.some((current) => current.data.some((value) => typeof value === "number" && !Number.isNaN(value) && value > 0)),
    [series],
  );

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      foreColor: "#64748b",
      fontFamily: "Outfit, sans-serif",
      animations: { enabled: true },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    colors: colors ?? ["#6366f1", "#22c55e"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },
    dataLabels: { enabled: false },
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: { sizeOffset: 2 },
    },
    grid: {
      padding: { left: 10, right: 10 },
      strokeDashArray: 6,
    },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "12px",
      fontWeight: 600,
      markers: {
        width: 10,
        height: 10,
        radius: 999,
      },
    },
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {subtitle ? <p className="text-sm font-medium text-slate-500">{subtitle}</p> : null}
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
          Últimos {labels.length} periodos
        </span>
      </div>
      <div className="mt-6 flex flex-1 items-center justify-center">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando información...</div>
        ) : !ready ? null : hasData ? (
          <ReactApexChart options={options} series={series} type="area" height={300} />
        ) : (
          <div className="text-sm text-slate-500">No hay datos suficientes para mostrar.</div>
        )}
      </div>
    </div>
  );
};

export default AreaTrendChart;
