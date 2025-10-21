import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";

const reportTabs = [
  {
    to: "/app/reportes/detallado",
    title: "Reporte detallado",
    description: "Analiza órdenes, tareas y repuestos por periodo",
  },
  {
    to: "/app/reportes/informe-tecnico",
    title: "Informe técnico por placa",
    description: "Consulta la ficha consolidada de un vehículo",
  },
];

const ReportsLayout = () => {
  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap gap-4">
        {reportTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              clsx(
                "group flex w-full max-w-xs flex-col rounded-3xl border px-5 py-4 text-left transition sm:w-72",
                isActive
                  ? "border-indigo-300 bg-indigo-50/70 text-indigo-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/40"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-sm font-semibold">{tab.title}</span>
                <span
                  className={clsx(
                    "mt-1 text-xs leading-relaxed",
                    isActive ? "text-indigo-600" : "text-slate-500"
                  )}
                >
                  {tab.description}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
};

export default ReportsLayout;
