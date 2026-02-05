import { apiClient } from "./apiClient";

export async function apiFetch(path, opts) {
  return apiClient(path, opts);
}
