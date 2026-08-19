import { api } from './axios';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig } from '../types/reliquidacion';

export const reliquidacionApi = {
  // Cambiamos el retorno a Promise<any> porque en Modo Prod devuelve un Objeto y en Demo un Array
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