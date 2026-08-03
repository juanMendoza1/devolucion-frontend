import { useState } from 'react';
import { History, Settings2 } from 'lucide-react';
import GridLotes from './components/GridLotes';
import DetalleLote from './components/DetalleLote';
import TablaAuditoria from './components/TablaAuditoria';

export default function ModuloTarifas() {
  // Estados Globales del Módulo
  const [activeTab, setActiveTab] = useState<'gestion' | 'auditoria'>('gestion');
  const [loteSeleccionado, setLoteSeleccionado] = useState<{jobId: string, mes: number, anio: number} | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* CABECERA PRINCIPAL */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Tarifas</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Administra las asignaciones y revisa el historial de movimientos.
        </p>
      </div>

      {/* SISTEMA DE PESTAÑAS (TABS) */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-fit">
        <button
          onClick={() => setActiveTab('gestion')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'gestion' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Asignaciones
        </button>
        <button
          onClick={() => {
            setActiveTab('auditoria');
            setLoteSeleccionado(null); // Opcional: Reiniciar la navegación al cambiar de tab
          }}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'auditoria' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="h-4 w-4 mr-2" />
          Historial de Auditoría
        </button>
      </div>

      {/* CONTENEDOR DE LAS VISTAS */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 min-h-[600px]">
        
        {/* PESTAÑA 1: GESTIÓN */}
        {activeTab === 'gestion' && (
          <>
            {loteSeleccionado ? (
              <DetalleLote 
                lote={loteSeleccionado} 
                onVolver={() => setLoteSeleccionado(null)} 
              />
            ) : (
              <GridLotes 
                onSelectLote={(loteData) => setLoteSeleccionado(loteData)} 
              />
            )}
          </>
        )}

        {/* PESTAÑA 2: AUDITORÍA */}
        {activeTab === 'auditoria' && (
          <TablaAuditoria />
        )}

      </div>
    </div>
  );
}