import { useState } from 'react';
import GridTarifas from './components/GridTarifas';
import DetalleTarifa from './components/DetalleTarifa';
import TablaAuditoria from './components/TablaAuditoria';

export default function ModuloTarifas() {
  const [activeTab, setActiveTab] = useState<'gestion' | 'auditoria'>('gestion');
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState<{jobId: string, mes: number, anio: number} | null>(null);

  return (
    <div className="max-w-7xl">
      <div className="page-header">
        <div>
          <p className="page-kicker">Parametrización</p>
          <h1 className="page-title">Gestión de tarifas</h1>
          <p className="page-subtitle">
            Asigne las tarifas a las asociaciones de aprovechadores.
          </p>
        </div>

        {/* PESTAÑAS */}
        <div className="inline-flex gap-1 rounded-xl border border-borde bg-white p-1 shadow-suave">
          <button
            onClick={() => setActiveTab('gestion')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'gestion' ? 'bg-petroleo-700 text-white shadow-sm' : 'text-petroleo-700 hover:bg-petroleo-50'
          }`}
          >
            Asignaciones
          </button>
          <button
            onClick={() => {
              setActiveTab('auditoria');
              setTarifaSeleccionada(null); 
            }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'auditoria' ? 'bg-petroleo-700 text-white shadow-sm' : 'text-petroleo-700 hover:bg-petroleo-50'
          }`}
          >
            Histórico
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE LAS VISTAS */}
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
  );
}
