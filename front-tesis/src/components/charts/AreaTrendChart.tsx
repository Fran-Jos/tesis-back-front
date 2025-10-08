import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type Series = {
  name: string;
  data: number[];
}[];

const AreaTrendChart = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      foreColor: "#64748b",
      fontFamily: "Outfit, sans-serif",
      sparkline: { enabled: true },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    colors: ["#6366f1", "#22c55e"],
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
    grid: {
      padding: { left: 10, right: 10 },
    },
    xaxis: {
      categories: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: false,
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

  const series: Series = [
    {
      name: "Revenue",
      data: [28, 32, 31, 36, 42, 46, 54, 61, 66],
    },
    {
      name: "Opportunities",
      data: [18, 22, 28, 31, 37, 41, 43, 48, 55],
    },
  ];

  if (!ready) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Growth momentum</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Pipeline velocity</h2>
        </div>
        <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600">
          Last 9 months
        </button>
      </div>
      <div className="mt-6">
        <ReactApexChart options={options} series={series} type="area" height={280} />
      </div>
    </div>
  );
};

export default AreaTrendChart;
