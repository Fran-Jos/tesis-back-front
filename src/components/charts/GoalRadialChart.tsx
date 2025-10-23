/**
 * Componente que encapsula un gráfico radial para mostrar porcentajes de avance.
 *
 * Utiliza la librería ApexCharts (a través del wrapper `react-apexcharts`). Este
 * archivo únicamente define opciones visuales y recibe los datos calculados por
 * las páginas que lo usan. Los comentarios explican qué representa cada sección
 * del gráfico y cómo se inicializa.
 */
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

type GoalRadialChartProps = {
  label: string;
  value: number;
  color?: string;
};

const GoalRadialChart = ({ label, value, color = "#6366f1" }: GoalRadialChartProps) => {
  // `ready` evita que el gráfico se renderice en SSR/hidrataciones antes de tener el DOM listo.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Una vez montado el componente en el cliente, habilitamos el render.
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

  // `series` es la entrada numérica para ApexCharts; representa el porcentaje actual.
  const series = [value];

  if (!ready) return null;

  return <ReactApexChart options={options} series={series} type="radialBar" height={240} />;
};

export default GoalRadialChart;
