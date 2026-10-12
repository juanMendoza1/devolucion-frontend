import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, ChevronDown } from 'lucide-react';
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
        <h2 className="text-base font-bold text-black tracking-wide border-b border-gray-200 pb-2 mb-6">
          1. Maestro de Devolución
        </h2>
        
        <div className="mb-6 flex gap-2 items-center">
          {modoDevolucion === 'EXISTENTE' ? (
            <>
              <select 
                className="flex-1 bg-white border border-gray-300 rounded-md p-3 text-sm focus:border-black outline-none font-medium"
                value={formData.nombreDevolucion}
                onChange={(e) => setFormData({...formData, nombreDevolucion: e.target.value})}
                disabled={isProcessing}
              >
                <option value="">-- Seleccionar Devolución Existente --</option>
                {consolidados.map(c => (
                  <option key={c.id} value={c.nombreDevolucion}>{c.nombreDevolucion}</option>
                ))}
              </select>
              <button 
                title="Crear Nueva Devolución"
                onClick={() => { setModoDevolucion('NUEVA'); setFormData({...formData, nombreDevolucion: ''}); }} 
                className="bg-black text-white p-3 rounded-md hover:bg-gray-800 transition shadow-sm"
              >
                <Plus className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <input 
                type="text"
                placeholder="Nombre de la Nueva Devolución..."
                className="flex-1 bg-white border border-gray-300 rounded-md p-3 text-sm focus:border-black outline-none font-medium"
                value={formData.nombreDevolucion}
                onChange={(e) => setFormData({...formData, nombreDevolucion: e.target.value})}
                disabled={isProcessing}
              />
              <button 
                title="Elegir del Historial"
                onClick={() => { setModoDevolucion('EXISTENTE'); setFormData({...formData, nombreDevolucion: ''}); }} 
                className="bg-gray-200 text-gray-700 p-3 rounded-md hover:bg-gray-300 transition shadow-sm"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Tarifas Disponibles</label>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-black">
              {formData.tarifasConfig.length} seleccionadas
            </span>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 flex-1 overflow-y-auto space-y-2">
            {config?.lotes?.map(lote => {
              const isSelected = formData.tarifasConfig.some(t => t.jobId === lote.jobId);
              return (
                <label key={lote.jobId} className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors border text-sm ${isSelected ? 'bg-white border-black shadow-sm' : 'hover:bg-white border-transparent'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => handleToggleTarifa(lote.jobId, lote.descripcion)} className="mt-0.5 w-4 h-4 text-black border-gray-400 rounded-sm" />
                  <div className="flex flex-col">
                    <span className="text-black font-bold leading-none">{lote.descripcion}</span>
                    <span className="text-gray-400 text-xs font-mono mt-1">{lote.jobId.substring(0, 8)}...</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* COLUMNA 2: Configuración Individual */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
        <h2 className="text-base font-bold text-black tracking-wide border-b border-gray-200 pb-2 mb-4">
          2. Configuración de Tarifas
        </h2>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {formData.tarifasConfig.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-sm text-gray-400 font-medium">
              Selecciona tarifas en el panel izquierdo.
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
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
        <h3 className="font-bold text-gray-900 text-sm">{tarifa.nombreVisible}</h3>
        <button onClick={onRemove} disabled={isProcessing} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase">Eliminar</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Concepto</label>
          <select className="w-full bg-white border border-gray-300 rounded p-2 text-xs outline-none" value={tarifa.concepto} onChange={(e) => onUpdate({ concepto: e.target.value })} disabled={isProcessing}>
            {config?.conceptos?.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Interés</label>
          <select className="w-full bg-white border border-gray-300 rounded p-2 text-xs outline-none" value={tarifa.tipoInteres} onChange={(e) => onUpdate({ tipoInteres: e.target.value })} disabled={isProcessing}>
            {config?.tiposInteres?.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex gap-1">
          <select className="bg-white border border-gray-300 rounded p-1.5 text-xs w-full" value={rango.desdeMes} onChange={(e) => setRango({...rango, desdeMes: Number(e.target.value)})} disabled={isProcessing}>
            {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <input type="number" className="bg-white border border-gray-300 rounded p-1.5 text-xs w-full" value={rango.desdeAno} onChange={(e) => setRango({...rango, desdeAno: Number(e.target.value)})} disabled={isProcessing}/>
        </div>
        <div className="flex gap-1">
          <select className="bg-white border border-gray-300 rounded p-1.5 text-xs w-full" value={rango.hastaMes} onChange={(e) => setRango({...rango, hastaMes: Number(e.target.value)})} disabled={isProcessing}>
            {nombresMeses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <input type="number" className="bg-white border border-gray-300 rounded p-1.5 text-xs w-full" value={rango.hastaAno} onChange={(e) => setRango({...rango, hastaAno: Number(e.target.value)})} disabled={isProcessing}/>
        </div>
      </div>

      {tarifa.periodosOrdenados.length === 0 ? (
        <button onClick={generarRango} disabled={isProcessing} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded text-xs transition-colors">Generar Línea de Tiempo</button>
      ) : (
        <div className="flex justify-between items-center bg-green-50 text-green-800 p-2 rounded border border-green-200">
          <span className="text-[11px] font-bold">{tarifa.periodosOrdenados.length} periodos listos</span>
          {!isProcessing && <button onClick={() => onUpdate({ periodosOrdenados: [] })} className="text-[10px] underline font-bold">Editar</button>}
        </div>
      )}
    </div>
  );
}