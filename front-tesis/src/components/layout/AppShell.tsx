import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import navigationItems from "../../data/navigation";
import Topbar from "./Topbar";

const AppShell = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            Nova Insights
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
                    {item.badge ? (
                      <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Productivity
            </p>
            {navigationItems.secondary.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100/70 hover:text-slate-700"
              >
                <item.icon className="size-5 text-slate-400 group-hover:text-slate-600" />
                <span>{item.name}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                    {item.badge}
                  </span>
                ) : null}
              </a>
            ))}
          </div>

          <div className="mt-auto rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-indigo-50/60 to-white p-4 shadow-lg">
            <p className="text-sm font-semibold text-slate-900">Seamless Collaboration</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Invite your team to accelerate insights, manage deliverables, and automate workflows.
            </p>
            <button className="mt-4 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-700">
              Invite teammates
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-72">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-7xl space-y-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
