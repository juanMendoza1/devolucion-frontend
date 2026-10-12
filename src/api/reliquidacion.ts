import { api } from './axios';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig , DevolucionMaestro,ConsolidadoMes } from '../types/reliquidacion';

export const reliquidacionApi = {  
  calcular: async (data: ReliquidacionRequest): Promise<any> => {
    try {
      const response = await api.post('/reliquidaciones/calcular', data);
      return response.data;
    } catch (error) {
      console.error('Error al calcular la reliquidación:', error);
      throw error;
    }
  },

  getParametros: async (): Promise<ParametrosConfig> => {
    try {
      const response = await api.get<ParametrosConfig>('/reliquidaciones/parametros');
      return response.data;
    } catch (error) {
      console.error('Error al cargar parámetros:', error);
      throw error;
    }
  },

  getDetalleMensual: async (id: number): Promise<ConsolidadoMes[]> => {
    const response = await api.get(`/reliquidaciones/consolidados/${id}/detalle-mensual`);
    return response.data;
  },

  getConsolidados: async (): Promise<DevolucionMaestro[]> => {
    
    const response = await api.get('/reliquidaciones/consolidados');
    return response.data;
  },

  getDesgloseMaestro: async (maestroId: number) => {
    const response = await api.get(`/reliquidaciones/maestro/${maestroId}/desglose`);
    return response.data;
  },

  getResultadosEnVivo: async (consolidadoTarifas: string): Promise<ReliquidacionResponse[]> => {
    try {
      const response = await api.get<ReliquidacionResponse[]>(`/reliquidaciones/parcial/${encodeURIComponent(consolidadoTarifas)}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener los resultados en vivo del consolidado:', error);
      throw error;
    }
  }
};