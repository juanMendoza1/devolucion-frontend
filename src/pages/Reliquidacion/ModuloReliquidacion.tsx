import { useState, useEffect } from 'react';
import { reliquidacionApi } from '../../api/reliquidacion';
import type { ReliquidacionRequest, ReliquidacionResponse, ParametrosConfig } from '../../types/reliquidacion';
import { Calculator, Calendar, Settings2, ShieldCheck, Trash2 } from 'lucide-react';

export const ModuloReliquidacion = () => {
  // Estados de carga y datos
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ParametrosConfig | null>(null);
  const [resultados, setResultados] = useState<ReliquidacionResponse[]>([]);

  // Estado del Formulario
  const [formData, setFormData] = useState<ReliquidacionRequest>({
    jobId: '',
    concepto: '',
    tipoInteres: '',
    esDemo: true,
    periodosOrdenados: []
  });

  // Estados para el Selector de Rango
  const anioActualUI = new Date().getFullYear();
  const [rango, setRango] = useState({
    desdeMes: 1, desdeAno: anioActualUI,
    hastaMes: 12, hastaAno: anioActualUI
  });

  const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Cargar parámetros iniciales desde el Backend
  useEffect(() => {
    const fetchParametros = async () => {
      try {
        const data = await reliquidacionApi.getParametros();
        setConfig(data);
        // Autoseleccionar los primeros valores si existen
        setFormData(prev => ({
          ...prev,
          jobId: data.lotes[0]?.jobId || '',
          concepto: data.conceptos[0] || '',
          tipoInteres: data.tiposInteres[0] || ''
        }));
      } catch (error) {
        alert('Error conectando con el servidor para cargar parámetros.');
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchParametros();
  }, []);

  // Función estrella: Generador Automático de Rangos
  const generarRango = () => {
    const mesInicioAbsoluto = (rango.desdeAno * 12) + (rango.desdeMes - 1);
    const mesFinAbsoluto = (rango.hastaAno * 12) + (rango.hastaMes - 1);

    if (mesInicioAbsoluto > mesFinAbsoluto) {
      alert('Error: El periodo "Desde" no puede ser mayor al periodo "Hasta".');
      return;
    }

    const nuevosPeriodos = [];
    for (let i = mesInicioAbsoluto; i <= mesFinAbsoluto; i++) {
      nuevosPeriodos.push({
        mes: (i % 12) + 1,
        ano: Math.floor(i / 12)
      });
    }

    setFormData({ ...formData, periodosOrdenados: nuevosPeriodos });
  };

  const limpiarPeriodos = () => setFormData({ ...formData, periodosOrdenados: [] });

  const eliminarPeriodo = (mes: number, ano: number) => {
    const filtrados = formData.periodosOrdenados.filter(p => !(p.mes === mes && p.ano === ano));
    setFormData({ ...formData, periodosOrdenados: filtrados });
  };

  const handleCalcular = async () => {
    if (!formData.jobId) return alert('Debes seleccionar un Lote.');
    if (formData.periodosOrdenados.length === 0) return alert('Debes generar la línea de tiempo.');

    setLoading(true);
    try {
      const data = await reliquidacionApi.calcular(formData);
      setResultados(data);
      if (data.length === 0) alert('No se encontraron datos.');
    } catch (error) {
      alert('Error en el cálculo. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return <div className="flex-1 flex items-center justify-center min-h-screen"><span className="animate-pulse text-gray-500 font-medium text-lg">Cargando motor financiero...</span></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            Motor de Reliquidación
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configura parámetros dinámicos, genera rangos y ejecuta auditorías.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* TARJETA 1: Parámetros Base */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-gray-800 uppercase flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Settings2 className="h-4 w-4" /> 1. Parámetros Base
            </h2>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lote a Procesar (Job ID)</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.jobId}
                onChange={(e) => setFormData({...formData, jobId: e.target.value})}
              >
                {config?.lotes.map(lote => (
                  <option key={lote.jobId} value={lote.jobId}>{lote.descripcion} ({lote.jobId})</option>
                ))}
                {config?.lotes.length === 0 && <option value="">No hay lotes disponibles</option>}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Concepto</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.concepto}
                  onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                >
                  {config?.conceptos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Interés (TSI)</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.tipoInteres}
                  onChange={(e) => setFormData({...formData, tipoInteres: e.target.value})}
                >
                  {config?.tiposInteres.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* TARJETA 2: Línea de Tiempo Automática */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-sm font-bold tracking-wide text-gray-800 uppercase flex items-center gap-2">
                <Calendar className="h-4 w-4" /> 2. Rango de Periodos
              </h2>
              {formData.periodosOrdenados.length > 0 && (
                <button onClick={limpiarPeriodos} className="text-xs text-red-500 hover:text-red-700 font-medium">Limpiar</button>
              )}
            </div>
            
            {/* Controles de Rango */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* DESDE */}
              <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Desde (Mes Base)</div>
              <select className="bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none" value={rango.desdeMes} onChange={(e) => setRango({...rango, desdeMes: Number(e.target.value)})}>
                {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" className="bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none" value={rango.desdeAno} onChange={(e) => setRango({...rango, desdeAno: Number(e.target.value)})} />
              
              {/* HASTA */}
              <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Hasta (Último Interés)</div>
              <select className="bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none" value={rango.hastaMes} onChange={(e) => setRango({...rango, hastaMes: Number(e.target.value)})}>
                {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" className="bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none" value={rango.hastaAno} onChange={(e) => setRango({...rango, hastaAno: Number(e.target.value)})} />
            </div>

            <button 
              onClick={generarRango}
              className="w-full mt-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 rounded-xl text-sm transition-colors"
            >
              Generar Línea de Tiempo
            </button>

            {/* Chips de los meses generados */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200/60 max-h-48 overflow-y-auto">
              {formData.periodosOrdenados.length === 0 ? (
                <p className="text-xs text-gray-400 text-center italic">Usa el rango para generar los meses.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {formData.periodosOrdenados.map((p, index) => (
                    <div 
                      key={`${p.ano}-${p.mes}`} 
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md font-semibold border
                        ${index === 0 ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}
                    >
                      {index === 0 && <span>BASE:</span>}
                      {nombresMeses[p.mes - 1]} {p.ano}
                      <button onClick={() => eliminarPeriodo(p.mes, p.ano)} className={`ml-0.5 focus:outline-none ${index === 0 ? 'text-blue-200 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}><Trash2 className="w-3 h-3"/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TARJETA 3: Ejecución */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-500"/> Entorno
              </span>
              <button 
                onClick={() => setFormData({...formData, esDemo: !formData.esDemo})}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  formData.esDemo ? 'bg-amber-100 text-amber-800' : 'bg-red-500 text-white shadow-md'
                }`}
              >
                {formData.esDemo ? 'Modo Seguro (Demo)' : 'Producción'}
              </button>
            </div>

            <button 
              onClick={handleCalcular}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.24)] transition-all disabled:bg-gray-400 disabled:shadow-none flex justify-center items-center gap-2"
            >
              {loading ? 'Calculando Lote...' : 'Ejecutar Motor Financiero'}
            </button>
          </div>

        </div>

        {/* PANEL DERECHO: RESULTADOS FINANCIEROS */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-gray-900 p-5 flex justify-between items-center text-white">
            <h2 className="text-sm font-bold tracking-widest uppercase">Tabla de Auditoría</h2>
            <div className="text-xs font-medium bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
              Registros: <span className="text-blue-400 ml-1">{resultados.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 p-2">
            {resultados.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="p-4 bg-gray-50 rounded-full"><Calculator className="w-10 h-10 text-gray-300" /></div>
                <p className="text-sm font-medium">El motor está esperando tus parámetros.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 font-semibold text-xs uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 rounded-tl-xl">Factura (Original)</th>
                    <th className="px-5 py-4">Lógica</th>
                    <th className="px-5 py-4 text-right">Capital Base</th>
                    <th className="px-5 py-4 text-right">Intereses</th>
                    <th className="px-5 py-4 text-right text-blue-700 rounded-tr-xl">Total Reliquidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resultados.map((item, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        #{item.facturaOriginalId}
                        {item.desocupadoMesBase && <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-red-100">Desocupado</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs font-medium">{item.concepto} • {item.tipoInteres}</td>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};