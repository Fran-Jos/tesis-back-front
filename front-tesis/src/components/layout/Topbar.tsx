import { useState } from "react";
import clsx from "clsx";
import notifications from "../../data/notifications";

type TopbarProps = {
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
};

const Topbar = ({ onOpenSidebar, title, subtitle, userName, userRole, onLogout }: TopbarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
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
            <span className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-semibold text-white">
              {notifications.length}
            </span>
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
