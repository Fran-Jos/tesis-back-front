/**
 * Punto de entrada principal del frontend.
 *
 * Aquí definimos el árbol de enrutamiento que alimenta toda la aplicación React.
 * Cada ruta se documenta con comentarios explicando de dónde proviene la información
 * y por qué se usa un componente específico. Todos los componentes importados son
 * generados por nosotros mismos dentro de `front-tesis/src` a excepción de los
 * utilitarios de `react-router-dom`, que extienden el enrutador de React para manejar
 * navegación declarativa.
 */
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import PrivateRoute from "./components/routing/PrivateRoute";
import AppIndexRedirect from "./components/routing/AppIndexRedirect";
import { AuthProvider } from "./context/AuthContext";
import { AlertsProvider } from "./context/AlertsContext";
import { entityConfigs } from "./config/entities";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/auth/LoginPage";
import EntityListPage from "./pages/entities/EntityListPage";
import EntityFormPage from "./pages/entities/EntityFormPage";
import EntityDetailPage from "./pages/entities/EntityDetailPage";
import MantenimientoDetalladoReportPage from "./pages/reports/MantenimientoDetalladoReportPage";
import VehicleHistoryPage from "./pages/vehicles/VehicleHistoryPage";

// Definimos el componente de aplicación que envuelve toda la jerarquía visual.
const App = () => {
  return (
    /**
     * `BrowserRouter` provee la sincronización con la URL del navegador.
     * Toda la navegación declarativa definida con `Routes` se basa en este contenedor.
     */
    <BrowserRouter>
      {/**
       * `AuthProvider` provee el contexto de autenticación a toda la app.
       * Toma su información base del hook `useAuth` y expone estado y acciones.
       */}
      <AuthProvider>
        <Routes>
          {/** Ruta pública que muestra el formulario de inicio de sesión. */}
          <Route path="/login" element={<LoginPage />} />
          {/**
           * Rutas protegidas: `PrivateRoute` consulta el contexto para validar
           * si existe un usuario autenticado antes de renderizar el contenido.
           */}
          <Route element={<PrivateRoute />}>
            {/** 
             * Ruta principal de la aplicación (/app). 
             * Envolvemos AppShell con AlertsProvider para manejar notificaciones globales.
             */}
            <Route
              path="/app"
              element={
                <AlertsProvider>
                  <AppShell />
                </AlertsProvider>
              }
            >
              {/** Ruta principal del dashboard con datos agregados del API. */}
              <Route path="dashboard" element={<DashboardPage />} />
              {/**
               * Generamos dinámicamente rutas para cada entidad configurada en
               * `config/entities.ts`. Cada entidad define su clave, formularios
               * permitidos y acciones disponibles. Las páginas consumen esa
               * configuración para construir tablas y formularios parametrizados.
               */}
              {entityConfigs.map((entity) => (
                <Route key={entity.key} path={entity.key} element={<Outlet />}>
                  {/** Vista de listado que consulta datos del API específico. */}
                  <Route index element={<EntityListPage config={entity} />} />
                  {!entity.form.disableCreate ? (
                    /** Formulario en modo creación, reutilizando el mismo componente parametrizable. */
                    <Route path="nuevo" element={<EntityFormPage config={entity} mode="create" />} />
                  ) : null}
                  {entity.actions?.allowView === false ? null : (
                    /** Vista de detalle que expone información ampliada de la entidad seleccionada. */
                    <Route path=":id" element={<EntityDetailPage config={entity} />} />
                  )}
                  {!entity.form.disableEdit && entity.actions?.allowEdit !== false ? (
                    /** Formulario reutilizado en modo edición para actualizar la entidad en el API. */
                    <Route path=":id/editar" element={<EntityFormPage config={entity} mode="edit" />} />
                  ) : null}
                </Route>
              ))}
              <Route path="reportes" element={<Outlet />}>
                {/** Reporte detallado de mantenimiento, alimentado por consultas específicas al backend. */}
                <Route path="detallado" element={<MantenimientoDetalladoReportPage />} />
                {/** Redirección por defecto al reporte detallado cuando se ingresa al módulo de reportes. */}
                <Route index element={<Navigate to="detallado" replace />} />
              </Route>
              {/** Módulo de historial de vehículos con filtros y detalle ampliado. */}
              <Route path="historial-vehiculos" element={<VehicleHistoryPage />} />
              {/** Cuando se visita /app sin subruta se redirige según el rol del usuario. */}
              <Route index element={<AppIndexRedirect />} />
            </Route>
          </Route>
          {/** Redirecciones globales hacia el contenedor principal, el rol decide el destino final. */}
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
