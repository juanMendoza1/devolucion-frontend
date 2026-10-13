import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { reliquidacionApi } from '../../api/reliquidacion';
import { useWebSocketProgress } from '../../hooks/useWebSocketProgress';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig, DevolucionMaestro } from '../../types/reliquidacion';
import PanelConfiguracion from './components/PanelConfiguracion';
import TablaResultados from './components/TablaResultados';
import { confirmar } from '../../utils/confirmar';

export const ModuloReliquidacion = () => {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<ParametrosConfig | null>(null);
  const [consolidados, setConsolidados] = useState<DevolucionMaestro[]>([]);
  const [resultados, setResultados] = useState<ReliquidacionResponse[]>([]);
  // Resúmenes de las tarifas procesadas en la ejecución actual (en producción reemplazan el listado)
  const [resumenes, setResumenes] = useState<any[]>([]);

  // ESTADOS PARA LA ORQUESTACIÓN PASO A PASO
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [paso, setPaso] = useState({ actual: 0, total: 0, completadas: 0 });
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [lastSummary, setLastSummary] = useState<any>(null);

  const [formData, setFormData] = useState<ReliquidacionRequest>({
    nombreDevolucion: '',
    tarifasConfig: [],
    esDemo: true,
    codigosPrueba: [],
    tarifasAProcesar: []
  });

  const activeTopic = (isProcessing && formData.nombreDevolucion)
    ? `/topic/reliquidacion-progress/${formData.nombreDevolucion}`
    : null;

  const { progreso, setProgreso } = useWebSocketProgress({
    topic: activeTopic,
    onError: (msg) => {
      toast.error(msg);
      setIsProcessing(false);
    }
  });

  /**
   * Carga (o recarga) tarifas disponibles y devoluciones. Las tarifas ya liquidadas no vienen del backend,
   * así que se quitan también de la configuración en pantalla para que no se puedan volver a procesar.
   */
  const cargarConfiguracion = useCallback(async () => {
    try {
      const [paramsData, consolidadosData] = await Promise.all([
        reliquidacionApi.getParametros(),
        reliquidacionApi.getConsolidados()
      ]);
      setConfig(paramsData);
      setConsolidados(consolidadosData);
      const disponibles = new Set((paramsData?.lotes || []).map((l: any) => l.jobId));
      setFormData(prev => ({
        ...prev,
        tarifasConfig: prev.tarifasConfig.filter(t => disponibles.has(t.jobId)),
        tarifasAProcesar: prev.tarifasAProcesar.filter(id => disponibles.has(id)),
      }));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar la configuración.');
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  const finalizarProceso = (mensaje?: string) => {
    setShowSummaryModal(false);
    setIsProcessing(false);
    if (mensaje) toast.success(mensaje);
    cargarConfiguracion();
  };

  const getConfiguracionesActivas = () => {
    return formData.esDemo 
      ? formData.tarifasConfig 
      : formData.tarifasConfig.filter(t => formData.tarifasAProcesar.includes(t.jobId));
  };

  const ejecutarPaso = async (index: number) => {
    const configuraciones = getConfiguracionesActivas();
    
    // Si ya terminamos con todas las tarifas
    if (index >= configuraciones.length) {
      finalizarProceso('Proceso finalizado.');
      return;
    }

    const tarifaActual = configuraciones[index];
    setIsProcessing(true);
    setPaso({ actual: index + 1, total: configuraciones.length, completadas: index });
    setProgreso({ porcentaje: 0, mensaje: `Preparando ${tarifaActual.nombreVisible}...` });

    // Armamos el payload mandando SOLO la tarifa que toca en este paso
    const payloadPaso: ReliquidacionRequest = {
      ...formData,
      tarifasConfig: [tarifaActual],
      tarifasAProcesar: [tarifaActual.jobId]
    };

    try {
      const response: any = await reliquidacionApi.calcular(payloadPaso);
      setPaso({ actual: index + 1, total: configuraciones.length, completadas: index + 1 });
      
      // La API devuelve { resultados: [...], resumen: {...} }
      if (response.resultados && response.resultados.length > 0) {
        setResultados(prev => [...prev, ...response.resultados]);
      }
      
      if (response.resumen) {
        setResumenes(prev => [...prev, response.resumen]);
        setLastSummary({
          ...response.resumen,
          pendientes: configuraciones.length - index - 1
        });
        setShowSummaryModal(true);
      } else {
        ejecutarPaso(index + 1);
      }
      
    } catch (error: any) {
      toast.error(error?.response?.data?.error || `Error procesando ${tarifaActual.nombreVisible}`, { duration: 8000 });
      finalizarProceso();
    }
  };

  const iniciarOrquestacion = () => {
    setResultados([]);
    setResumenes([]);
    setCurrentStepIndex(0);
    ejecutarPaso(0);
  };

  const handleCalcular = async () => {
    if (!formData.nombreDevolucion.trim()) return toast.error('Debes asignar un nombre a la devolución.');
    if (formData.tarifasConfig.length === 0) return toast.error('Configura al menos una tarifa.');
    
    const sinPeriodos = formData.tarifasConfig.find(t => t.periodosOrdenados.length === 0);
    if (sinPeriodos) {
      return toast.error(`Falta generar la línea de tiempo para: ${sinPeriodos.nombreVisible}`);
    }

    if (formData.esDemo) {
      if (formData.codigosPrueba.length === 0) {
        return toast.error('En el simulador, ingresa al menos un código.');
      }
      iniciarOrquestacion();
    } else {
      if (formData.tarifasAProcesar.length === 0) {
        return toast.error('Selecciona al menos una tarifa a procesar.');
      }
      const ok = await confirmar({
        titulo: '¿Procesar en producción?',
        detalle: `Se liquidarán ${formData.tarifasAProcesar.length} tarifa(s). Una tarifa liquidada no se puede volver a procesar.`,
        textoConfirmar: 'Sí, procesar',
      });
      if (ok) iniciarOrquestacion();
    }
  };

  const onContinuarPaso = () => {
    setShowSummaryModal(false);
    const next = currentStepIndex + 1;
    setCurrentStepIndex(next);
    ejecutarPaso(next);
  };

  const encabezado = (
    <div className="page-header">
      <div>
        <p className="page-kicker">Cálculo</p>
        <h1 className="page-title">Reliquidación</h1>
        <p className="page-subtitle">
          Configure la devolución, las tarifas y los periodos, y ejecute el cálculo en prueba o producción.
        </p>
      </div>
    </div>
  );

  if (loadingConfig) {
    return (
      <div className="max-w-7xl">
        {encabezado}
        <div className="card card-body py-16 text-center text-slate-400 text-sm">
          <span className="spinner mr-2" /> Cargando configuración...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6 relative">
      {encabezado}

      <PanelConfiguracion 
        formData={formData} 
        setFormData={setFormData}
        config={config}
        consolidados={consolidados}
        isProcessing={isProcessing}
      />

      <TablaResultados 
        formData={formData}
        setFormData={setFormData}
        resultados={resultados}
        resumenes={resumenes}
        isProcessing={isProcessing}
        progreso={progreso}
        paso={paso}
        onCalcular={handleCalcular}
        onForzarLimpieza={() => finalizarProceso()}
      />

      {/* MODAL DE RESUMEN */}
      {showSummaryModal && lastSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-petroleo-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevada w-full max-w-sm overflow-hidden flex flex-col border border-borde">
            
            <div className="px-6 py-5 bg-petroleo-50 border-b border-borde">
              <p className="page-kicker">Paso completado</p>
              <h2 className="mt-1 text-lg font-bold">Tarifa procesada</h2>
              <p className="text-slate-500 text-xs mt-1 font-mono">{lastSummary.nombreTarifa}</p>
            </div>
            
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="kpi-label">Concepto</span>
                <span className="font-semibold text-petroleo-900">{lastSummary.concepto}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="kpi-label">Usuarios procesados</span>
                <span className="font-semibold text-petroleo-900 tabular-nums">{lastSummary.usuarios?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="kpi-label">Capital base</span>
                <span className="text-slate-700 tabular-nums">${lastSummary.capital?.toLocaleString('es-CO', { maximumFractionDigits: 10 })}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="kpi-label">Intereses generados</span>
                <span className="text-slate-700 tabular-nums">${lastSummary.intereses?.toLocaleString('es-CO', { maximumFractionDigits: 10 })}</span>
              </div>
              <div className="flex justify-between items-center bg-verde-50 p-3 rounded-xl border border-verde-200 mt-2">
                <span className="text-xs font-semibold text-verde-800 uppercase tracking-wide">Total parcial</span>
                <span className="text-base font-bold text-petroleo-900 tabular-nums">${lastSummary.total?.toLocaleString('es-CO', { maximumFractionDigits: 10 })}</span>
              </div>
            </div>

            <div className="p-4 border-t border-borde">
              {lastSummary.pendientes > 0 ? (
                <button onClick={onContinuarPaso} className="btn-primary w-full py-3">
                  Siguiente tarifa ({lastSummary.pendientes} pendientes)
                </button>
              ) : (
                <button onClick={() => finalizarProceso('Proceso finalizado.')} className="btn-success w-full py-3">
                  Finalizar
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
