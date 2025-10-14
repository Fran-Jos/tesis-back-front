import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type BarComparisonChartProps = {
  title: string;
  subtitle?: string;
  categories: string[];
  series: number[];
  colors?: string[];
  loading?: boolean;
  seriesName?: string;
};

const numberFormatter = new Intl.NumberFormat("es-EC");

const BarComparisonChart = ({
  title,
  subtitle,
  categories,
  series,
  colors,
  loading,
  seriesName = "Total",
}: BarComparisonChartProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      foreColor: "#64748b",
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: "55%",
        distributed: true,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => numberFormatter.format(value),
      offsetY: -18,
      style: {
        fontSize: "12px",
        colors: ["#0f172a"],
        fontWeight: 600,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (value) => numberFormatter.format(value),
      },
    },
    legend: { show: false },
    colors: colors ?? ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"],
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (value) => `${numberFormatter.format(value)} ${seriesName.toLowerCase()}`,
      },
    },
  };

  const apexSeries = [{ name: seriesName, data: series }];

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
      <div>
        {subtitle ? <p className="text-sm font-medium text-slate-500">{subtitle}</p> : null}
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="mt-6 flex flex-1 items-center justify-center">
        {loading ? (
          <div className="text-sm text-slate-500">Cargando información...</div>
        ) : !ready ? null : (
          <ReactApexChart options={options} series={apexSeries} type="bar" height={300} />
        )}
      </div>
    </div>
  );
};

export default BarComparisonChart;
