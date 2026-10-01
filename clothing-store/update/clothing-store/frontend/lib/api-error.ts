import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;
  const response = error.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;
  const validationMessage = response?.errors
    ? Object.values(response.errors).flat()[0]
    : undefined;
  return response?.message ?? validationMessage ?? fallback;
}
