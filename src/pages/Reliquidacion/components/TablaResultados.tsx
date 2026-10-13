import { useState } from 'react';
import type { ReliquidacionResponse, ReliquidacionRequest } from '../../../types/reliquidacion';

interface TablaResultadosProps {
  formData: ReliquidacionRequest;
  setFormData: React.Dispatch<React.SetStateAction<ReliquidacionRequest>>;
  resultados: ReliquidacionResponse[];
  resumenes: any[];
  isProcessing: boolean;
  progreso: { porcentaje: number; mensaje: string };
  paso: { actual: number; total: number; completadas: number };
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
  formData, setFormData, resultados, resumenes, isProcessing, progreso, paso, onCalcular, onForzarLimpieza
}: TablaResultadosProps) {
  
  const [codigosTexto, setCodigosTexto] = useState(formData.codigosPrueba.join('\n'));
  const [filtroTabla, setFiltroTabla] = useState(''); // Estado para el filtro de la tabla

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

  // Lógica de filtrado de la tabla
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
    <div className="card overflow-hidden flex flex-col relative min-h-[500px]">
      
      {/* OVERLAY DE CARGA */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8">
          <span className="spinner h-8 w-8 border-[3px] text-petroleo-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">
            {formData.esDemo ? 'Simulando escenario...' : 'Procesando en producción...'}
          </h3>
          {paso.total > 0 && (
            <p className="text-sm font-semibold text-petroleo-700 mb-4 tabular-nums">
              Tarifa {paso.actual} de {paso.total}
            </p>
          )}
          <div className="w-full max-w-md text-center">
            {/* Avance real: tarifas terminadas sobre el total (el cálculo de cada tarifa no reporta avance intermedio) */}
            {paso.total > 1 && (
              <div className="w-full bg-petroleo-100 h-2 mb-3 overflow-hidden rounded-full">
                <div
                  className="h-2 rounded-full bg-verde-500 transition-all duration-700"
                  style={{ width: `${(paso.completadas / paso.total) * 100}%` }}
                />
              </div>
            )}
            <p className="text-sm text-slate-500 mb-6">{progreso.mensaje || 'Conectando...'}</p>
          </div>
          <button onClick={onForzarLimpieza} className="btn-link text-xs text-red-600 hover:text-red-700">Forzar limpieza (detener)</button>
        </div>
      )}

      {/* CENTRO DE MANDO */}
      <div className="card-header items-stretch md:items-center flex-col md:flex-row gap-6 py-5">
        <div className="flex-1 w-full min-w-0">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-base font-semibold">
              <span className="text-verde-600 mr-1.5">3.</span> Entorno de ejecución
            </h2>
            <div className="inline-flex gap-1 rounded-xl border border-borde bg-white p-1">
              <button 
                onClick={() => setFormData({...formData, esDemo: true})} 
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${formData.esDemo ? 'bg-petroleo-700 text-white shadow-sm' : 'text-petroleo-700 hover:bg-petroleo-50'}`}
                disabled={isProcessing}
              >
                Simulador
              </button>
              <button 
                onClick={() => setFormData({...formData, esDemo: false})} 
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${!formData.esDemo ? 'bg-petroleo-700 text-white shadow-sm' : 'text-petroleo-700 hover:bg-petroleo-50'}`}
                disabled={isProcessing}
              >
                Producción
              </button>
            </div>
          </div>

          {formData.esDemo ? (
            <div className="w-full max-w-xl">
              <label className="label">Códigos Dataease de prueba</label>
              <textarea 
                value={codigosTexto}
                onChange={(e) => handleCodigosChange(e.target.value)}
                placeholder="Ingrese códigos Dataease (ej. 12345, 67890)"
                className="input h-20 py-2 text-xs font-mono resize-none"
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div>
              <label className="label">Tarifas a procesar</label>
              <div className="w-full flex gap-2 overflow-x-auto pb-1">
                {formData.tarifasConfig.length === 0 ? <p className="text-sm text-slate-400 py-2">Configure tarifas en el paso anterior.</p> : 
                  formData.tarifasConfig.map(t => (
                    <label key={`prod-${t.jobId}`} className="flex items-center gap-2 px-3 py-2 bg-white border border-borde rounded-lg cursor-pointer whitespace-nowrap hover:border-petroleo-200">
                      <input 
                        type="checkbox" 
                        checked={formData.tarifasAProcesar.includes(t.jobId)}
                        onChange={() => toggleTarifaProductivo(t.jobId)}
                        disabled={isProcessing}
                        className="accent-petroleo-700"
                      />
                      <span className="text-xs font-semibold text-petroleo-900">{t.nombreVisible}</span>
                    </label>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-2 border-t md:border-t-0 md:border-l border-borde pt-4 md:pt-0 md:pl-6">
          <span className={`self-start md:self-end ${formData.esDemo ? 'badge-info' : 'badge-warn'}`}>
            {formData.esDemo ? 'Sin impacto en base de datos' : 'Impacta la base de datos'}
          </span>
          <button 
            onClick={onCalcular}
            disabled={isProcessing}
            className="btn-success md:w-56 py-3"
          >
            Procesar
          </button>
          {formData.esDemo && (
            <span className="text-xs text-slate-400 text-right tabular-nums">
              Registros: {resultadosFiltrados.length} {filtroTabla && `(de ${resultados.length})`}
            </span>
          )}
        </div>
      </div>

      {/* PRODUCCIÓN: solo tarjetas de resumen por tarifa (el detalle se consulta en Consolidados y en el Visor) */}
      {!formData.esDemo && <ResumenesProduccion resumenes={resumenes} isProcessing={isProcessing} />}

      {/* BARRA DE BÚSQUEDA DE LA TABLA (simulador) */}
      {formData.esDemo && resultados.length > 0 && (
        <div className="px-6 py-3 border-b border-borde flex items-center">
          <input
            type="text"
            placeholder="Buscar por código, factura o concepto"
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            className="input max-w-md py-2"
          />
        </div>
      )}

      {/* CONTENIDO DE TABLA (simulador) */}
      {formData.esDemo && (
      <div className="overflow-x-auto flex-1 relative">
        {resultados.length === 0 && !isProcessing ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-semibold text-petroleo-900">Sin resultados todavía</p>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Configure la devolución y las tarifas, y presione Procesar para ver aquí el detalle del cálculo.
            </p>
          </div>
        ) : resultadosFiltrados.length > 0 ? (
          <table className="table-base whitespace-nowrap">
            <thead className="sticky top-0">
              <tr>
                <th>Tarifa</th>
                <th>Código Dataease</th>
                <th>Factura</th>
                <th>Concepto</th>
                <th className="text-center">Periodo</th>
                <th className="text-right">Ajustado</th>
                <th className="text-right">Subcon</th>
                <th className="text-right">Tasa aplicada</th>
                <th className="text-right">Capital base</th>
                <th className="text-right">Intereses</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {resultadosFiltrados.map((item, index) => {
                // Buscamos el nombre legible de la tarifa
                const nombreTarifa = formData.tarifasConfig.find(t => t.jobId === item.jobId)?.nombreVisible || item.jobId.substring(0, 8);
                
                return (
                  <tr key={item.id || index}>
                    <td className="text-xs font-semibold text-petroleo-900">{nombreTarifa}</td>
                    <td className="font-mono font-semibold text-petroleo-900">{item.codigoDataease || '-'}</td>
                    <td className="font-medium">
                      {item.factura || item.facturaOriginalId}
                      {item.desocupadoMesBase && <span className="badge-off ml-2">Vacío</span>}
                    </td>
                    <td className="text-xs font-semibold">{item.concepto}</td>
                    
                    {/* Mes/Año centrado */}
                    <td className="text-xs font-semibold text-center tabular-nums">
                      {String(item.mesBase).padStart(2, '0')}/{item.anioBase}
                    </td>
                    
                    {/* Cálculos sin redondear */}
                    <td className="text-right tabular-nums text-slate-500">{formatDecimals(item.ajustado)}</td>
                    <td className="text-right tabular-nums text-petroleo-600 bg-petroleo-50/40">{formatDecimals(item.subcon)}</td>
                    
                    {/* Tasa con todos sus decimales */}
                    <td className="text-right tabular-nums font-mono text-slate-600">
                      {item.detalleTasas ? formatDecimals(item.detalleTasas) : '0'}
                    </td>
                    
                    <td className="text-right tabular-nums text-slate-600">{formatDecimals(item.capitalReliquidado)}</td>
                    <td className="text-right tabular-nums text-slate-600">{formatDecimals(item.interesesCalculados)}</td>
                    <td className="text-right tabular-nums font-bold text-petroleo-900">{formatDecimals(item.totalDevolucion)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center">
            <p className="text-sm text-slate-400">No hay coincidencias en la búsqueda.</p>
          </div>
        )}
      </div>
      )}
    </div>
  ); 
}

const fmtValor = (v: any) => {
  const n = Number(v ?? 0);
  const texto = Math.abs(n).toLocaleString('es-CO', { maximumFractionDigits: 10 });
  return n < 0 ? `-$${texto}` : `$${texto}`;
};

/** Tarjetas de resumen de las tarifas liquidadas en la ejecución actual, con el total acumulado. */
function ResumenesProduccion({ resumenes, isProcessing }: { resumenes: any[]; isProcessing: boolean }) {
  if (resumenes.length === 0) {
    return (
      <div className="min-h-[240px] flex flex-col items-center justify-center text-center px-6">
        <p className="text-sm font-semibold text-petroleo-900">{isProcessing ? 'Procesando...' : 'Sin tarifas procesadas'}</p>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Al procesar, aquí aparecerá el resumen de cada tarifa liquidada. El detalle por usuario se consulta en Consolidados y en el Visor de facturas.
        </p>
      </div>
    );
  }

  const total = resumenes.reduce(
    (acc, r) => ({
      usuarios: acc.usuarios + Number(r.usuarios || 0),
      capital: acc.capital + Number(r.capital || 0),
      intereses: acc.intereses + Number(r.intereses || 0),
      total: acc.total + Number(r.total || 0),
    }),
    { usuarios: 0, capital: 0, intereses: 0, total: 0 }
  );

  return (
    <div className="p-6 space-y-5">
      {resumenes.length > 1 && (
        <div className="rounded-xl bg-petroleo-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-verde-300">Total de esta ejecución</p>
            <p className="text-xs text-petroleo-200 mt-0.5">{resumenes.length} tarifas liquidadas</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm tabular-nums">
            <span>Capital <b>{fmtValor(total.capital)}</b></span>
            <span>Intereses <b>{fmtValor(total.intereses)}</b></span>
            <span className="text-lg font-bold">{fmtValor(total.total)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {resumenes.map((r, i) => (
          <div key={`${r.nombreTarifa}-${i}`} className="rounded-xl border border-borde bg-white shadow-suave overflow-hidden">
            <div className="px-5 py-4 bg-petroleo-50 border-b border-borde flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="page-kicker">Tarifa liquidada</p>
                <p className="mt-1 text-sm font-bold text-petroleo-900 truncate" title={r.nombreTarifa}>{r.nombreTarifa}</p>
              </div>
              <span className="badge-info shrink-0">{r.concepto}</span>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="kpi-label">Usuarios</span><span className="font-semibold tabular-nums">{Number(r.usuarios || 0).toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between"><span className="kpi-label">Capital</span><span className="tabular-nums">{fmtValor(r.capital)}</span></div>
              <div className="flex justify-between"><span className="kpi-label">Intereses</span><span className="tabular-nums">{fmtValor(r.intereses)}</span></div>
            </div>
            <div className="px-5 py-3 bg-verde-50 border-t border-verde-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-verde-800 uppercase tracking-wide">Total</span>
              <span className="font-bold text-petroleo-900 tabular-nums">{fmtValor(r.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
