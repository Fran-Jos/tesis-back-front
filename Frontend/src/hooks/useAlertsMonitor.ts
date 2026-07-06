import { useEffect } from "react";
import { useAlerts } from "../context/AlertsContext";

const useAlertsMonitor = () => {
  const { refreshAlerts } = useAlerts();

  useEffect(() => {
    void refreshAlerts();
    const interval = setInterval(() => {
      void refreshAlerts();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);
};

export default useAlertsMonitor;
