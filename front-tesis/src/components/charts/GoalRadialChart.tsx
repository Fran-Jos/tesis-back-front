import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type GoalRadialChartProps = {
  label: string;
  value: number;
  color?: string;
};

const GoalRadialChart = ({ label, value, color = "#6366f1" }: GoalRadialChartProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        hollow: { size: "60%" },
        track: { background: "#f1f5f9" },
        dataLabels: {
          name: {
            show: true,
            color: "#64748b",
            fontSize: "12px",
            fontWeight: 600,
          },
          value: {
            formatter: (val) => `${Math.round(Number(val))}%`,
            color: "#0f172a",
            fontSize: "20px",
            fontWeight: 700,
          },
        },
      },
    },
    colors: [color],
    labels: [label],
  };

  const series = [value];

  if (!ready) return null;

  return <ReactApexChart options={options} series={series} type="radialBar" height={240} />;
};

export default GoalRadialChart;
