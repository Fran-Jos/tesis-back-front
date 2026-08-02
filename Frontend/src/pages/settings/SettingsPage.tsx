import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import api from "../../lib/api";
import useAuth from "../../hooks/useAuth";

type Settings = {
  umbralKmProxima: number;
  umbralKmCritica: number;
  umbralDiasProxima: number;
  umbralDiasCritica: number;
  evaluacionAutomatica: boolean;
  intervaloEvaluacionMinutos: number;
  modalHabilitado: boolean;
  notificacionNavegadorHabilitada: boolean;
  horizonteAlertasDias: number;
  ivaPredeterminado: number;
  actualizadoEn?: string;
  actualizadoPor?: string;
};

const sections = [
  { id: "motor", title: "Motor preventivo", description: "Reglas utilizadas para clasificar automáticamente cada plan." },
  { id: "comunicaciones", title: "Comunicaciones", description: "Canales y destinatarios de las alertas generadas." },
  { id: "operacion", title: "Operación", description: "Valores predeterminados para consultas y cálculos." },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.rol !== "ADMIN") return;
    api.get<Settings>("/configuracion")
      .then((response) => setSettings(response.data))
      .catch(() => setError("No fue posible cargar la configuración."));
  }, [user?.rol]);

  if (user?.rol !== "ADMIN") return <Navigate to="/app" replace />;
  if (!settings) return <div className="rounded-3xl bg-white p-8 shadow-sm">{error || "Cargando configuración..."}</div>;

  const numberField = (key: keyof Settings, label: string, suffix: string, min = 0) => (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex rounded-xl border border-slate-200 bg-white">
        <input
          type="number"
          min={min}
          step={key === "ivaPredeterminado" ? "0.01" : "1"}
          value={String(settings[key] ?? "")}
          onChange={(event) => setSettings({ ...settings, [key]: Number(event.target.value) })}
          className="w-full rounded-l-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <span className="flex items-center border-l border-slate-200 px-3 text-sm text-slate-400">{suffix}</span>
      </div>
    </label>
  );

  const toggle = (key: keyof Settings, label: string, description: string) => (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={Boolean(settings[key])}
        onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })}
        className="mt-1 size-5 accent-indigo-600"
      />
    </label>
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.put<Settings>("/configuracion", settings);
      setSettings(response.data);
      setMessage("Configuración guardada. El motor utilizará estos valores en su próxima evaluación.");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.response?.data?.error ?? "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const evaluateNow = async () => {
    setMessage("");
    setError("");
    try {
      const response = await api.post<{ planesEvaluados: number }>("/motor-alertas/evaluar");
      setMessage(`Evaluación completada: ${response.data.planesEvaluados} planes procesados.`);
    } catch {
      setError("No fue posible ejecutar el motor.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300">
            <p className="font-semibold text-slate-900">{section.title}</p>
            <p className="mt-1 text-xs text-slate-500">{section.description}</p>
          </a>
        ))}
      </div>

      <section id="motor" className="space-y-5 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Motor preventivo</h2>
          <p className="text-sm text-slate-500">El umbral próximo debe ser mayor que el crítico.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {numberField("umbralKmProxima", "Aviso próximo por kilometraje", "km")}
          {numberField("umbralKmCritica", "Aviso crítico por kilometraje", "km")}
          {numberField("umbralDiasProxima", "Aviso próximo por fecha", "días")}
          {numberField("umbralDiasCritica", "Aviso crítico por fecha", "días")}
          {numberField("intervaloEvaluacionMinutos", "Intervalo de evaluación", "min", 1)}
        </div>
        {toggle("evaluacionAutomatica", "Evaluación automática", "Procesa los planes periódicamente aunque ningún usuario abra el sistema.")}
        <button type="button" onClick={evaluateNow} className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
          Evaluar todos los planes ahora
        </button>
      </section>

      <section id="comunicaciones" className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Comunicaciones</h2>
          <p className="text-sm text-slate-500">Canales visuales para comunicar alertas críticas y vencidas.</p>
        </div>
        {toggle("modalHabilitado", "Aviso emergente", "Muestra al iniciar sesión las alertas críticas o vencidas no descartadas.")}
        {toggle("notificacionNavegadorHabilitada", "Notificación del navegador", "Permite avisos del sistema operativo en cada dispositivo que conceda permiso.")}
      </section>

      <section id="operacion" className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Operación y cálculos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {numberField("horizonteAlertasDias", "Horizonte de alertas próximas", "días", 1)}
          {numberField("ivaPredeterminado", "IVA predeterminado del sistema", "%")}
        </div>
        {settings.actualizadoEn ? (
          <p className="text-xs text-slate-400">Última actualización: {new Date(settings.actualizadoEn).toLocaleString("es-EC")} {settings.actualizadoPor ? `por ${settings.actualizadoPor}` : ""}</p>
        ) : null}
      </section>

      {message ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
      <button disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {saving ? "Guardando..." : "Guardar ajustes"}
      </button>
    </form>
  );
};

export default SettingsPage;
