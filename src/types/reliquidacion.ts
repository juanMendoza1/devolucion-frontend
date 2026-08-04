export interface Periodo {
  mes: number;
  ano: number;
}

export interface ReliquidacionRequest {
  jobId: string;
  concepto: string;
  tipoInteres: string;
  esDemo: boolean;
  periodosOrdenados: Periodo[];
}

export interface ReliquidacionResponse {
  id?: number;
  jobId: string;
  facturaOriginalId: number;
  concepto: string;
  mesBase: number;
  anioBase: number;
  desocupadoMesBase: boolean;
  tipoInteres: string;
  valorBaseTarifa: number;
  capitalReliquidado: number;
  interesesCalculados: number;
  totalDevolucion: number;
  esDemo: boolean;
  fechaCalculo?: string;
}

// --- NUEVOS TIPOS PARA PARÁMETROS DINÁMICOS ---
export interface LoteInfo {
  jobId: string;
  descripcion: string;
}

export interface ParametrosConfig {
  lotes: LoteInfo[];
  conceptos: string[];
  tiposInteres: string[];
}