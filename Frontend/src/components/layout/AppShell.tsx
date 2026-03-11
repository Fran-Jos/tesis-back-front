/**
 * Layout principal de la aplicación.
 *
 * Este componente compone la estructura base de "panel + contenido" que comparten
 * todas las vistas protegidas. Se apoya en los datos de navegación definidos en
 * `data/navigation.tsx`, obtiene información del usuario autenticado a través del
 * contexto (`useAuth`) y calcula el título/subtítulo activos en función de la ruta
 * que entrega `react-router`.
 */
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { getNavigationItems } from "../../data/navigation"; // Menú principal configurado en un archivo de datos.
import Topbar from "./Topbar"; // Barra superior reutilizable con acciones de usuario.
import useAuth from "../../hooks/useAuth"; // Hook que expone identidad y logout.
import { entityConfigMap } from "../../config/entities"; // Mapa para traducir la URL a metadatos descriptivos.

const AppShell = () => {
  // Estado local que controla si el sidebar está abierto en vista móvil.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Obtenemos nombre, rol y acción de cierre de sesión desde el contexto global.
  const { user, logout } = useAuth();
  // `useLocation` nos da la ruta actual para sincronizar la UI con la navegación.
  const location = useLocation();
  const navigationItems = useMemo(() => getNavigationItems(user?.rol), [user?.rol]);

  // Derivamos títulos dinámicos en función de la ruta. Esto mantiene una UX consistente.
  const { title, subtitle } = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return { title: "Panel de control", subtitle: "Resumen general" };
    }

    if (segments[0] !== "app") {
      return { title: "Panel de control", subtitle: "" };
    }

    if (segments[1] === "dashboard") {
      return { title: "Panel principal", subtitle: "Indicadores de mantenimiento" };
    }

    if (segments[1] === "reportes") {
      if (segments[2] === "detallado") {
        return {
          title: "Reporte detallado de mantenimiento",
          subtitle: "Analiza tareas, repuestos y totales por orden",
        };
      }
      return { title: "Reportes", subtitle: "Visualiza la información histórica del mantenimiento" };
    }

    // Garantizamos que entityKey sea un string (no undefined) antes de indexar el mapa.
    const entityKey = segments[1] ?? "";
    const entityConfig = entityConfigMap[entityKey];
    if (!entityConfig) {
      return { title: "Panel de control", subtitle: "" };
    }

    if (segments[2] === "nuevo") {
      return { title: `Nuevo ${entityConfig.label.toLowerCase()}`, subtitle: entityConfig.description };
    }

    if (segments[2] && segments[3] === "editar") {
      return { title: `Editar ${entityConfig.label.toLowerCase()}`, subtitle: entityConfig.description };
    }

    return { title: entityConfig.label, subtitle: entityConfig.description };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-700">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white/95 px-4 py-6 shadow-lg backdrop-blur-lg transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Flota Inteligente
          </span>
          <button
            type="button"
            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/**
         * Menú lateral con dos secciones: navegación principal (rutas internas)
         * y recursos secundarios (enlaces externos). `clsx` se usa para definir
         * clases condicionales en función del estado activo.
         */}
        <nav className="flex h-[calc(100vh-11rem)] flex-col space-y-6 overflow-y-auto pr-2">
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Overview
            </p>
            {navigationItems.main.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-indigo-50 text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-700",
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={clsx(
                        "size-5",
                        isActive ? "text-indigo-500" : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          {navigationItems.secondary.length ? (
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Recursos
              </p>
              {navigationItems.secondary.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100/70 hover:text-slate-700"
                >
                  <item.icon className="size-5 text-slate-400 group-hover:text-slate-600" />
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          ) : null}

          {/* Removed promotional card "Seamless Collaboration" to hide it across the app */}
         </nav>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-72">
        {/**
         * `Topbar` muestra el contexto de la página, el nombre del usuario y el menú
         * para cerrar sesión. Se alimenta con los datos calculados anteriormente.
         */}
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
          userName={user?.nombreCompleto ?? ""}
          userRole={String(user?.rol ?? "")}
          onLogout={logout}
          isSidebarOpen={sidebarOpen}
        />
        {/**
         * El `<Outlet />` renderiza la vista específica asociada a la ruta activa.
         * Todas las páginas aprovechan este contenedor que provee paddings y anchos consistentes.
         */}
        <main className="flex-1 px-4 pb-10 pt-28 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-7xl space-y-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
