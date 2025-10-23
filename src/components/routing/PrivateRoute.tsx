/**
 * Guardián de rutas privadas.
 *
 * Este componente se inserta como `<Route element={<PrivateRoute />}>` y verifica
 * si el usuario está autenticado (a través del contexto expuesto por `useAuth`).
 * Si no existe sesión activa, redirige al formulario de login conservando la ruta
 * desde la que se intentó acceder para un posible redirect posterior.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getDefaultRouteForRole, isPathAllowedForRole } from "../../config/permissions";

const PrivateRoute = () => {
  // `isAuthenticated` proviene del estado global que mantiene `AuthContext`.
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redireccionamos al login, guardando la ubicación actual para regresar luego del inicio de sesión.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user && !isPathAllowedForRole(user.rol, location.pathname)) {
    const fallback = getDefaultRouteForRole(user.rol);
    if (location.pathname !== fallback) {
      return <Navigate to={fallback} replace />;
    }
  }

  // Si hay sesión activa, renderizamos los componentes hijos asociados a la ruta actual.
  return <Outlet />;
};

export default PrivateRoute;
