import { useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import { useAlerts } from "../../context/AlertsContext";

const BrowserNotifications = () => {
  const { alerts } = useAlerts();
  const [enabledByAdmin, setEnabledByAdmin] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied",
  );
  const notifiedThisLogin = useRef(new Set<number>());

  useEffect(() => {
    api.get<{ notificacionNavegadorHabilitada: boolean }>("/configuracion/notificaciones")
      .then((response) => setEnabledByAdmin(response.data.notificacionNavegadorHabilitada))
      .catch(() => setEnabledByAdmin(false));
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    if (!enabledByAdmin || permission !== "granted" || !("serviceWorker" in navigator)) return;
    const pending = alerts.filter((alert) => !notifiedThisLogin.current.has(alert.id));
    if (!pending.length) return;

    void navigator.serviceWorker.ready.then(async (registration) => {
      for (const alert of pending) {
        await registration.showNotification(
          alert.clasificacion === "VENCIDA" ? "Mantenimiento vencido" : "Alerta crítica de mantenimiento",
          {
            body: `${alert.vehiculoPlaca ?? "Vehículo"} · ${alert.mensaje}`,
            icon: "/images/favicon.ico",
            badge: "/images/favicon.ico",
            tag: `alerta-${alert.id}`,
            renotify: true,
            data: { route: `/app/historial-vehiculos?vehiculoId=${alert.vehiculoId}&alertaId=${alert.id}` },
          },
        );
        notifiedThisLogin.current.add(alert.id);
      }
    });
  }, [alerts, enabledByAdmin, permission]);

  if (!enabledByAdmin || permission !== "default") return null;

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-2xl border border-indigo-200 bg-white p-4 shadow-xl">
      <p className="text-sm font-semibold text-slate-900">Activar notificaciones</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Permite que este dispositivo muestre las alertas asignadas al iniciar sesión.</p>
      <button type="button" onClick={requestPermission} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
        Permitir en este dispositivo
      </button>
    </div>
  );
};

export default BrowserNotifications;
