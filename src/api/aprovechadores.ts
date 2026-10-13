import { api } from './axios';

export interface Aprovechador {
  id?: number;
  nit: string;
  nombre: string;
  activo?: boolean;
}

export const getAprovechadores = async (): Promise<Aprovechador[]> => {
  const response = await api.get('/aprovechadores');
  return response.data;
};

export const createAprovechador = async (data: Aprovechador): Promise<Aprovechador> => {
  const response = await api.post('/aprovechadores', data);
  return response.data;
};

export const updateAprovechador = async (id: number, data: Aprovechador): Promise<Aprovechador> => {
  const response = await api.put(`/aprovechadores/${id}`, data);
  return response.data;
};

export const setEstadoAprovechador = async (id: number, activo: boolean): Promise<Aprovechador> => {
  const response = await api.put(`/aprovechadores/${id}/estado`, { activo });
  return response.data;
};

export const deleteAprovechador = async (id: number) => {
  const response = await api.delete(`/aprovechadores/${id}`);
  return response.data;
};

export interface EstadisticaAprovechador {
  id: number | null; // null = tarifas liquidadas sin aprovechador
  nit: string | null;
  nombre: string;
  activo: boolean | null;
  tarifasAsignadas: number;
  tarifasLiquidadas: number;
  usuarios: number;
  capital: number;
  intereses: number;
  total: number;
}

export interface EstadisticasPanel {
  aprovechadores: EstadisticaAprovechador[];
  totales: {
    devoluciones: number;
    usuarios: number;
    capital: number;
    intereses: number;
    total: number;
    tarifas_cargadas: number;
    tarifas_liquidadas: number;
  };
}

export const getEstadisticasAprovechadores = async (): Promise<EstadisticasPanel> => {
  const response = await api.get('/aprovechadores/estadisticas');
  return response.data;
};
