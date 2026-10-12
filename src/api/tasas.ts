import { api } from './axios';

export interface TasaInteres {
  id?: number;
  mes: number;
  ano: number;
  tsi: number;
}

export const getTasas = async (page: number = 0, size: number = 10) => {
  const response = await api.get('/tasas-interes', { params: { page, size } });
  return response.data;
};

export const createTasa = async (tasa: TasaInteres) => {
  const response = await api.post('/tasas-interes', tasa);
  return response.data;
};

export const updateTasa = async (id: number, tasa: TasaInteres) => {
  const response = await api.put(`/tasas-interes/${id}`, tasa);
  return response.data;
};

export const deleteTasa = async (id: number) => {
  const response = await api.delete(`/tasas-interes/${id}`);
  return response.data;
};