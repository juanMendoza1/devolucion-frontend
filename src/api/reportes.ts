import { api } from './axios';

export interface ResumenFacturacion {
  id: number;
  nombre_devolucion: string;
  fecha_calculo: string;
  usuarios: number;
  valor_devolucion: number;
  interes: number;
}

export const getResumenFacturacionDevolucion = async (maestroId: number): Promise<ResumenFacturacion> => {
  const response = await api.get(`/reportes/facturacion-devolucion/${maestroId}/resumen`);
  return response.data;
};

/** Descarga el Excel y lo guarda con el nombre que envía el backend. */
export const descargarFacturacionDevolucion = (maestroId: number) =>
  descargarExcel(`/reportes/facturacion-devolucion/${maestroId}`, `facturacion_devolucion_${maestroId}.xlsx`);

export type ModoConsolidado = 'CONSOLIDADO' | 'POR_MES';

export interface FilaMes {
  anio: number;
  mes: number;
  capital: number;
  tasa: number | null;
  interes: number;
  acumulado: number;
}

export interface TablaConsolidado {
  nombre: string;
  filas: FilaMes[];
  totalCapital: number;
  totalInteres: number;
  total: number;
}

export const getConsolidadoMes = async (maestroId: number, modo: ModoConsolidado): Promise<TablaConsolidado[]> => {
  const response = await api.get(`/reportes/consolidado-mes/${maestroId}/resumen`, { params: { modo } });
  return response.data;
};

export const descargarConsolidadoMes = (maestroId: number, modo: ModoConsolidado) =>
  descargarExcel(`/reportes/consolidado-mes/${maestroId}?modo=${modo}`, `consolidado_mes_${maestroId}.xlsx`);

async function descargarExcel(ruta: string, nombrePorDefecto: string) {
  const response = await api.get(ruta, { responseType: 'blob' });
  const disposicion: string = response.headers['content-disposition'] || '';
  const coincidencia = disposicion.match(/filename\*=UTF-8''([^;]+)/) || disposicion.match(/filename="?([^";]+)"?/);
  const nombre = coincidencia ? decodeURIComponent(coincidencia[1]) : nombrePorDefecto;

  const url = URL.createObjectURL(response.data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
  return nombre;
}
