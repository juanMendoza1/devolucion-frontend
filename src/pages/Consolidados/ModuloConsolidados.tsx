import { useState, useEffect, useMemo } from 'react';
import { reliquidacionApi } from '../../api/reliquidacion';
import type { DevolucionMaestro, DesgloseMes } from '../../types/reliquidacion';
import { Beaker, Database, Eye, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ModuloConsolidados() {
  const [consolidados, setConsolidados] = useState<DevolucionMaestro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para el Modal de Detalle
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleMensual, setDetalleMensual] = useState<DesgloseMes[]>([]);
  const [maestroSeleccionado, setMaestroSeleccionado] = useState<DevolucionMaestro | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

  // Estado para manejar los acordeones abiertos
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await reliquidacionApi.getConsolidados();
        setConsolidados(data);
      } catch (error) {
        toast.error('Error al cargar el historial de consolidados.');
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const abrirDetalle = async (maestro: DevolucionMaestro) => {
    setMaestroSeleccionado(maestro);
    setModalOpen(true);
    setIsLoadingDetalle(true);
    setExpandedGroups([]); // Cerramos todos los acordeones al abrir un modal nuevo
    try {
      const data = await reliquidacionApi.getDesgloseMaestro(maestro.id);
      setDetalleMensual(data);
    } catch (error) {
      toast.error('Error al cargar el detalle mensual.');
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  const toggleGroup = (jobId: string) => {
    setExpandedGroups(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  // 🔥 Lógica de agrupación para el Acordeón
  const datosAgrupados = useMemo(() => {
    return detalleMensual.reduce((acc, curr) => {
      if (!acc[curr.jobId]) acc[curr.jobId] = [];
      acc[curr.jobId].push(curr);
      return acc;
    }, {} as Record<string, DesgloseMes[]>);
  }, [detalleMensual]);

  // 🔥 Calculamos la suma total exacta de lo que hay en pantalla
  const sumaTotalConsolidado = useMemo(() => {
    return detalleMensual.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [detalleMensual]);

  if (isLoading) {
    return <div className="p-8 text-center font-bold text-gray-500 animate-pulse">Cargando consolidados...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in pb-12 relative max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Consolidados</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">Historial de devoluciones.</p>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#F8F9FA] text-gray-400 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-100">Lote / Entorno</th>
                <th className="px-6 py-4 border-b border-gray-100">Nombre de Devolución</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">Usuarios</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">Total Capital</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">Total Intereses</th>
                <th className="px-6 py-4 border-b border-gray-100 text-right">Total Reliquidado</th>
                <th className="px-6 py-4 border-b border-gray-100 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {consolidados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    No hay ejecuciones registradas en el sistema.
                  </td>
                </tr>
              ) : (
                consolidados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-400 mb-1">
                        #{item.id} • {new Date(item.fechaCalculo).toLocaleDateString()}
                      </div>
                      {item.esDemo ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-amber-700 bg-amber-50 text-[10px] font-bold uppercase">
                          <Beaker className="h-3 w-3" /> Prueba
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-green-700 bg-green-50 text-[10px] font-bold uppercase">
                          <Database className="h-3 w-3" /> Prod
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900 uppercase">{item.nombreDevolucion}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-700">{item.cantidadRegistros.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-500">${(item.totalCapital || 0).toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">{item.totalIntereses > 0 ? '+' : ''}${(item.totalIntereses || 0).toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900 text-base">${item.totalDevolucion.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => abrirDetalle(item)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DESGLOSE TIPO ACORDEÓN */}
      {modalOpen && maestroSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border border-gray-200">
            
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Devolución Mensual (Por Tarifa)</h3>
                <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
                  DEVOLUCIÓN: <span className="font-bold text-gray-900">{maestroSeleccionado.nombreDevolucion}</span>
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-white p-6 space-y-4">
              {isLoadingDetalle ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">Cargando desglose...</span>
                </div>
              ) : Object.keys(datosAgrupados).length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-sm font-bold text-gray-400">No hay datos mensuales registrados.</span>
                </div>
              ) : (
                <>
                  {/* RENDERIZADO DEL ACORDEÓN */}
                  {Object.entries(datosAgrupados).map(([jobId, meses]) => {
                    const isExpanded = expandedGroups.includes(jobId);
                    
                    // Cálculo de la cabecera resumen de la tarifa
                    const mesInicial = meses[0];
                    const maxUsuarios = Math.max(...meses.map(m => m.usuarios));
                    const sumaCapital = meses.reduce((sum, m) => sum + (m.capital || 0), 0);
                    const sumaIntereses = meses.reduce((sum, m) => sum + (m.intereses || 0), 0);
                    const sumaTotal = meses.reduce((sum, m) => sum + (m.total || 0), 0);

                    return (
                      <div key={jobId} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                        {/* CABECERA DEL ACORDEÓN (CLICKABLE) */}
                        <button 
                          onClick={() => toggleGroup(jobId)} 
                          className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 w-full pr-4 items-center">
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Inicio Tarifa</p>
                              <p className="font-black text-gray-900 text-sm">{String(mesInicial.mes).padStart(2, '0')} / {mesInicial.anio}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Concepto</p>
                              <p className="font-bold text-gray-900 text-sm">{mesInicial.concepto}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Usuarios</p>
                              <p className="font-bold text-gray-700 text-sm">{maxUsuarios.toLocaleString('es-CO')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Capital Base</p>
                              <p className="font-bold text-gray-900 text-sm">${sumaCapital.toLocaleString('es-CO')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Intereses</p>
                              <p className="font-bold text-blue-600 text-sm">${sumaIntereses.toLocaleString('es-CO')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Subtotal Tarifa</p>
                              <p className="font-black text-gray-900 text-base">${sumaTotal.toLocaleString('es-CO')}</p>
                            </div>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 shrink-0 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* CUERPO DEL ACORDEÓN (TABLA DETALLE) */}
                        {isExpanded && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-[#F8F9FA] text-gray-500 font-bold uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-2 border-b border-gray-100 rounded-tl-lg">Periodo</th>
                                  <th className="px-4 py-2 border-b border-gray-100 text-right">Usuarios Activos</th>
                                  <th className="px-4 py-2 border-b border-gray-100 text-right">Aporte Capital</th>
                                  <th className="px-4 py-2 border-b border-gray-100 text-right">Intereses Mes</th>
                                  <th className="px-4 py-2 border-b border-gray-100 text-right rounded-tr-lg">Acumulado Mes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {meses.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-2 font-bold text-gray-700">{String(row.mes).padStart(2, '0')} / {row.anio}</td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-500">{row.usuarios?.toLocaleString('es-CO')}</td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-500">${(row.capital || 0).toLocaleString('es-CO')}</td>
                                    <td className="px-4 py-2 text-right font-medium text-gray-500">${(row.intereses || 0).toLocaleString('es-CO')}</td>
                                    <td className="px-4 py-2 text-right font-bold text-gray-800">${(row.total || 0).toLocaleString('es-CO')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* GRAN TOTAL DEL MODAL - ACTUALIZADO A GRIS Y CON SUMA CALCULADA */}
                  <div className="mt-6 bg-[#F8F9FA] border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
                     <span className="text-gray-900 font-black uppercase tracking-wider text-sm">Total Consolidado</span>
                     <span className="text-gray-900 font-black text-2xl mt-2 md:mt-0">${sumaTotalConsolidado.toLocaleString('es-CO')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}