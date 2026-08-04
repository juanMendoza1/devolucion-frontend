import { api } from './axios';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig } from '../types/reliquidacion';

export const reliquidacionApi = {
  // Petición para ejecutar el cálculo
  calcular: async (data: ReliquidacionRequest): Promise<ReliquidacionResponse[]> => {
    try {
      const response = await api.post<ReliquidacionResponse[]>('/reliquidaciones/calcular', data);
      return response.data;
    } catch (error) {
      console.error('Error al calcular la reliquidación:', error);
      throw error;
    }
  },

  // NUEVA: Petición para traer Lotes, Conceptos y Tipos de Interés
  getParametros: async (): Promise<ParametrosConfig> => {
    try {
      const response = await api.get<ParametrosConfig>('/reliquidaciones/parametros');
      return response.data;
    } catch (error) {
      console.error('Error al cargar parámetros:', error);
      throw error;
    }
  }
};