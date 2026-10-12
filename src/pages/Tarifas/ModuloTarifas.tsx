import { useState } from 'react';
import GridTarifas from './components/GridTarifas';
import DetalleTarifa from './components/DetalleTarifa';
import TablaAuditoria from './components/TablaAuditoria';

export default function ModuloTarifas() {
  const [activeTab, setActiveTab] = useState<'gestion' | 'auditoria'>('gestion');
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState<{jobId: string, mes: number, anio: number} | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* CABECERA PRINCIPAL */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tarifas</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Administrar la asignación de las tarifas a las ASOCIACIONES.
        </p>
      </div>

      {/* SISTEMA DE PESTAÑAS (SIN ÍCONOS) */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-fit">
        <button
          onClick={() => setActiveTab('gestion')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'gestion' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Asignaciones
        </button>
        <button
          onClick={() => {
            setActiveTab('auditoria');
            setTarifaSeleccionada(null); 
          }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'auditoria' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico
        </button>
      </div>

      {/* CONTENEDOR DE LAS VISTAS */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 min-h-[600px]">
        {activeTab === 'gestion' && (
          <>
            {tarifaSeleccionada ? (
              <DetalleTarifa 
                tarifa={tarifaSeleccionada} 
                onVolver={() => setTarifaSeleccionada(null)} 
              />
            ) : (
              <GridTarifas 
                onSelectTarifa={(tarifaData) => setTarifaSeleccionada(tarifaData)} 
              />
            )}
          </>
        )}

        {activeTab === 'auditoria' && <TablaAuditoria />}
      </div>
    </div>
  );
}