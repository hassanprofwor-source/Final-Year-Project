import apiClient from "./apiClient";

const apiUrl = import.meta.env.VITE_SERVER_URL;
const WARMUP_TIMEOUT_MS = 90_000;

let inFlight;

export const wakeMlService = () => {
  if (!inFlight) {
    inFlight = apiClient
      .get(`${apiUrl}/api/v1/analytics/warmup`, { timeout: WARMUP_TIMEOUT_MS })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};
