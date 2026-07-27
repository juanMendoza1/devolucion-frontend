import { api } from './axios'; // Importamos tu instancia de axios ya configurada

/**
 * Sube el archivo CSV de facturas al servidor.
 */
export const uploadFacturasCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  // IMPORTANTE: El backend ahora requiere el 'usuIdRegistro' para la Auditoría.
  // Por ahora puedes dejar este valor por defecto, o si guardas el usuario al hacer login,
  // puedes sacarlo de localStorage.getItem('usuario_id')
  const usuIdRegistro = 'ADMIN_SISTEMA'; 

  // Usamos tu instancia 'api' que ya tiene la URL base ('http://localhost:8080/api')
  // y que inyecta el Token automáticamente gracias a tu interceptor.
  const response = await api.post('/importaciones/FACTURAS_ORIGINALES', formData, {
    params: {
      usuIdRegistro: usuIdRegistro // Se envía como parámetro en la URL (?usuIdRegistro=...)
    },
    headers: {
      'Content-Type': 'multipart/form-data',
      // ¡El 'Authorization: Bearer...' ya no hace falta aquí! Tu interceptor lo hace por ti.
    },
  });
  
  return response.data;
};

/**
 * Obtiene el listado de facturas paginado y filtrado.
 */
export const getFacturas = async (
  page: number = 0, 
  size: number = 10, 
  filtros: { factura?: string; codigoDataease?: string; jobId?: string } = {}
) => {
  // Solo enviamos los filtros que realmente tienen texto
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