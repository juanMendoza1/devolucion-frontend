import { api } from './axios';

// Obtiene todo el historial de importaciones ordenado desde el backend
export const getHistorialAuditoria = async () => {
  const response = await api.get('/auditoria');
  return response.data;
};