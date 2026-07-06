import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import api from "../lib/api";

export type AlertaDTO = {
  id: number;
  vehiculoId: number;
  vehiculoPlaca?: string;
  mensaje: string;
  fechaProgramada?: string;
  odometroObjetivo?: number;
  clasificacion: "PROXIMA" | "VENCIDA";
  severidad: "VERDE" | "NARANJA" | "ROJO";
  estado: "PENDIENTE" | "ATENDIDA" | "CANCELADA";
  planId?: number;
  planNombre?: string;
};

type AlertsContextType = {
  alerts: AlertaDTO[];
  loading: boolean;
  refreshAlerts: () => Promise<void>;
};

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertaDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // Obtenemos las alertas de interés para las notificaciones
      const [vencidasRes, proximasRes] = await Promise.all([
        api.get<AlertaDTO[]>("/alertas/vencidas"),
        api.get<AlertaDTO[]>("/alertas/proximas", { params: { dias: 30 } }),
      ]);

      const merged = [
        ...(Array.isArray(vencidasRes.data) ? vencidasRes.data : []),
        ...(Array.isArray(proximasRes.data) ? proximasRes.data : []),
      ];

      // Eliminar duplicados por ID (por si una alerta aparece en ambos endpoints por algún motivo)
      const uniqueMap = new Map<number, AlertaDTO>();
      merged.forEach(a => {
        if (a && a.id) uniqueMap.set(a.id, a);
      });
      
      const uniqueAlerts = Array.from(uniqueMap.values());
      
      setAlerts(uniqueAlerts.filter(a => a.estado === "PENDIENTE"));
    } catch (error) {
      console.error("Error al cargar alertas en el contexto:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAlerts();
    // Polling cada 1 minuto para mantener sincronía base
    const interval = setInterval(() => { void refreshAlerts(); }, 60000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  return (
    <AlertsContext.Provider value={{ alerts, loading, refreshAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error("useAlerts debe usarse dentro de un AlertsProvider");
  }
  return context;
};
