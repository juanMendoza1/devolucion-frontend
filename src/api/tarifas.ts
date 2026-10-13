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

// 3. Aprovechadores activos (id, nit, nombre) para asignar tarifas
export const getAprovechadoresActivos = async () => {
  const response = await api.get('/aprovechadores', { params: { soloActivos: true } });
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

export const resetFactoryTarifas = async () => {
  const response = await api.delete('/tarifas/reset-factory');
  return response.data;
};

// Elimina un lote completo (solo si no tiene asignaciones activas ni se usó en una devolución)
export const eliminarLoteTarifas = async (jobId: string) => {
  const response = await api.delete(`/tarifas/lote/${jobId}`);
  return response.data;
};

export const getResumenAsignaciones = async () => {
  const response = await api.get('/tarifas/historico-asignaciones');
  return response.data;
};

export const getDetalleAsignacion = async (jobId: string, aprovechadorId: number) => {
  const response = await api.get('/tarifas/historico-asignaciones/detalle', {
    params: { jobId, aprovechadorId }
  });
  return response.data;
};

export const asignarAprovechador = async (data: { aprovechadorIds: number[]; tarifasIds: number[] }) => {
  const response = await api.post('/tarifas/asignar-aprovechador', data);
  return response.data;
};
export const retirarAprovechador = async (data: { aprovechadorIds: number[]; tarifasIds: number[] }) => {
  const response = await api.post('/tarifas/retirar-aprovechador', data);
  return response.data;
};
