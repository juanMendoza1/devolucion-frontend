import { api } from './axios'; 
import { jwtDecode } from 'jwt-decode';

export const uploadImportacionCSV = async (
  file: File, 
  tipoArchivo: string, 
  novedad?: string, 
  version?: string
) => {
  const formData = new FormData();
  formData.append('file', file);

  let usuIdRegistro = 'DESCONOCIDO'; 
  const token = localStorage.getItem('jwt_token');

  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.sub) {
        usuIdRegistro = decoded.sub; 
      }
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }

  const response = await api.post(`/importaciones/${tipoArchivo}`, formData, {
    params: {
      usuIdRegistro,
      ...(novedad && { novedad }), 
      ...(version && { version })
    },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getFacturas = async (
  page: number = 0, 
  size: number = 10, 
  filtros: { factura?: string; codigoDataease?: string; jobId?: string } = {}
) => {
  const params = {
    page,
    size,
    ...(filtros.factura && { factura: filtros.factura }),
    ...(filtros.codigoDataease && { codigoDataease: filtros.codigoDataease }),
    ...(filtros.jobId && { jobId: filtros.jobId }),
  };

  const response = await api.get('/facturas', { params });
  return response.data;
};

// Reemplaza a src/api/auditoria.ts
export const getHistorialAuditoria = async () => {
  const response = await api.get('/auditoria');
  return response.data;
};