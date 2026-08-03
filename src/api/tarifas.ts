import { api } from './axios';

// 1. Obtiene el resumen agrupado por Lote, Mes y Año
export const getResumenLotes = async () => {
  const response = await api.get('/tarifas/lotes');
  return response.data;
};

// 2. Obtiene las tarifas filtradas estrictamente por jobId, mes y año
export const getTarifasPorLote = async (jobId: string, mes: number, anio: number, page: number = 0, size: number = 10) => {
  const response = await api.get(`/tarifas/lote/${jobId}/${mes}/${anio}`, { params: { page, size } });
  return response.data;
};

// 3. Obtiene la lista para el menú desplegable
export const getAprovechadoresActivos = async () => {
  const response = await api.get('/tarifas/aprovechadores/activos');
  return response.data;
};

// 4. Envía la asignación masiva al backend
export const asignarAprovechador = async (data: { aprovechadorId: number; tarifasIds: number[] }) => {
  const response = await api.post('/tarifas/asignar-aprovechador', data);
  return response.data;
};

// 5. Obtiene el historial de auditoría
export const getAuditoria = async () => {
  const response = await api.get('/tarifas/auditoria');
  return response.data;
};

export const asignarLoteCompleto = async (data: { jobId: string; mes: number; anio: number; aprovechadorId: number }) => {
  const response = await api.post('/tarifas/asignar-lote-completo', data);
  return response.data;
};