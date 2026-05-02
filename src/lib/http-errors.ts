import { AxiosError } from "axios";
import { toast } from "sonner";

export interface ApiErrorShape {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface NormalizedError {
  status: number;
  message: string;
  raw: unknown;
}

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AxiosError) {
    const data = err.response?.data as Partial<ApiErrorShape> | undefined;
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(". ")
      : (rawMessage ?? err.message ?? "Request failed");
    return {
      status: err.response?.status ?? 0,
      message,
      raw: err,
    };
  }
  if (err instanceof Error) {
    return { status: 0, message: err.message, raw: err };
  }
  return { status: 0, message: "Unknown error", raw: err };
}

export function toastError(err: unknown, fallback = "Something went wrong") {
  const norm = normalizeError(err);
  toast.error(norm.message || fallback);
  return norm;
}
