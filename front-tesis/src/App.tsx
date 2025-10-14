import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import PrivateRoute from "./components/routing/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import { entityConfigs } from "./config/entities";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/auth/LoginPage";
import EntityListPage from "./pages/entities/EntityListPage";
import EntityFormPage from "./pages/entities/EntityFormPage";
import EntityDetailPage from "./pages/entities/EntityDetailPage";
import MantenimientoDetalladoReportPage from "./pages/reports/MantenimientoDetalladoReportPage";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/app" element={<AppShell />}>
              <Route path="dashboard" element={<DashboardPage />} />
              {entityConfigs.map((entity) => (
                <Route key={entity.key} path={entity.key} element={<Outlet />}>
                  <Route index element={<EntityListPage config={entity} />} />
                  {!entity.form.disableCreate ? (
                    <Route path="nuevo" element={<EntityFormPage config={entity} mode="create" />} />
                  ) : null}
                  {entity.actions?.allowView === false ? null : (
                    <Route path=":id" element={<EntityDetailPage config={entity} />} />
                  )}
                  {!entity.form.disableEdit && entity.actions?.allowEdit !== false ? (
                    <Route path=":id/editar" element={<EntityFormPage config={entity} mode="edit" />} />
                  ) : null}
                </Route>
              ))}
              <Route path="reportes" element={<Outlet />}>
                <Route path="detallado" element={<MantenimientoDetalladoReportPage />} />
                <Route index element={<Navigate to="detallado" replace />} />
              </Route>
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
