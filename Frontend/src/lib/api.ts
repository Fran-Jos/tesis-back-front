/**
 * Cliente HTTP centralizado basado en Axios.
 *
 * Se configura con la URL base del backend (obtenida desde variables de entorno
 * de Vite) y agrega automáticamente el token de autenticación a cada petición.
 * También intercepta respuestas 401 para limpiar la sesión y redirigir al login.
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/API/v1.0/Mantenimiento",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
