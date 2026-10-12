export interface Periodo {
  mes: number;
  ano: number;
}

export interface TarifaConfig {
  jobId: string;
  nombreVisible: string;
  concepto: string;
  tipoInteres: string;
  periodosOrdenados: Periodo[];
}

export interface ReliquidacionRequest {
  nombreDevolucion: string;      
  tarifasConfig: TarifaConfig[]; 
  esDemo: boolean;  
  codigosPrueba: string[];      
  tarifasAProcesar: string[];   
}

export interface ReliquidacionResponse {
  id?: number;
  consolidadoTarifas: string;
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
  factura?: string;
  codigoDataease?: string;
  detalleTasas?: string;
  aplicado?: number;
  ajustado?: number;
  devolucion?: number;
  porsubcon?: number;
  subcon?: number;
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

export interface DevolucionMaestro {
  id: number;
  nombreDevolucion: string;
  fechaCalculo: string;
  usuario: string;
  esDemo: boolean;
  cantidadTarifas: number;
  cantidadRegistros: number;
  totalCapital: number;    
  totalIntereses: number;  
  totalDevolucion: number;
}

export interface ConsolidadoMes {
  tarifa: string;
  mes: number;
  ano: number;
  sumaCapital: number;
  sumaIntereses: number;
  sumaTotal: number;
}
/** Fila del desglose mensual de un maestro. capital = devolucion_aplicar del primer periodo de la tarifa (0 si estaba desocupado). */
export interface DesgloseMes {
  jobId: string;
  mes: number;
  anio: number;
  concepto: string;
  usuarios: number;
  capital: number;
  intereses: number;
  total: number;
}
