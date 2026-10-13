import { useState, useEffect, useMemo } from 'react';
import { reliquidacionApi } from '../../api/reliquidacion';
import type { DevolucionMaestro, DesgloseMes } from '../../types/reliquidacion';
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

  // Lógica de agrupación para el Acordeón
  const datosAgrupados = useMemo(() => {
    return detalleMensual.reduce((acc, curr) => {
      if (!acc[curr.jobId]) acc[curr.jobId] = [];
      acc[curr.jobId].push(curr);
      return acc;
    }, {} as Record<string, DesgloseMes[]>);
  }, [detalleMensual]);

  // Calculamos la suma total exacta de lo que hay en pantalla
  const sumaTotalConsolidado = useMemo(() => {
    return detalleMensual.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [detalleMensual]);

  const encabezado = (
    <div className="page-header">
      <div>
        <p className="page-kicker">Cálculo</p>
        <h1 className="page-title">Consolidados</h1>
        <p className="page-subtitle">Historial de devoluciones calculadas, con su desglose mensual por tarifa.</p>
      </div>
      {consolidados.length > 0 && (
        <div className="kpi min-w-36">
          <p className="kpi-label">Ejecuciones</p>
          <p className="kpi-value">{consolidados.length}</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl">
        {encabezado}
        <div className="card card-body py-16 text-center text-slate-400 text-sm">
          <span className="spinner mr-2" /> Cargando consolidados...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl pb-12 relative">
      {encabezado}

      {/* TABLA PRINCIPAL */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base whitespace-nowrap">
            <thead>
              <tr>
                <th>Tarifa / entorno</th>
                <th>Nombre de devolución</th>
                <th className="text-right">Usuarios</th>
                <th className="text-right">Total capital</th>
                <th className="text-right">Total intereses</th>
                <th className="text-right">Total reliquidado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {consolidados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center whitespace-normal">
                    <p className="text-sm font-semibold text-petroleo-900">No hay ejecuciones registradas</p>
                    <p className="text-sm text-slate-400 mt-1">Las devoluciones calculadas en el módulo de reliquidación aparecerán aquí.</p>
                  </td>
                </tr>
              ) : (
                consolidados.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-mono text-xs text-slate-400 mb-1">
                        #{item.id} · {new Date(item.fechaCalculo).toLocaleDateString()}
                      </div>
                      {item.esDemo ? (
                        <span className="badge-warn">Prueba</span>
                      ) : (
                        <span className="badge-ok">Producción</span>
                      )}
                    </td>
                    <td className="font-bold text-petroleo-900 uppercase">{item.nombreDevolucion}</td>
                    <td className="text-right tabular-nums font-semibold">{item.cantidadRegistros.toLocaleString('es-CO')}</td>
                    <td className="text-right tabular-nums text-slate-500">${(item.totalCapital || 0).toLocaleString('es-CO')}</td>
                    <td className="text-right tabular-nums text-petroleo-600">{item.totalIntereses > 0 ? '+' : ''}${(item.totalIntereses || 0).toLocaleString('es-CO')}</td>
                    <td className="text-right tabular-nums font-bold text-petroleo-900 text-base">${item.totalDevolucion.toLocaleString('es-CO')}</td>
                    <td className="text-right">
                      <button onClick={() => abrirDetalle(item)} className="btn-link">
                        Ver detalle
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-petroleo-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevada w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh] border border-borde">
            
            <div className="card-header bg-petroleo-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold">Devolución mensual por tarifa</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">
                  Devolución: <span className="font-semibold text-petroleo-900">{maestroSeleccionado.nombreDevolucion}</span>
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn-secondary btn-sm">
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-white p-6 space-y-4">
              {isLoadingDetalle ? (
                <div className="flex justify-center items-center h-40 text-sm text-slate-400">
                  <span className="spinner mr-2" /> Cargando desglose...
                </div>
              ) : Object.keys(datosAgrupados).length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <span className="text-sm text-slate-400">No hay datos mensuales registrados.</span>
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
                      <div key={jobId} className="border border-borde rounded-xl overflow-hidden bg-white shadow-suave">
                        {/* CABECERA DEL ACORDEÓN (CLICKABLE) */}
                        <button 
                          onClick={() => toggleGroup(jobId)} 
                          className={`w-full flex items-center justify-between gap-4 px-5 py-4 transition-colors text-left cursor-pointer ${isExpanded ? 'bg-petroleo-50' : 'bg-white hover:bg-petroleo-50/60'}`}
                        >
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 w-full items-center">
                            <div>
                              <p className="kpi-label text-[10px] mb-0.5">Inicio tarifa</p>
                              <p className="font-bold text-petroleo-900 text-sm tabular-nums">{String(mesInicial.mes).padStart(2, '0')} / {mesInicial.anio}</p>
                            </div>
                            <div>
                              <p className="kpi-label text-[10px] mb-0.5">Concepto</p>
                              <p className="font-semibold text-petroleo-900 text-sm">{mesInicial.concepto}</p>
                            </div>
                            <div className="text-right">
                              <p className="kpi-label text-[10px] mb-0.5">Usuarios</p>
                              <p className="font-semibold text-slate-700 text-sm tabular-nums">{maxUsuarios.toLocaleString('es-CO')}</p>
                            </div>
                            <div className="text-right">
                              <p className="kpi-label text-[10px] mb-0.5">Capital base</p>
                              <p className="font-semibold text-petroleo-900 text-sm tabular-nums">${sumaCapital.toLocaleString('es-CO')}</p>
                            </div>
                            <div className="text-right">
                              <p className="kpi-label text-[10px] mb-0.5">Intereses</p>
                              <p className="font-semibold text-petroleo-600 text-sm tabular-nums">${sumaIntereses.toLocaleString('es-CO')}</p>
                            </div>
                            <div className="text-right">
                              <p className="kpi-label text-[10px] mb-0.5">Subtotal tarifa</p>
                              <p className="font-bold text-petroleo-900 text-base tabular-nums">${sumaTotal.toLocaleString('es-CO')}</p>
                            </div>
                          </div>
                          <span className="shrink-0 w-16 text-right text-xs font-semibold text-petroleo-600">{isExpanded ? 'Ocultar' : 'Mostrar'}</span>
                        </button>

                        {/* CUERPO DEL ACORDEÓN (TABLA DETALLE) */}
                        {isExpanded && (
                          <div className="border-t border-borde overflow-x-auto">
                            <table className="table-base text-xs">
                              <thead>
                                <tr>
                                  <th>Periodo</th>
                                  <th className="text-right">Usuarios activos</th>
                                  <th className="text-right">Aporte capital</th>
                                  <th className="text-right">Intereses mes</th>
                                  <th className="text-right">Acumulado mes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {meses.map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="font-semibold tabular-nums">{String(row.mes).padStart(2, '0')} / {row.anio}</td>
                                    <td className="text-right tabular-nums text-slate-500">{row.usuarios?.toLocaleString('es-CO')}</td>
                                    <td className="text-right tabular-nums text-slate-500">${(row.capital || 0).toLocaleString('es-CO')}</td>
                                    <td className="text-right tabular-nums text-slate-500">${(row.intereses || 0).toLocaleString('es-CO')}</td>
                                    <td className="text-right tabular-nums font-semibold text-petroleo-900">${(row.total || 0).toLocaleString('es-CO')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* GRAN TOTAL DEL MODAL */}
                  <div className="mt-6 bg-petroleo-900 rounded-xl px-6 py-5 flex flex-col md:flex-row items-center justify-between text-white">
                     <span className="text-verde-300 font-semibold uppercase tracking-widest text-xs">Total consolidado</span>
                     <span className="font-bold text-2xl mt-2 md:mt-0 tabular-nums">${sumaTotalConsolidado.toLocaleString('es-CO')}</span>
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
