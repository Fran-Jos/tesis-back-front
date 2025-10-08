import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import api from "../lib/api";

type AuthUser = {
  usuarioId: number;
  nombreCompleto: string;
  rol: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

const STORAGE_TOKEN_KEY = "authToken";
const STORAGE_USER_KEY = "authUser";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user", error);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const response = await api.post("/auth/login", credentials);
    const payload = response.data as { token: string; usuarioId: number; nombreCompleto: string; rol: string };
    localStorage.setItem(STORAGE_TOKEN_KEY, payload.token);
    localStorage.setItem(
      STORAGE_USER_KEY,
      JSON.stringify({
        usuarioId: payload.usuarioId,
        nombreCompleto: payload.nombreCompleto,
        rol: payload.rol,
      }),
    );
    setToken(payload.token);
    setUser({ usuarioId: payload.usuarioId, nombreCompleto: payload.nombreCompleto, rol: payload.rol });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
  }), [login, logout, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
