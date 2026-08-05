import { api } from './axios';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig } from '../types/reliquidacion';

export const reliquidacionApi = {
  // Petición para ejecutar el cálculo (Modo Demo o Producción)
  calcular: async (data: ReliquidacionRequest): Promise<ReliquidacionResponse[]> => {
    try {
      const response = await api.post<ReliquidacionResponse[]>('/reliquidaciones/calcular', data);
      return response.data;
    } catch (error) {
      console.error('Error al calcular la reliquidación:', error);
      throw error;
    }
  },

  // Petición para traer Lotes, Conceptos y Tipos de Interés desde el backend
  getParametros: async (): Promise<ParametrosConfig> => {
    try {
      const response = await api.get<ParametrosConfig>('/reliquidaciones/parametros');
      return response.data;
    } catch (error) {
      console.error('Error al cargar parámetros:', error);
      throw error;
    }
  },

  // NUEVA: Petición para consultar los registros en vivo por Consolidado durante el proceso masivo
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