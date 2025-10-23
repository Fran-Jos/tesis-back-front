import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getDefaultRouteForRole } from "../../config/permissions";

const AppIndexRedirect = () => {
  const { user } = useAuth();
  const target = getDefaultRouteForRole(user?.rol);
  return <Navigate to={target} replace />;
};

export default AppIndexRedirect;
