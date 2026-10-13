import { useState } from 'react';
import toast from 'react-hot-toast';
import type { ReliquidacionRequest, ParametrosConfig, TarifaConfig, Periodo, DevolucionMaestro } from '../../../types/reliquidacion';

interface PanelConfiguracionProps {
  formData: ReliquidacionRequest;
  setFormData: React.Dispatch<React.SetStateAction<ReliquidacionRequest>>;
  config: ParametrosConfig | null;
  consolidados: DevolucionMaestro[];
  isProcessing: boolean;
}

const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function PanelConfiguracion({
  formData, setFormData, config, consolidados, isProcessing
}: PanelConfiguracionProps) {

  const [modoDevolucion, setModoDevolucion] = useState<'EXISTENTE' | 'NUEVA'>('EXISTENTE');

  const handleToggleTarifa = (jobId: string, descripcion: string) => {
    setFormData(prev => {
      const existe = prev.tarifasConfig.some(t => t.jobId === jobId);
      if (existe) {
        return { 
          ...prev, 
          tarifasConfig: prev.tarifasConfig.filter(t => t.jobId !== jobId),
          tarifasAProcesar: prev.tarifasAProcesar.filter(id => id !== jobId)
        };
      } else {
        const nuevaConfig: TarifaConfig = {
          jobId, nombreVisible: descripcion,
          concepto: config?.conceptos?.[0] || 'TA',
          tipoInteres: config?.tiposInteres?.[0] || 'NINGUNO',
          periodosOrdenados: []
        };
        return { 
          ...prev, 
          tarifasConfig: [...prev.tarifasConfig, nuevaConfig],
          tarifasAProcesar: [...prev.tarifasAProcesar, jobId]
        };
      }
    });
  };

  const updateTarifaConfig = (jobId: string, updates: Partial<TarifaConfig>) => {
    setFormData(prev => ({
      ...prev,
      tarifasConfig: prev.tarifasConfig.map(t => t.jobId === jobId ? { ...t, ...updates } : t)
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* COLUMNA 1: Agrupación de Tarifas */}
      <div className="card flex flex-col h-[500px]">
        <div className="card-header">
          <h2 className="text-base font-semibold">
            <span className="text-verde-600 mr-1.5">1.</span> Maestro de devolución
          </h2>
        </div>
        
        <div className="card-body flex flex-col flex-1 overflow-hidden">
          <div className="mb-5">
            <label className="label">{modoDevolucion === 'EXISTENTE' ? 'Devolución existente' : 'Nueva devolución'}</label>
            <div className="flex gap-2 items-center">
              {modoDevolucion === 'EXISTENTE' ? (
                <>
                  <select 
                    className="input flex-1 cursor-pointer"
                    value={formData.nombreDevolucion}
                    onChange={(e) => setFormData({...formData, nombreDevolucion: e.target.value})}
                    disabled={isProcessing}
                  >
                    <option value="">-- Seleccionar devolución existente --</option>
                    {consolidados.map(c => (
                      <option key={c.id} value={c.nombreDevolucion}>{c.nombreDevolucion}</option>
                    ))}
                  </select>
                  <button 
                    title="Crear nueva devolución"
                    onClick={() => { setModoDevolucion('NUEVA'); setFormData({...formData, nombreDevolucion: ''}); }} 
                    className="btn-primary whitespace-nowrap"
                  >
                    Nueva
                  </button>
                </>
              ) : (
                <>
                  <input 
                    type="text"
                    placeholder="Nombre de la nueva devolución..."
                    className="input flex-1"
                    value={formData.nombreDevolucion}
                    onChange={(e) => setFormData({...formData, nombreDevolucion: e.target.value})}
                    disabled={isProcessing}
                  />
                  <button 
                    title="Elegir del historial"
                    onClick={() => { setModoDevolucion('EXISTENTE'); setFormData({...formData, nombreDevolucion: ''}); }} 
                    className="btn-secondary whitespace-nowrap"
                  >
                    Elegir existente
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Tarifas disponibles</label>
              <span className="badge-info">
                {formData.tarifasConfig.length} seleccionadas
              </span>
            </div>
            
            <div className="bg-fondo border border-borde rounded-xl p-2.5 flex-1 overflow-y-auto space-y-1.5">
              {(!config?.lotes || config.lotes.length === 0) && (
                <div className="h-full flex items-center justify-center text-center text-sm text-slate-400 px-6">
                  No hay tarifas pendientes por liquidar. Las tarifas ya liquidadas no se muestran.
                </div>
              )}
              {config?.lotes?.map(lote => {
                const isSelected = formData.tarifasConfig.some(t => t.jobId === lote.jobId);
                return (
                  <label key={lote.jobId} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border text-sm ${isSelected ? 'bg-white border-petroleo-300 shadow-suave' : 'hover:bg-white border-transparent'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => handleToggleTarifa(lote.jobId, lote.descripcion)} className="mt-0.5 w-4 h-4 accent-petroleo-700" />
                    <div className="flex flex-col">
                      <span className="text-petroleo-900 font-semibold leading-none">{lote.descripcion}</span>
                      <span className="text-slate-400 text-xs font-mono mt-1">{lote.jobId.substring(0, 8)}...</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* COLUMNA 2: Configuración Individual */}
      <div className="card flex flex-col h-[500px]">
        <div className="card-header">
          <h2 className="text-base font-semibold">
            <span className="text-verde-600 mr-1.5">2.</span> Configuración de tarifas
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {formData.tarifasConfig.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-petroleo-900">Sin tarifas seleccionadas</p>
              <p className="text-sm text-slate-400 mt-1">Seleccione tarifas en el panel izquierdo.</p>
            </div>
          ) : (
            formData.tarifasConfig.map((tarifa) => (
              <ConfiguracionTarifaItem 
                key={tarifa.jobId}
                tarifa={tarifa}
                config={config}
                isProcessing={isProcessing}
                onUpdate={(updates: Partial<TarifaConfig>) => updateTarifaConfig(tarifa.jobId, updates)}
                onRemove={() => handleToggleTarifa(tarifa.jobId, tarifa.nombreVisible)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ConfiguracionTarifaItem({ tarifa, config, isProcessing, onUpdate, onRemove }: any) {
  const anioActual = new Date().getFullYear();
  const [rango, setRango] = useState({ desdeMes: 1, desdeAno: anioActual, hastaMes: 12, hastaAno: anioActual });

  const generarRango = () => {
    const mesInicio = (rango.desdeAno * 12) + (rango.desdeMes - 1);
    const mesFin = (rango.hastaAno * 12) + (rango.hastaMes - 1);

    if (mesInicio > mesFin) return toast.error(`'Desde' no puede ser mayor a 'Hasta'.`);
    
    const nuevosPeriodos: Periodo[] = [];
    for (let i = mesInicio; i <= mesFin; i++) nuevosPeriodos.push({ mes: (i % 12) + 1, ano: Math.floor(i / 12) });
    onUpdate({ periodosOrdenados: nuevosPeriodos });
  };

  return (
    <div className="bg-fondo border border-borde rounded-xl p-4">
      <div className="flex justify-between items-start gap-3 mb-4 border-b border-borde pb-3">
        <h3 className="font-semibold text-petroleo-900 text-sm">{tarifa.nombreVisible}</h3>
        <button onClick={onRemove} disabled={isProcessing} className="btn-link text-xs text-red-600 hover:text-red-700">Eliminar</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="label">Concepto</label>
          <select className="input py-2 text-xs" value={tarifa.concepto} onChange={(e) => onUpdate({ concepto: e.target.value })} disabled={isProcessing}>
            {config?.conceptos?.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Interés</label>
          <select className="input py-2 text-xs" value={tarifa.tipoInteres} onChange={(e) => onUpdate({ tipoInteres: e.target.value })} disabled={isProcessing}>
            {config?.tiposInteres?.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label">Desde</label>
          <div className="flex gap-1.5">
            <select className="input px-2 py-1.5 text-xs" value={rango.desdeMes} onChange={(e) => setRango({...rango, desdeMes: Number(e.target.value)})} disabled={isProcessing}>
              {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" className="input px-2 py-1.5 text-xs tabular-nums" value={rango.desdeAno} onChange={(e) => setRango({...rango, desdeAno: Number(e.target.value)})} disabled={isProcessing}/>
          </div>
        </div>
        <div>
          <label className="label">Hasta</label>
          <div className="flex gap-1.5">
            <select className="input px-2 py-1.5 text-xs" value={rango.hastaMes} onChange={(e) => setRango({...rango, hastaMes: Number(e.target.value)})} disabled={isProcessing}>
              {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" className="input px-2 py-1.5 text-xs tabular-nums" value={rango.hastaAno} onChange={(e) => setRango({...rango, hastaAno: Number(e.target.value)})} disabled={isProcessing}/>
          </div>
        </div>
      </div>

      {tarifa.periodosOrdenados.length === 0 ? (
        <button onClick={generarRango} disabled={isProcessing} className="btn-secondary btn-sm w-full">Generar línea de tiempo</button>
      ) : (
        <div className="flex justify-between items-center bg-verde-50 text-verde-800 px-3 py-2 rounded-lg border border-verde-200">
          <span className="text-xs font-semibold">{tarifa.periodosOrdenados.length} periodos listos</span>
          {!isProcessing && <button onClick={() => onUpdate({ periodosOrdenados: [] })} className="btn-link text-xs text-verde-700 hover:text-verde-800">Editar</button>}
        </div>
      )}
    </div>
  );
}
