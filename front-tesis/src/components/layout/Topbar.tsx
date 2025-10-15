/**
 * Barra superior que aparece en todas las páginas autenticadas.
 *
 * Además de mostrar títulos, información del usuario y botones de acción, este
 * componente consulta al backend (`lib/api.ts`) para obtener alertas de
 * mantenimiento próximas o vencidas. Los comentarios explican el origen de los
 * datos y cómo se calculan las etiquetas mostradas.
 */
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx"; // Utilidad para componer clases Tailwind condicionalmente.
import api from "../../lib/api"; // Cliente Axios configurado con la base URL del backend.

type TopbarProps = {
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  isSidebarOpen: boolean;
};

type AlertNotification = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  color: string;
};

type AlertaDTO = {
  id?: number;
  vehiculoPlaca?: string;
  mensaje?: string;
  fechaProgramada?: string;
  clasificacion?: "PROXIMA" | "VENCIDA";
  estado?: string;
  tipo?: string;
  planNombre?: string;
};

const Topbar = ({
  onOpenSidebar,
  title,
  subtitle,
  userName,
  userRole,
  onLogout,
  isSidebarOpen,
}: TopbarProps) => {
  // Controla si el panel desplegable de notificaciones está abierto.
  const [open, setOpen] = useState(false);
  // Listado de notificaciones transformadas desde las alertas que expone la API REST.
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  // Flags para mostrar estados de carga/errores mientras esperamos la respuesta del backend.
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Consumimos dos endpoints (`/alertas/vencidas` y `/alertas/proximas`) para construir la bandeja.
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const [vencidasRes, proximasRes] = await Promise.all([
          api.get<AlertaDTO[]>("/alertas/vencidas"),
          api.get<AlertaDTO[]>("/alertas/proximas", { params: { dias: 30 } }),
        ]);

        const now = new Date();
        // Unificamos las respuestas eliminando registros nulos.
        const normalizeAlerts = [...(vencidasRes.data ?? []), ...(proximasRes.data ?? [])];

        const uniqueAlerts = normalizeAlerts.filter((alerta, index, self) => {
          if (!alerta) {
            return false;
          }
          const id = alerta.id ?? `${alerta.vehiculoPlaca}-${alerta.fechaProgramada}`;
          return index === self.findIndex((item) => {
            if (!item) {
              return false;
            }
            const itemId = item.id ?? `${item.vehiculoPlaca}-${item.fechaProgramada}`;
            return itemId === id;
          });
        });

        // Formateador para mostrar la fecha programada de una forma legible en español (Ecuador).
        const formatter = new Intl.DateTimeFormat("es-EC", {
          day: "2-digit",
          month: "short",
        });

        const mapped = uniqueAlerts
          .map((alerta) => {
            const fechaProgramada = alerta?.fechaProgramada
              ? new Date(`${alerta.fechaProgramada}T00:00:00`)
              : null;
            const diffDays = fechaProgramada
              ? Math.round(
                  (fechaProgramada.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : null;

            const clasificacion = alerta?.clasificacion
              ? alerta.clasificacion
              : diffDays !== null && diffDays < 0
                ? "VENCIDA"
                : "PROXIMA";

            const color = clasificacion === "VENCIDA" ? "bg-rose-500" : "bg-amber-400";

            const relativeLabel = (() => {
              if (diffDays === null) {
                return "Sin fecha";
              }
              if (diffDays === 0) {
                return "Hoy";
              }
              if (diffDays > 0) {
                return diffDays === 1 ? "En 1 día" : `En ${diffDays} días`;
              }
              const days = Math.abs(diffDays);
              return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
            })();

            const titlePrefix = clasificacion === "VENCIDA" ? "Mantenimiento vencido" : "Mantenimiento próximo";

            const descriptionParts = [
              alerta?.planNombre,
              alerta?.mensaje,
              fechaProgramada ? formatter.format(fechaProgramada) : null,
            ].filter(Boolean);

            return {
              id: (alerta?.id ?? `${alerta?.vehiculoPlaca}-${alerta?.fechaProgramada}`)?.toString(),
              title: `${titlePrefix} · ${alerta?.vehiculoPlaca ?? "Vehículo"}`,
              description: descriptionParts.join(" · "),
              timestamp: relativeLabel,
              color,
              sortKey: fechaProgramada ? fechaProgramada.getTime() : Number.MAX_SAFE_INTEGER,
            };
          })
          .sort((a, b) => a.sortKey - b.sortKey)
          .slice(0, 6)
          .map(({ sortKey, ...rest }) => rest);

        if (isMounted) {
          setNotifications(mapped);
          setNotificationsError(null);
        }
      } catch (error) {
        if (isMounted) {
          setNotificationsError("No se pudieron cargar las alertas");
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setLoadingNotifications(false);
        }
      }
    };

    void fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoriza el número de alertas para mostrarlo en el badge del botón de campana.
  const badgeCount = useMemo(() => notifications.length, [notifications.length]);

  return (
    <header
      className={clsx(
        "fixed top-0 right-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl transition-all duration-300",
        "left-0 lg:left-72",
        isSidebarOpen ? "pl-72 lg:pl-0" : "",
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-500 lg:hidden"
          >
            <span className="sr-only">Abrir menú</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
            </svg>
          </button>
          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
              {subtitle ?? "Gestión de mantenimiento"}
            </p>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative hidden size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-200 hover:text-indigo-500 sm:flex"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Ver notificaciones</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 10-12 0v.75a8.967 8.967 0 01-2.312 6.022 23.86 23.86 0 005.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {badgeCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[11px] font-semibold leading-none text-white">
                {badgeCount}
              </span>
            ) : null}
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
            <img
              alt={userName ?? "Usuario"}
              src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&facepad=2&w=80&h=80&q=80"
              className="size-10 rounded-xl object-cover"
            />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-900">{userName ?? "Usuario"}</p>
              <p className="text-xs text-slate-400">{userRole ?? "Invitado"}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-500"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "transition-all duration-200",
          open ? "max-h-96 border-t border-slate-200" : "max-h-0 overflow-hidden border-transparent",
        )}
      >
        <div className="space-y-3 px-4 pb-6 pt-4 sm:px-6 lg:px-10">
          {loadingNotifications ? (
            <div className="text-sm text-slate-500">Cargando notificaciones...</div>
          ) : null}

          {notificationsError && !loadingNotifications ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {notificationsError}
            </div>
          ) : null}

          {!loadingNotifications && !notificationsError && notifications.length === 0 ? (
            <div className="text-sm text-slate-500">No hay alertas pendientes para mostrar.</div>
          ) : null}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-3 rounded-2xl bg-white/80 p-3 shadow-sm"
            >
              <span className={clsx("mt-1 size-2.5 rounded-full", notification.color)} />
              <div>
                <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                <p className="text-xs text-slate-500">{notification.description}</p>
              </div>
              <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {notification.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
