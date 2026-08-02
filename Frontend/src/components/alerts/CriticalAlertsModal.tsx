import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAlerts } from "../../context/AlertsContext";
import useAuth from "../../hooks/useAuth";

const CriticalAlertsModal = () => {
  const { alerts } = useAlerts();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    api.get<{ modalHabilitado: boolean }>("/configuracion/notificaciones")
      .then((response) => setEnabled(response.data.modalHabilitado))
      .catch(() => setEnabled(true));
  }, []);

  const pendingAlerts = useMemo(
    () => alerts.filter((alert) => !dismissed.includes(alert.id)),
    [alerts, dismissed],
  );

  if (!enabled || pendingAlerts.length === 0) return null;
  const current = pendingAlerts[0];

  const dismiss = () => {
    const next = [...dismissed, current.id];
    setDismissed(next);
  };

  const attend = () => {
    dismiss();
    if (user?.rol === "OPERADOR") {
      navigate(`/app/historial-vehiculos?vehiculoId=${current.vehiculoId}&alertaId=${current.id}`);
      return;
    }
    if (current.ordenAtendidaId) {
      navigate(`/app/ordenes/${current.ordenAtendidaId}`);
      return;
    }
    const params = new URLSearchParams({
      alertaId: String(current.id),
      vehiculoId: String(current.vehiculoId),
      tipo: current.tipo === "CORRECTIVO" ? "CORRECTIVA" : "PREVENTIVA",
    });
    if (current.planId) params.set("planId", String(current.planId));
    navigate(`/app/ordenes/nuevo?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.22em]">Atención requerida</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {current.clasificacion === "VENCIDA" ? "Mantenimiento vencido" : "Alerta crítica"}
          </h2>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">Vehículo {current.vehiculoPlaca ?? `#${current.vehiculoId}`}</p>
            <p className="mt-1 text-sm text-rose-700">{current.planNombre ?? "Alerta sin plan asociado"}</p>
          </div>
          <p className="text-sm leading-6 text-slate-600">{current.mensaje}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 p-3">
              <dt className="text-xs text-slate-400">Fecha objetivo</dt>
              <dd className="font-semibold text-slate-800">{current.fechaProgramada ?? "No aplica"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <dt className="text-xs text-slate-400">Odómetro objetivo</dt>
              <dd className="font-semibold text-slate-800">
                {current.odometroObjetivo ? `${current.odometroObjetivo.toLocaleString("es-EC")} km` : "No aplica"}
              </dd>
            </div>
          </dl>
          {current.asignadaANombre ? <p className="text-xs text-slate-500">Asignada a: {current.asignadaANombre}</p> : null}
          {pendingAlerts.length > 1 ? <p className="text-xs font-medium text-rose-600">Hay {pendingAlerts.length - 1} alertas adicionales.</p> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={dismiss} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Aceptar
            </button>
            <button type="button" onClick={attend}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
              Atender
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalAlertsModal;
