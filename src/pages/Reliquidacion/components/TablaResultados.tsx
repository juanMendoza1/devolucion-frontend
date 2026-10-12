import { useState } from 'react';
import { Search } from 'lucide-react';
import type { ReliquidacionResponse, ReliquidacionRequest } from '../../../types/reliquidacion';

interface TablaResultadosProps {
  formData: ReliquidacionRequest;
  setFormData: React.Dispatch<React.SetStateAction<ReliquidacionRequest>>;
  resultados: ReliquidacionResponse[];
  isProcessing: boolean;
  progreso: { porcentaje: number; mensaje: string };
  onCalcular: () => void;
  onForzarLimpieza: () => void;
}

// Función para no perder decimales
const formatDecimals = (value: number | undefined | null | string) => {
  if (value === undefined || value === null || value === '') return '0';
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 10 // Respeta todos los decimales
  });
};

export default function TablaResultados({
  formData, setFormData, resultados, isProcessing, progreso, onCalcular, onForzarLimpieza
}: TablaResultadosProps) {
  
  const [codigosTexto, setCodigosTexto] = useState(formData.codigosPrueba.join('\n'));
  const [filtroTabla, setFiltroTabla] = useState(''); // 🔥 Estado para el filtro de la tabla

  const handleCodigosChange = (texto: string) => {
    setCodigosTexto(texto);
    const codigosArr = texto.split(/[\n,]+/).map(c => c.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, codigosPrueba: codigosArr }));
  };

  const toggleTarifaProductivo = (jobId: string) => {
    setFormData(prev => ({
      ...prev,
      tarifasAProcesar: prev.tarifasAProcesar.includes(jobId)
        ? prev.tarifasAProcesar.filter(id => id !== jobId)
        : [...prev.tarifasAProcesar, jobId]
    }));
  };

  // 🔥 Lógica de filtrado de la tabla
  const resultadosFiltrados = resultados.filter(item => {
    if (!filtroTabla.trim()) return true;
    const termino = filtroTabla.toLowerCase();
    return (
      item.codigoDataease?.toLowerCase().includes(termino) ||
      item.factura?.toLowerCase().includes(termino) ||
      item.concepto?.toLowerCase().includes(termino)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col relative min-h-[500px]">
      
      {/* OVERLAY DE CARGA */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8">
          <h3 className="text-2xl font-bold text-black mb-4 tracking-tight">
            {formData.esDemo ? 'Simulando Escenario...' : 'Ejecutando Motor en Producción...'}
          </h3>
          {!formData.esDemo && (
            <div className="w-full max-w-md text-center">
              <div className="w-full bg-gray-200 h-2 mb-4 overflow-hidden rounded-full">
                <div 
                  className={`h-2 transition-all duration-1000 ${
                    progreso.porcentaje > 0 && progreso.porcentaje < 100 
                      ? 'bg-blue-600 animate-pulse' 
                      : 'bg-black'
                  }`} 
                  style={{ width: `${Math.max(progreso.porcentaje, 5)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-500 mb-6">
                <p>{progreso.mensaje || 'Conectando...'}</p><p>{progreso.porcentaje}%</p>
              </div>
            </div>
          )}
          {formData.esDemo && <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse mb-6">{progreso.mensaje || 'Calculando...'}</p>}
          <button onClick={onForzarLimpieza} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase underline transition-colors">Forzar Limpieza (Detener)</button>
        </div>
      )}

      {/* CENTRO DE MANDO (HEADER INTELIGENTE) */}
      <div className="bg-gray-50 border-b border-gray-200 p-6 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="flex-1 w-full">
            <h2 className="text-base font-bold text-black tracking-wide uppercase mb-4">3. Entorno de Ejecución</h2>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setFormData({...formData, esDemo: true})} 
                className={`px-4 py-2 text-sm font-bold rounded-lg border ${formData.esDemo ? 'bg-white border-black text-black shadow-sm' : 'bg-transparent border-gray-300 text-gray-500'}`}
                disabled={isProcessing}
              >
                Simulador
              </button>
              <button 
                onClick={() => setFormData({...formData, esDemo: false})} 
                className={`px-4 py-2 text-sm font-bold rounded-lg border ${!formData.esDemo ? 'bg-white border-black text-black shadow-sm' : 'bg-transparent border-gray-300 text-gray-500'}`}
                disabled={isProcessing}
              >
                Producción
              </button>
            </div>

            {formData.esDemo ? (
              <div className="w-full max-w-lg">
                <textarea 
                  value={codigosTexto}
                  onChange={(e) => handleCodigosChange(e.target.value)}
                  placeholder="Ingresa Códigos Dataease (ej. 12345, 67890)"
                  className="w-full h-16 bg-white border border-gray-300 rounded p-2 text-xs font-mono outline-none resize-none"
                  disabled={isProcessing}
                />
              </div>
            ) : (
              <div className="w-full flex gap-2 overflow-x-auto pb-2">
                {formData.tarifasConfig.length === 0 ? <p className="text-xs text-gray-400 py-2">Configura tarifas en el paso anterior.</p> : 
                  formData.tarifasConfig.map(t => (
                    <label key={`prod-${t.jobId}`} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-pointer whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={formData.tarifasAProcesar.includes(t.jobId)}
                        onChange={() => toggleTarifaProductivo(t.jobId)}
                        disabled={isProcessing}
                        className="text-black rounded-sm border-gray-300"
                      />
                      <span className="text-xs font-bold text-gray-700">{t.nombreVisible}</span>
                    </label>
                  ))
                }
              </div>
            )}
          </div>

          <div className="w-full md:w-auto flex flex-col items-end gap-2 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
             <button 
                onClick={onCalcular}
                disabled={isProcessing}
                className={`w-full md:w-64 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wide
                  ${isProcessing ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-900 shadow-md'}
                `}
              >
                Procesar
              </button>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                Registros: {resultadosFiltrados.length} {filtroTabla && `(de ${resultados.length})`}
              </span>
          </div>
        </div>
      </div>

      {/* 🔥 BARRA DE BÚSQUEDA DE LA TABLA */}
      {resultados.length > 0 && (
        <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por Código, Factura o Concepto..."
              value={filtroTabla}
              onChange={(e) => setFiltroTabla(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-black outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* CONTENIDO DE TABLA */}
      <div className="overflow-x-auto flex-1 p-4 bg-white relative">
        {resultados.length === 0 && !isProcessing ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-black space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Sin Datos</p>
          </div>
        ) : resultadosFiltrados.length > 0 ? (
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-black font-bold text-xs uppercase tracking-wider border-b-2 border-black sticky top-0 bg-white shadow-[0_1px_0_0_black]">
              <tr>
                <th className="px-4 py-3">Tarifa</th>
                <th className="px-4 py-3">Código Dataease</th>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-center">Periodo</th>
                <th className="px-4 py-3 text-right">Ajustado</th>
                <th className="px-4 py-3 text-right">Subcon</th>
                <th className="px-4 py-3 text-center">Tasa Aplicada</th>
                <th className="px-4 py-3 text-right">Capital Base</th>
                <th className="px-4 py-3 text-right">Intereses</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resultadosFiltrados.map((item, index) => {
                // Buscamos el nombre legible de la tarifa
                const nombreTarifa = formData.tarifasConfig.find(t => t.jobId === item.jobId)?.nombreVisible || item.jobId.substring(0, 8);
                
                return (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">{nombreTarifa}</td>
                    <td className="px-4 py-3 font-bold text-black">{item.codigoDataease || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-black">
                      {item.factura || item.facturaOriginalId}
                      {item.desocupadoMesBase && <span className="ml-2 text-[10px] text-gray-500 font-bold uppercase border border-gray-300 px-1.5 py-0.5">Vacío</span>}
                    </td>
                    <td className="px-4 py-3 text-black text-xs font-bold">{item.concepto}</td>
                    
                    {/* 🔥 CORREGIDO: Mostramos Mes/Año centrado */}
                    <td className="px-4 py-3 text-black text-xs font-bold text-center">
                      {String(item.mesBase).padStart(2, '0')}/{item.anioBase}
                    </td>
                    
                    {/* Cálculos sin redondear */}
                    <td className="px-4 py-3 text-right font-medium text-gray-500">{formatDecimals(item.ajustado)}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-600 bg-blue-50/50">{formatDecimals(item.subcon)}</td>
                    
                    {/* 🔥 CORREGIDO: Tasa con todos sus decimales */}
                    <td className="px-4 py-3 text-center font-mono font-bold text-gray-600">
                      {item.detalleTasas ? formatDecimals(item.detalleTasas) : '0'}
                    </td>
                    
                    <td className="px-4 py-3 text-right font-medium text-gray-600">{formatDecimals(item.capitalReliquidado)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-600">{formatDecimals(item.interesesCalculados)}</td>
                    <td className="px-4 py-3 text-right font-bold text-black">{formatDecimals(item.totalDevolucion)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-black space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No hay coincidencias en la búsqueda</p>
          </div>
        )}
      </div>
    </div>
  ); 
}