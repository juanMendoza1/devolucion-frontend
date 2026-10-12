// URLs del backend. Se configuran en .env (ver .env.example):
//   VITE_API_URL=http://localhost:8080
const BACKEND_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';

export const API_BASE_URL = `${BACKEND_URL}/api`;
export const WS_URL = `${BACKEND_URL}/ws-import`;
