import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { reliquidacionApi } from '../../api/reliquidacion';
import { useWebSocketProgress } from '../../hooks/useWebSocketProgress';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig, DevolucionMaestro } from '../../types/reliquidacion';
import PanelConfiguracion from './components/PanelConfiguracion';
import TablaResultados from './components/TablaResultados';

export const ModuloReliquidacion = () => {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<ParametrosConfig | null>(null);
  const [consolidados, setConsolidados] = useState<DevolucionMaestro[]>([]);
  const [resultados, setResultados] = useState<ReliquidacionResponse[]>([]);

  // 🔥 ESTADOS PARA LA ORQUESTACIÓN PASO A PASO
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paramsData, consolidadosData] = await Promise.all([
          reliquidacionApi.getParametros(),
          reliquidacionApi.getConsolidados()
        ]);
        setConfig(paramsData);
        setConsolidados(consolidadosData);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar la configuración inicial.');
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchData();
  }, []);

  const getConfiguracionesActivas = () => {
    return formData.esDemo 
      ? formData.tarifasConfig 
      : formData.tarifasConfig.filter(t => formData.tarifasAProcesar.includes(t.jobId));
  };

  const ejecutarPaso = async (index: number) => {
    const configuraciones = getConfiguracionesActivas();
    
    // Si ya terminamos con todas las tarifas
    if (index >= configuraciones.length) {
      toast.success('¡Proceso Global Finalizado!');
      setIsProcessing(false);
      return;
    }

    const tarifaActual = configuraciones[index];
    setIsProcessing(true);
    setProgreso({ porcentaje: 0, mensaje: `Preparando ${tarifaActual.nombreVisible}...` });

    // Armamos el payload mandando SOLO la tarifa que toca en este paso
    const payloadPaso: ReliquidacionRequest = {
      ...formData,
      tarifasConfig: [tarifaActual],
      tarifasAProcesar: [tarifaActual.jobId]
    };

    try {
      const response: any = await reliquidacionApi.calcular(payloadPaso);
      
      // La API ahora devuelve { resultados: [...], resumen: {...} }
      if (response.resultados && response.resultados.length > 0) {
        setResultados(prev => [...prev, ...response.resultados]);
      }
      
      // Guardamos el resumen y mostramos el modal
      if (response.resumen) {
        setLastSummary({
          ...response.resumen,
          pendientes: configuraciones.length - index - 1
        });
        setShowSummaryModal(true);
      } else {
        // Si no hay resumen (ej. no procesó nada), avanzamos automático
        ejecutarPaso(index + 1);
      }
      
    } catch (error: any) {
      toast.error(error?.response?.data?.error || `Error procesando ${tarifaActual.nombreVisible}`, { duration: 6000 });
      setIsProcessing(false);
    }
  };

  const iniciarOrquestacion = () => {
    setResultados([]);
    setCurrentStepIndex(0);
    ejecutarPaso(0);
  };

  const handleCalcular = async () => {
    if (!formData.nombreDevolucion.trim()) return toast.error('Debes asignar un Nombre a la Devolución.');
    if (formData.tarifasConfig.length === 0) return toast.error('Configura al menos una Tarifa.');
    
    const sinPeriodos = formData.tarifasConfig.find(t => t.periodosOrdenados.length === 0);
    if (sinPeriodos) {
      return toast.error(`Falta generar la línea de tiempo para: ${sinPeriodos.nombreVisible}`);
    }

    if (formData.esDemo) {
      if (formData.codigosPrueba.length === 0) {
        return toast.error('En Prueba, ingresa al menos un Código.');
      }
      iniciarOrquestacion();
    } else {
      if (formData.tarifasAProcesar.length === 0) {
        return toast.error('Selecciona al menos una tarifa a procesar.');
      }
      
      toast((t) => (
        <div className="flex flex-col gap-2">
          <p className="font-bold text-sm text-gray-900">¿Impactar Base de Datos?</p>
          <p className="text-xs text-gray-500">Se procesarán {formData.tarifasAProcesar.length} tarifa(s) en producción.</p>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                iniciarOrquestacion();
              }}
              className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
            >
              Sí, ejecutar
            </button>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ), { duration: Infinity, position: 'top-center' });
    }
  };

  const onContinuarPaso = () => {
    setShowSummaryModal(false);
    const next = currentStepIndex + 1;
    setCurrentStepIndex(next);
    ejecutarPaso(next);
  };

  if (loadingConfig) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <span className="text-black font-semibold text-lg animate-pulse">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in relative">
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
        isProcessing={isProcessing}
        progreso={progreso}
        onCalcular={handleCalcular}
        onForzarLimpieza={() => {
          setIsProcessing(false);
          setShowSummaryModal(false);
        }}
      />

      {/* 🔥 MODAL DE RESUMEN EJECUTIVO (DISEÑO MINIMALISTA / NEUTRO) */}
      {showSummaryModal && lastSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 border border-gray-200">
            
            {/* ENCABEZADO GRIS CLARO */}
            <div className="p-6 bg-gray-50 border-b border-gray-200 text-center">
              <div className="bg-white border border-gray-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-gray-700" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Tarifa Procesada</h2>
              <p className="text-gray-500 text-xs mt-1 font-mono">{lastSummary.nombreTarifa}</p>
            </div>
            
            {/* CUERPO DEL MODAL */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Concepto</span>
                <span className="text-sm font-bold text-gray-900">{lastSummary.concepto}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Usuarios Procesados</span>
                <span className="text-sm font-bold text-gray-900">{lastSummary.usuarios?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Capital Base</span>
                <span className="text-sm font-medium text-gray-700">${lastSummary.capital?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Intereses Generados</span>
                <span className="text-sm font-medium text-gray-700">${lastSummary.intereses?.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                <span className="text-xs font-bold text-gray-900 uppercase">Total Parcial</span>
                <span className="text-base font-black text-gray-900">${lastSummary.total?.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* BOTONES GRISES/NEUTROS */}
            <div className="p-4 bg-white border-t border-gray-100">
              {lastSummary.pendientes > 0 ? (
                <button 
                  onClick={onContinuarPaso} 
                  className="w-full flex items-center justify-center bg-gray-900 text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors shadow-sm"
                >
                  Siguiente Tarifa ({lastSummary.pendientes} pendientes) <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button 
                  onClick={() => { 
                    setShowSummaryModal(false); 
                    setIsProcessing(false);
                    toast.success('¡Proceso Global Finalizado!');
                  }} 
                  className="w-full flex items-center justify-center bg-gray-100 text-gray-900 font-bold py-3 rounded-xl text-sm hover:bg-gray-200 border border-gray-200 transition-colors shadow-sm"
                >
                  <Activity className="h-4 w-4 mr-2" /> Finalizar y Ver Tabla
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};