import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { reliquidacionApi } from '../../api/reliquidacion';
import { useWebSocketProgress } from '../../hooks/useWebSocketProgress';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig } from '../../types/reliquidacion';

export const ModuloReliquidacion = () => {
  // --- ESTADOS DE CARGA Y CONFIGURACIÓN ---
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<ParametrosConfig | null>(null);
  
  // --- ESTADOS DE DATOS ---
  const [resultados, setResultados] = useState<ReliquidacionResponse[]>([]);

  const [formData, setFormData] = useState<ReliquidacionRequest>({
    consolidadoTarifas: '',
    jobIds: [],
    concepto: '',
    tipoInteres: '',
    esDemo: true,
    periodosOrdenados: []
  });

  const anioActualUI = new Date().getFullYear();
  const [rango, setRango] = useState({
    desdeMes: 1, desdeAno: anioActualUI,
    hastaMes: 12, hastaAno: anioActualUI
  });

  const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // --- WEBSOCKETS EN TIEMPO REAL (Vía Custom Hook) ---
  // El topic solo se activa si estamos procesando, en modo producción y hay un consolidado
  const activeTopic = (isProcessing && !formData.esDemo && formData.consolidadoTarifas)
    ? `/topic/reliquidacion-progress/${formData.consolidadoTarifas}`
    : null;

  const { progreso, setProgreso } = useWebSocketProgress({
    topic: activeTopic,
    onMessage: (data) => {
      // Actualizamos la tabla si el porcentaje es divisible por 10 (10%, 20%...) o es 100%
      if (data.porcentaje % 10 === 0 || data.porcentaje === 100) {
        reliquidacionApi.getResultadosEnVivo(formData.consolidadoTarifas)
          .then(setResultados)
          .catch(console.error);
      }
    },
    onComplete: () => {
      finalizarProceso();
      toast.success('Motor de cálculo finalizado exitosamente.');
    },
    onError: (msg) => {
      toast.error(msg);
      finalizarProceso();
    }
  });

  // --- EFECTO: RECUPERAR ESTADO PERDIDO Y CARGAR PARÁMETROS ---
  useEffect(() => {
    // Revisamos si había un proceso corriendo antes de que el usuario se fuera
    const activeJob = localStorage.getItem('active_reliquidacion');
    if (activeJob) {
      const parsedJob = JSON.parse(activeJob);
      setFormData(prev => ({ 
        ...prev, 
        consolidadoTarifas: parsedJob.consolidado,
        esDemo: parsedJob.esDemo
      }));
      setIsProcessing(true);
      setProgreso({ porcentaje: 0, mensaje: 'Reconectando con el proceso en el servidor...' });
    }

    const fetchParametros = async () => {
      try {
        const data = await reliquidacionApi.getParametros();
        setConfig(data);
        setFormData(prev => ({
          ...prev,
          concepto: prev.concepto || data.conceptos?.[0] || 'TA',
          tipoInteres: prev.tipoInteres || data.tiposInteres?.[0] || 'NINGUNO'
        }));
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        toast.error('Error al cargar la configuración inicial.');
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchParametros();
  }, [setProgreso]);

  // --- MANEJADORES ---
  const handleToggleJob = (jobId: string) => {
    setFormData(prev => {
      const isSelected = prev.jobIds.includes(jobId);
      return {
        ...prev,
        jobIds: isSelected ? prev.jobIds.filter(id => id !== jobId) : [...prev.jobIds, jobId]
      };
    });
  };

  const generarRango = () => {
    const mesInicioAbsoluto = (rango.desdeAno * 12) + (rango.desdeMes - 1);
    const mesFinAbsoluto = (rango.hastaAno * 12) + (rango.hastaMes - 1);

    if (mesInicioAbsoluto > mesFinAbsoluto) {
      toast.error('El periodo "Desde" no puede ser mayor al periodo "Hasta".');
      return;
    }

    const nuevosPeriodos = [];
    for (let i = mesInicioAbsoluto; i <= mesFinAbsoluto; i++) {
      nuevosPeriodos.push({ mes: (i % 12) + 1, ano: Math.floor(i / 12) });
    }

    setFormData({ ...formData, periodosOrdenados: nuevosPeriodos });
  };

  const limpiarPeriodos = () => setFormData({ ...formData, periodosOrdenados: [] });

  const finalizarProceso = () => {
    setIsProcessing(false);
    localStorage.removeItem('active_reliquidacion');
  };

  const handleCalcular = async () => {
    if (!formData.consolidadoTarifas.trim()) return toast.error('Debes asignar un Nombre de Consolidado (Campaña).');
    if (formData.jobIds.length === 0) return toast.error('Debes seleccionar al menos un Lote de Tarifas.');
    if (formData.periodosOrdenados.length === 0) return toast.error('Debes generar la línea de tiempo.');

    setIsProcessing(true);
    setProgreso({ porcentaje: 0, mensaje: 'Iniciando motor de consolidación...' });
    
    // Guardamos en memoria por si el usuario cambia de pestaña
    localStorage.setItem('active_reliquidacion', JSON.stringify({
      consolidado: formData.consolidadoTarifas,
      esDemo: formData.esDemo
    }));

    if (formData.esDemo) setResultados([]); 

    try {
      const data = await reliquidacionApi.calcular(formData);
      
      if (formData.esDemo) {
        // En MODO DEMO, data es un Array con los resultados
        setResultados(data);
        finalizarProceso();
        if (data.length === 0) toast.error('No se encontraron datos calculados.');
      } else {
        // En MODO PRODUCCIÓN, el hook de WebSockets se encargará del resto
        console.log("El servidor confirmó la recepción:", data.mensaje);
      }
    } catch (error) {
      toast.error('Error ejecutando el cálculo. Revisa la consola o los logs del servidor.');
      finalizarProceso();
    }
  };

  // --- RENDERIZADO PRINCIPAL ---
  if (loadingConfig) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <span className="text-black font-semibold text-lg animate-pulse">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      
      {/* HEADER */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-bold text-black tracking-tight">Motor de Reliquidación Multi-Lote</h1>
        <p className="text-sm text-gray-500 mt-2">Configuración, cálculo y auditoría de reliquidaciones masivas.</p>
      </div>

      {/* CONTROLES SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: Agrupación y Lotes */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 space-y-6">
          <h2 className="text-base font-bold text-black tracking-wide border-b border-gray-200 pb-2">
            1. Agrupación y Lotes
          </h2>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Nombre del Consolidado</label>
            <input 
              type="text"
              placeholder="Ej. Devoluciones Semestre B 2026"
              className="w-full bg-white border border-gray-300 rounded-md p-3 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              value={formData.consolidadoTarifas}
              onChange={(e) => setFormData({...formData, consolidadoTarifas: e.target.value})}
              disabled={isProcessing}
            />
          </div>

          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Lotes a Procesar</label>
              <span className="text-xs text-black font-bold">
                {formData.jobIds.length} seleccionados
              </span>
            </div>
            
            <div className="bg-white border border-gray-300 rounded-md p-3 h-40 overflow-y-auto space-y-2">
              {config?.lotes?.map(lote => (
                <label 
                  key={lote.jobId} 
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors text-sm
                    ${formData.jobIds.includes(lote.jobId) ? 'bg-gray-100 border-black' : 'hover:bg-gray-50 border-transparent'}
                    ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.jobIds.includes(lote.jobId)}
                    onChange={() => handleToggleJob(lote.jobId)}
                    className="w-4 h-4 text-black bg-white border-gray-400 focus:ring-black cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-black font-semibold">{lote.descripcion}</span>
                    <span className="text-gray-500 text-xs font-mono">{lote.jobId.substring(0, 8)}...</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA 2: Conceptos y Periodos */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 space-y-6 flex flex-col">
          <h2 className="text-base font-bold text-black tracking-wide border-b border-gray-200 pb-2">
            2. Conceptos y Periodos
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Concepto</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md p-3 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
                value={formData.concepto}
                onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                disabled={isProcessing}
              >
                {config?.conceptos?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Interés</label>
              <select 
                className="w-full bg-white border border-gray-300 rounded-md p-3 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
                value={formData.tipoInteres}
                onChange={(e) => setFormData({...formData, tipoInteres: e.target.value})}
                disabled={isProcessing}
              >
                {config?.tiposInteres?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            <div className="col-span-2 flex justify-between items-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              <span>Desde (Base)</span> 
              <span>Hasta (Fin)</span>
            </div>
            <div className="flex gap-2">
              <select className="bg-white border border-gray-300 rounded-md p-2 text-sm w-full outline-none focus:border-black" value={rango.desdeMes} onChange={(e) => setRango({...rango, desdeMes: Number(e.target.value)})} disabled={isProcessing}>
                {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" className="bg-white border border-gray-300 rounded-md p-2 text-sm w-full outline-none focus:border-black" value={rango.desdeAno} onChange={(e) => setRango({...rango, desdeAno: Number(e.target.value)})} disabled={isProcessing}/>
            </div>
            <div className="flex gap-2">
              <select className="bg-white border border-gray-300 rounded-md p-2 text-sm w-full outline-none focus:border-black" value={rango.hastaMes} onChange={(e) => setRango({...rango, hastaMes: Number(e.target.value)})} disabled={isProcessing}>
                {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" className="bg-white border border-gray-300 rounded-md p-2 text-sm w-full outline-none focus:border-black" value={rango.hastaAno} onChange={(e) => setRango({...rango, hastaAno: Number(e.target.value)})} disabled={isProcessing}/>
            </div>
          </div>

          <button onClick={generarRango} disabled={isProcessing} className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold py-3 rounded-md text-sm transition-colors mt-2">
            Generar Línea de Tiempo
          </button>

          {formData.periodosOrdenados.length > 0 && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md h-24 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-black uppercase">Periodos Listos ({formData.periodosOrdenados.length})</span>
                {!isProcessing && (
                  <button onClick={limpiarPeriodos} className="text-xs text-gray-500 hover:text-black font-bold uppercase underline">Limpiar</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.periodosOrdenados.map((p, idx) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-sm font-semibold border ${idx === 0 ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    {idx === 0 && 'BASE: '}{nombresMeses[p.mes - 1]} {p.ano}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA 3: Entorno y Ejecución */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-black tracking-wide border-b border-gray-200 pb-2 mb-6">
              3. Entorno de Ejecución
            </h2>

            <div className="flex flex-col gap-4">
              <label className={`cursor-pointer flex items-center justify-between p-4 rounded-md border transition-all ${formData.esDemo ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="text-sm font-bold text-black">
                  Modo Seguro (Memoria RAM)
                </div>
                <input type="radio" className="hidden" checked={formData.esDemo} onChange={() => setFormData({...formData, esDemo: true})} />
              </label>

              <label className={`cursor-pointer flex items-center justify-between p-4 rounded-md border transition-all ${!formData.esDemo ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="text-sm font-bold text-black">
                  Modo Producción (BD Masiva)
                </div>
                <input type="radio" className="hidden" checked={!formData.esDemo} onChange={() => setFormData({...formData, esDemo: false})} />
              </label>
            </div>
          </div>

          <div className="mt-8">
            <button 
              onClick={handleCalcular}
              disabled={isProcessing}
              className={`w-full text-white font-bold py-4 rounded-md transition-all flex justify-center items-center text-sm uppercase tracking-wide
                ${isProcessing ? 'bg-gray-300 cursor-not-allowed text-gray-600' : 'bg-black hover:bg-gray-900 shadow-md'}
              `}
            >
              {isProcessing ? 'Procesando...' : formData.esDemo ? 'Auditar Consolidado (Demo)' : 'Ejecutar Producción'}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: TABLA DE AUDITORÍA */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col relative min-h-[400px]">
        
        {/* OVERLAY DE CARGA (Minimalista y Funcional) */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-8">
            <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">
              {formData.esDemo ? 'Procesando en Memoria...' : 'Insertando Registros en Base de Datos...'}
            </h3>
            
            {!formData.esDemo && (
              <div className="w-full max-w-md text-center">
                <div className="w-full bg-gray-200 h-2 mb-4 overflow-hidden rounded-full">
                  <div className="bg-black h-2 transition-all duration-300 ease-out" style={{ width: `${progreso.porcentaje}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-500 mb-6">
                  <p>{progreso.mensaje || 'Conectando...'}</p>
                  <p>{progreso.porcentaje}%</p>
                </div>
              </div>
            )}
            
            {formData.esDemo && <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse mb-6">Calculando...</p>}

            {/* BOTÓN DE RESCATE: Por si el servidor termina cuando estamos desconectados */}
            <button 
              onClick={finalizarProceso}
              className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase underline transition-colors"
            >
              Forzar Limpieza (Detener Interfaz)
            </button>
          </div>
        )}

        {/* CABECERA DE TABLA */}
        <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-base font-bold text-black tracking-wide uppercase">
            Resultados de Auditoría {formData.esDemo ? '(Memoria)' : '(Producción)'}
          </h2>
          <div className="text-xs font-bold text-gray-500 uppercase">
            Registros Visibles: <span className="text-black ml-1">{resultados.length}</span>
          </div>
        </div>

        {/* CONTENIDO DE TABLA */}
        <div className="overflow-x-auto flex-1 p-4">
          {resultados.length === 0 && !isProcessing ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-black space-y-2">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Sin Datos</p>
              <p className="text-xs font-medium text-gray-400">Configura los parámetros y ejecuta el motor.</p>
            </div>
          ) : resultados.length > 0 ? (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-black font-bold text-xs uppercase tracking-wider border-b-2 border-black">
                <tr>
                  <th className="px-4 py-4">Lote Origen</th>
                  <th className="px-4 py-4">Dataease</th>
                  <th className="px-4 py-4">Factura</th>
                  <th className="px-4 py-4">Lógica</th>
                  <th className="px-4 py-4">Mes Eval.</th>
                  <th className="px-4 py-4 text-center">Tasa Aplicada</th>
                  <th className="px-4 py-4 text-right">Capital Base</th>
                  <th className="px-4 py-4 text-right">Intereses</th>
                  <th className="px-4 py-4 text-right">Total Reliquidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resultados.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-xs font-mono text-gray-500">{item.jobId.substring(0, 8)}...</td>
                    <td className="px-4 py-4 font-bold text-black">{item.codigoDataease || '-'}</td>
                    <td className="px-4 py-4 font-semibold text-black">
                      #{item.factura || item.facturaOriginalId}
                      {item.desocupadoMesBase && (
                        <span className="ml-2 text-[10px] text-gray-500 font-bold uppercase border border-gray-300 px-1.5 py-0.5">
                          Vacío
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-black text-xs font-bold">{item.concepto} • {item.tipoInteres}</td>
                    <td className="px-4 py-4 text-black text-xs font-bold">{item.mesBase}/{item.anioBase}</td>
                    <td className="px-4 py-4 text-center font-mono font-bold text-gray-600">{item.detalleTasas || '-'}</td>
                    <td className="px-4 py-4 text-right font-medium text-gray-600">${item.capitalReliquidado.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-4 text-right font-medium text-gray-600">+${item.interesesCalculados.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-4 text-right font-bold text-black">${item.totalDevolucion.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
};