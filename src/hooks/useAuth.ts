/**
 * Hook auxiliar para consumir el contexto de autenticación.
 *
 * Centraliza la validación de que el componente esté envuelto por `AuthProvider`
 * y expone helpers como `login`, `logout` y `user`.
 */
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
