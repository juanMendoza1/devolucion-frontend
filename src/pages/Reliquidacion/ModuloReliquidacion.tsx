import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { reliquidacionApi } from '../../api/reliquidacion';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig } from '../../types/reliquidacion';
import { Calculator, Calendar, Settings2, ShieldCheck, Layers, Activity, Loader2, CheckSquare } from 'lucide-react';

export const ModuloReliquidacion = () => {
  // --- ESTADOS DE CARGA Y CONFIGURACIÓN ---
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [config, setConfig] = useState<ParametrosConfig | null>(null);
  
  // --- ESTADOS DE DATOS ---
  const [resultados, setResultados] = useState<ReliquidacionResponse[]>([]);
  const [progreso, setProgreso] = useState({ porcentaje: 0, mensaje: '' });

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

  // --- EFECTOS ---
  useEffect(() => {
    const fetchParametros = async () => {
      try {
        const data = await reliquidacionApi.getParametros();
        setConfig(data);
        setFormData(prev => ({
          ...prev,
          concepto: data.conceptos?.[0] || 'TA',
          tipoInteres: data.tiposInteres?.[0] || 'NINGUNO'
        }));
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchParametros();
  }, []);

  useEffect(() => {
    if (!isProcessing || formData.esDemo || !formData.consolidadoTarifas) return;

    const socket = new SockJS('http://localhost:8080/ws'); 
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe(`/topic/reliquidacion-progress/${formData.consolidadoTarifas}`, (message) => {
          const data = JSON.parse(message.body);
          setProgreso({ porcentaje: data.porcentaje, mensaje: data.mensaje });

          if (data.porcentaje % 10 === 0 || data.porcentaje === 100) {
            reliquidacionApi.getResultadosEnVivo(formData.consolidadoTarifas)
              .then(setResultados)
              .catch(console.error);
          }

          if (data.porcentaje === 100) {
            setIsProcessing(false);
            client.deactivate();
          }
        });
      }
    });
    
    client.activate();
    return () => { client.deactivate(); };
  }, [isProcessing, formData.esDemo, formData.consolidadoTarifas]);


  // --- MANEJADORES ---

  // NUEVO: Manejador para los Checkboxes
  const handleToggleJob = (jobId: string) => {
    setFormData(prev => {
      const isSelected = prev.jobIds.includes(jobId);
      return {
        ...prev,
        jobIds: isSelected 
          ? prev.jobIds.filter(id => id !== jobId) 
          : [...prev.jobIds, jobId]
      };
    });
  };

  const generarRango = () => {
    const mesInicioAbsoluto = (rango.desdeAno * 12) + (rango.desdeMes - 1);
    const mesFinAbsoluto = (rango.hastaAno * 12) + (rango.hastaMes - 1);

    if (mesInicioAbsoluto > mesFinAbsoluto) {
      alert('Error: El periodo "Desde" no puede ser mayor al periodo "Hasta".');
      return;
    }

    const nuevosPeriodos = [];
    for (let i = mesInicioAbsoluto; i <= mesFinAbsoluto; i++) {
      nuevosPeriodos.push({ mes: (i % 12) + 1, ano: Math.floor(i / 12) });
    }

    setFormData({ ...formData, periodosOrdenados: nuevosPeriodos });
  };

  const limpiarPeriodos = () => setFormData({ ...formData, periodosOrdenados: [] });

  const handleCalcular = async () => {
    if (!formData.consolidadoTarifas.trim()) return alert('Debes asignar un Nombre de Consolidado (Campaña).');
    if (formData.jobIds.length === 0) return alert('Debes seleccionar al menos un Lote de Tarifas.');
    if (formData.periodosOrdenados.length === 0) return alert('Debes generar la línea de tiempo.');

    setIsProcessing(true);
    setProgreso({ porcentaje: 0, mensaje: 'Iniciando motor de consolidación...' });
    
    // Si es demo limpiamos, si es prod mantenemos para ver como se llena
    if (formData.esDemo) setResultados([]); 

    try {
      const data = await reliquidacionApi.calcular(formData);
      
      if (formData.esDemo) {
        setResultados(data);
        setIsProcessing(false);
        if (data.length === 0) alert('No se encontraron datos calculados.');
      }
    } catch (error) {
      alert('Error ejecutando el cálculo.');
      setIsProcessing(false);
    }
  };


  // --- RENDERIZADO PRINCIPAL ---

  if (loadingConfig) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <span className="text-gray-500 font-medium text-lg">Cargando motor financiero consolidado...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-600" />
            Motor de Reliquidación Multi-Lote
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configura múltiples lotes, genera rangos y ejecuta auditorías consolidadas en tiempo real.</p>
        </div>
      </div>

      {/* CONTROLES SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: Agrupación y Lotes (MEJORADA CON CHECKBOXES) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold tracking-wide text-gray-800 uppercase flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Settings2 className="h-4 w-4" /> 1. Agrupación y Lotes
          </h2>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre del Consolidado (Campaña)</label>
            <input 
              type="text"
              placeholder="Ej. Devoluciones Semestre B 2026"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.consolidadoTarifas}
              onChange={(e) => setFormData({...formData, consolidadoTarifas: e.target.value})}
              disabled={isProcessing}
            />
          </div>

          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-600">Lotes a Procesar</label>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {formData.jobIds.length} selec.
              </span>
            </div>
            
            {/* Lista de Checkboxes UI */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 h-36 overflow-y-auto space-y-1">
              {config?.lotes?.map(lote => (
                <label 
                  key={lote.jobId} 
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-sm
                    ${formData.jobIds.includes(lote.jobId) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100 border border-transparent'}
                    ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.jobIds.includes(lote.jobId)}
                    onChange={() => handleToggleJob(lote.jobId)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium leading-tight">{lote.descripcion}</span>
                    <span className="text-gray-400 text-[10px] font-mono">{lote.jobId.substring(0, 8)}...</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA 2: Conceptos y Rangos (MEJORADA CON VISTA DE TIMELINE) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 flex flex-col">
          <h2 className="text-sm font-bold tracking-wide text-gray-800 uppercase flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Calendar className="h-4 w-4" /> 2. Conceptos y Periodos
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Concepto</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.concepto}
                onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                disabled={isProcessing}
              >
                {config?.conceptos?.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Interés</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.tipoInteres}
                onChange={(e) => setFormData({...formData, tipoInteres: e.target.value})}
                disabled={isProcessing}
              >
                {config?.tiposInteres?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-2">
            <div className="col-span-2 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Desde (Mes Base)</span> 
              <span>Hasta (Último Interés)</span>
            </div>
            <div className="flex gap-1">
              <select className="bg-white border border-gray-200 rounded-lg p-1.5 text-sm w-full outline-none" value={rango.desdeMes} onChange={(e) => setRango({...rango, desdeMes: Number(e.target.value)})} disabled={isProcessing}>
                {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" className="bg-white border border-gray-200 rounded-lg p-1.5 text-sm w-full outline-none" value={rango.desdeAno} onChange={(e) => setRango({...rango, desdeAno: Number(e.target.value)})} disabled={isProcessing}/>
            </div>
            <div className="flex gap-1">
              <select className="bg-white border border-gray-200 rounded-lg p-1.5 text-sm w-full outline-none" value={rango.hastaMes} onChange={(e) => setRango({...rango, hastaMes: Number(e.target.value)})} disabled={isProcessing}>
                {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" className="bg-white border border-gray-200 rounded-lg p-1.5 text-sm w-full outline-none" value={rango.hastaAno} onChange={(e) => setRango({...rango, hastaAno: Number(e.target.value)})} disabled={isProcessing}/>
            </div>
          </div>

          <button onClick={generarRango} disabled={isProcessing} className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-2 rounded-xl text-xs transition-colors mt-2">
            Generar Línea de Tiempo
          </button>

          {/* UI Mejorada: Mostrar periodos generados claramente */}
          {formData.periodosOrdenados.length > 0 && (
            <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl h-24 overflow-y-auto">
              <div className="flex justify-between items-center mb-2 sticky top-0 bg-blue-50/90 pb-1">
                <span className="text-[10px] font-bold text-blue-800 uppercase">Periodos Listos ({formData.periodosOrdenados.length})</span>
                {!isProcessing && (
                  <button onClick={limpiarPeriodos} className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase">Limpiar</button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.periodosOrdenados.map((p, idx) => (
                  <span key={idx} className={`text-[10px] px-2 py-1 rounded-md font-semibold border ${idx === 0 ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300'}`}>
                    {idx === 0 && 'BASE: '}{nombresMeses[p.mes - 1]} {p.ano}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA 3: Entorno y Ejecución */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-wide text-gray-800 uppercase flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <ShieldCheck className="h-4 w-4" /> 3. Entorno de Ejecución
            </h2>

            <div className="flex flex-col gap-3">
              <label className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border-2 transition-all ${formData.esDemo ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-white'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.esDemo ? 'border-amber-500' : 'border-gray-300'}`}>
                    {formData.esDemo && <div className="w-2 h-2 bg-amber-500 rounded-full"></div>}
                  </div>
                  Modo Seguro (Demo / RAM)
                </div>
                <input type="radio" className="hidden" checked={formData.esDemo} onChange={() => setFormData({...formData, esDemo: true})} />
              </label>

              <label className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border-2 transition-all ${!formData.esDemo ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-white'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!formData.esDemo ? 'border-red-600' : 'border-gray-300'}`}>
                    {!formData.esDemo && <div className="w-2 h-2 bg-red-600 rounded-full"></div>}
                  </div>
                  Modo Producción (BD Masiva)
                </div>
                <input type="radio" className="hidden" checked={!formData.esDemo} onChange={() => setFormData({...formData, esDemo: false})} />
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleCalcular}
              disabled={isProcessing}
              className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2
                ${isProcessing ? 'bg-gray-400 shadow-none cursor-not-allowed' : formData.esDemo ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}
              `}
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin"/> Procesando...</>
              ) : formData.esDemo ? 'Auditar Consolidado (Demo)' : '🚀 Ejecutar Producción'}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: TABLA DE AUDITORÍA (CON ESTADO DE CARGA CENTRAL) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative min-h-[400px]">
        
        {/* OVERLAY DE CARGA (Aparece sobre la tabla cuando isProcessing es true) */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {formData.esDemo ? 'Calculando Previsualización (RAM)...' : 'Procesando Consolidado en BD...'}
            </h3>
            
            {/* Barra de progreso exclusiva para Producción */}
            {!formData.esDemo && (
              <div className="w-80 max-w-full text-center mt-2">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progreso.porcentaje}%` }}></div>
                </div>
                <p className="text-sm font-bold text-blue-700 animate-pulse">{progreso.mensaje || 'Conectando motor...'}</p>
              </div>
            )}
            {formData.esDemo && <p className="text-sm text-gray-500 animate-pulse">Este proceso tomará solo un momento...</p>}
          </div>
        )}

        <div className="bg-gray-900 p-5 flex justify-between items-center text-white">
          <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400"/>
            Resultados de Auditoría {formData.esDemo ? '(Memoria)' : '(En Vivo)'}
          </h2>
          <div className="text-xs font-medium bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
            Registros Visibles: <span className="text-blue-400 ml-1 font-mono">{resultados.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {resultados.length === 0 && !isProcessing ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 space-y-4 p-8">
              <div className="p-5 bg-gray-50 rounded-full shadow-inner"><CheckSquare className="w-12 h-12 text-gray-300" /></div>
              <p className="text-base font-medium text-gray-500">Configura los parámetros arriba y ejecuta el motor.</p>
            </div>
          ) : resultados.length > 0 ? (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4">Lote Origen</th>
                  <th className="px-5 py-4">Factura</th>
                  <th className="px-5 py-4">Lógica</th>
                  <th className="px-5 py-4">Mes Base</th>
                  <th className="px-5 py-4 text-right">Capital Base</th>
                  <th className="px-5 py-4 text-right">Intereses</th>
                  <th className="px-5 py-4 text-right text-blue-700">Total Reliquidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resultados.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-4 text-xs font-mono text-gray-500">{item.jobId.substring(0, 8)}...</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      #{item.facturaOriginalId}
                      {item.desocupadoMesBase && <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-red-100">Desocupado</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs font-medium">{item.concepto} • {item.tipoInteres}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{item.mesBase}/{item.anioBase}</td>
                    <td className="px-5 py-4 text-right font-medium text-gray-600">
                      ${item.capitalReliquidado.toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-emerald-600">
                      +${item.interesesCalculados.toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-blue-700 bg-blue-50/10 group-hover:bg-transparent">
                      ${item.totalDevolucion.toLocaleString('es-CO')}
                    </td>
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