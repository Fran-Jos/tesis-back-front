import { isAxiosError } from "axios";

type ErrorLike = {
  message?: string;
  error?: string;
  detail?: string;
};

const extractDetail = (data: unknown): string | null => {
  if (!data) {
    return null;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object") {
    const errorLike = data as ErrorLike;
    return errorLike.detail ?? errorLike.error ?? errorLike.message ?? null;
  }

  return null;
};

export const getErrorMessage = (error: unknown, fallback = "Ocurrió un error inesperado.") => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const detail = extractDetail(error.response?.data) ?? error.message;

    if (status && detail) {
      return `Error ${status}: ${detail}`;
    }

    if (status) {
      return `Error ${status}: No se pudo completar la solicitud.`;
    }

    if (detail) {
      return detail;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default getErrorMessage;
