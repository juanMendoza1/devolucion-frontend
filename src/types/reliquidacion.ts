export interface Periodo {
  mes: number;
  ano: number;
}

export interface ReliquidacionRequest {
  consolidadoTarifas: string; // Nuevo: Nombre de la campaña o grupo
  jobIds: string[];           // Nuevo: Arreglo para soportar múltiples lotes a la vez
  concepto: string;
  tipoInteres: string;
  esDemo: boolean;
  periodosOrdenados: Periodo[];
}

export interface ReliquidacionResponse {
  id?: number;
  consolidadoTarifas: string; // Nuevo: Agrupador principal que viene del backend
  jobId: string;              // Se mantiene para saber de qué lote específico viene este registro
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
  factura?: string;
  codigoDataease?: string;
  detalleTasas?: string;
}

export interface LoteInfo {
  jobId: string;
  descripcion: string;
}

export interface ParametrosConfig {
  idVersionTarifa?: number;
  lote?: string;
  lotes: LoteInfo[];
  conceptos: string[];
  tiposInteres: string[];
}