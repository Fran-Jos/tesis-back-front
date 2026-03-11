import type { UserRole } from "../types/auth";

const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  ADMIN: "/app/dashboard",
  TECNICO: "/app/dashboard",
  OPERADOR: "/app/registrokm",
};

const ROLE_ALLOWED_PATHS: Record<UserRole, string[]> = {
  ADMIN: ["/app"],
  TECNICO: [
    "/app/dashboard",
    "/app/planes",
    "/app/ordenes",
    "/app/tareas",
    "/app/repuestos-usados",
    "/app/registrokm",
    "/app/historial-vehiculos",
    "/app/alertas",
  ],
  OPERADOR: ["/app/registrokm", "/app/historial-vehiculos", "/app/alertas"],
};

const normalizePath = (path: string) => {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
};

const matchesAllowedPath = (pathname: string, allowedPath: string) =>
  pathname === allowedPath || pathname.startsWith(`${allowedPath}/`);

export const getDefaultRouteForRole = (role?: UserRole | null) => {
  if (!role) {
    return "/app/dashboard";
  }
  return ROLE_DEFAULT_ROUTE[role];
};

export const isPathAllowedForRole = (role: UserRole, pathname: string) => {
  if (role === "ADMIN") {
    return true;
  }
  const normalized = normalizePath(pathname);
  if (normalized === "/app") {
    return true;
  }
  return ROLE_ALLOWED_PATHS[role].some((allowedPath) => matchesAllowedPath(normalized, normalizePath(allowedPath)));
};
