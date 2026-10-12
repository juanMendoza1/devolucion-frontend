import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, Loader2, Filter, Eye, X, CalendarDays, CheckCircle2 } from 'lucide-react';
import { getFacturas, getHistorialCodigo, getPeriodosFacturas } from '../api/facturas';
import { useDebounce } from '../hooks/useDebounce'; 

export default function VisorFacturas() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [filtroFactura, setFiltroFactura] = useState('');
  const [filtroDataease, setFiltroDataease] = useState('');
  
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>(''); 

  const [modalOpen, setModalOpen] = useState(false);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string | null>(null);
  const [devolucionActiva, setDevolucionActiva] = useState<string | null>(null);
  const [tarifaActiva, setTarifaActiva] = useState<string | null>(null);

  const debouncedFactura = useDebounce(filtroFactura, 500);
  const debouncedDataease = useDebounce(filtroDataease, 500);

  const mesSeleccionado = filtroPeriodo ? parseInt(filtroPeriodo.split('-')[0]) : undefined;
  const anioSeleccionado = filtroPeriodo ? parseInt(filtroPeriodo.split('-')[1]) : undefined;

  const { data: periodosData } = useQuery({
    queryKey: ['periodos-facturas'],
    queryFn: getPeriodosFacturas,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['facturas', page, size, debouncedFactura, debouncedDataease, filtroPeriodo],
    queryFn: () => getFacturas(page, size, { 
      factura: debouncedFactura, 
      codigoDataease: debouncedDataease,
      mes: mesSeleccionado,
      anio: anioSeleccionado
    }),
    placeholderData: (previousData) => previousData, 
  });

  const { data: historialData, isLoading: isLoadingHistorial } = useQuery({
    queryKey: ['historial', codigoSeleccionado],
    queryFn: () => getHistorialCodigo(codigoSeleccionado!),
    enabled: !!codigoSeleccionado && modalOpen,
  });

  useEffect(() => {
    if (historialData?.length > 0) {
      const devolucionesUnicas = Array.from(new Set(historialData.map((item: any) => item.nombreDevolucion)));
      if (!devolucionActiva || !devolucionesUnicas.includes(devolucionActiva)) {
        setDevolucionActiva(devolucionesUnicas[0] as string);
        setTarifaActiva(null);
      }
    }
  }, [historialData]);

  const abrirKardex = (codigo: string) => {
    setCodigoSeleccionado(codigo);
    setDevolucionActiva(null);
    setTarifaActiva(null);
    setModalOpen(true);
  };

  const cerrarKardex = () => {
    setModalOpen(false);
    setTimeout(() => {
      setCodigoSeleccionado(null);
      setDevolucionActiva(null);
      setTarifaActiva(null);
    }, 200); 
  };

  const devolucionesUnicas = Array.from(new Set(historialData?.map((item: any) => item.nombreDevolucion) || []));
  const datosDevolucion = historialData?.filter((item: any) => item.nombreDevolucion === devolucionActiva) || [];
  const tarifasUnicas = Array.from(new Set(datosDevolucion.map((item: any) => item.nombreTarifa)));
  
  const datosTabla = tarifaActiva ? datosDevolucion.filter((item: any) => item.nombreTarifa === tarifaActiva) : datosDevolucion;

  const totalHistorico = historialData?.reduce((sum: number, item: any) => sum + (item.totalDevolucion || 0), 0) || 0;
  const totalDevolucionActiva = datosDevolucion.reduce((sum: number, item: any) => sum + (item.totalDevolucion || 0), 0);
  const subtotalTabla = datosTabla.reduce((sum: number, item: any) => sum + (item.totalDevolucion || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visor de Facturas</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Consulta y filtra el histórico de facturación importada en el sistema.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col min-h-[600px]">
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="md:w-1/4 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CalendarDays className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <select
              value={filtroPeriodo}
              onChange={(e) => { setFiltroPeriodo(e.target.value); setPage(0); }}
              className="block w-full pl-11 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:bg-white focus:border-gray-900 outline-none transition-all duration-300 appearance-none font-bold"
            >
              <option value="">Todos los periodos</option>
              {periodosData?.map((p: any) => (
                <option key={`${p.mes}-${p.anio}`} value={`${p.mes}-${p.anio}`}>
                  {String(p.mes).padStart(2, '0')} / {p.anio}
                </option>
              ))}
            </select>
          </div>

          <div className="md:w-1/3 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar No. Factura..."
              value={filtroFactura}
              onChange={(e) => { setFiltroFactura(e.target.value); setPage(0); }}
              className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 outline-none transition-all duration-300"
            />
          </div>

          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar por Código Dataease..."
              value={filtroDataease}
              onChange={(e) => { setFiltroDataease(e.target.value); setPage(0); }}
              className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 outline-none transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="px-5 py-4 font-bold border-b border-gray-100">Dataease</th>
                <th className="px-5 py-4 font-bold border-b border-gray-100">Periodo</th>
                <th className="px-5 py-4 font-bold border-b border-gray-100">Perfil Inmueble</th>
                <th className="px-5 py-4 font-bold border-b border-gray-100 text-center">Habitado</th>
                <th className="px-5 py-4 font-bold border-b border-gray-100 text-center">DCTOPAP</th>
                <th className="px-5 py-4 font-bold border-b border-gray-100 text-right">Estado Financiero</th>
                <th className="px-5 py-4 font-bold border-b border-gray-100 text-center">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-3" /><p className="text-sm font-medium text-gray-400">Cargando registros...</p></td></tr>
              ) : isError ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-red-500">Error al cargar los datos.</td></tr>
              ) : data?.content?.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center"><p className="text-sm font-bold text-gray-900">No se encontraron facturas</p></td></tr>
              ) : (
                data?.content?.map((factura: any) => {
                  
                  const estaDesocupado = factura.desocupa === true;
                  const tieneDescuento = factura.desctoPap === true || factura.descto_pap === true;
                  const estaPagada = factura.pagada === true;

                  return (
                    <tr key={factura.id} className="hover:bg-gray-50/50 transition-colors group">
                      
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900 font-mono">{factura.codigoDataease}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Factura: {factura.factura}</p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md border border-gray-200">
                          {String(factura.mes).padStart(2,'0')}/{factura.ano}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs font-bold text-gray-700 uppercase">{factura.uso === 'R' ? 'Residencial' : 'Comercial'}</p>
                        <p className="text-[10px] text-gray-500">Estrato {factura.estrato}</p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {estaDesocupado ? (
                          <span className="text-[10px] font-bold text-gray-400 uppercase">NO</span>
                        ) : (
                          <span className="text-[10px] font-bold text-green-600 uppercase">SI</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {tieneDescuento ? (
                          <span className="text-[10px] font-bold text-blue-600 uppercase">SI</span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase">NO</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <p className="text-sm font-bold text-gray-900">${factura.vlrFactu?.toLocaleString('es-CO')}</p>
                        {estaPagada ? (
                          <p className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1 uppercase">
                            <CheckCircle2 className="h-3 w-3" /> Pagado (${factura.vlrPagado?.toLocaleString('es-CO')})
                          </p>
                        ) : (
                          <p className="text-[10px] text-red-500 font-bold uppercase">Pendiente de Pago</p>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => abrirKardex(factura.codigoDataease)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-black rounded-lg transition-colors inline-flex items-center justify-center shadow-sm"
                          title="Ver historial de devoluciones"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 0 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6">
            <p className="text-sm text-gray-400 font-medium">
              Mostrando <span className="font-bold text-gray-900">{(page * size) + 1}</span> a <span className="font-bold text-gray-900">{Math.min((page + 1) * size, data.totalElements)}</span> de <span className="font-bold text-gray-900">{data.totalElements}</span> registros
            </p>
            <div className="flex space-x-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 transition-all shadow-sm"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage((p) => (!data.last ? p + 1 : p))} disabled={data?.last} className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 transition-all shadow-sm"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL KARDEX AMPLIADO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95">
            
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Estado de Cuenta Histórico</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">CÓDIGO: {codigoSeleccionado}</p>
              </div>
              <button onClick={cerrarKardex} className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-xl transition-all"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {isLoadingHistorial ? (
                <div className="w-full flex flex-col items-center justify-center text-gray-400 space-y-3"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /><p className="text-sm font-bold">Consultando historial...</p></div>
              ) : historialData?.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center text-center space-y-2"><p className="text-base font-bold text-gray-900">Sin Devoluciones Registradas</p><p className="text-sm text-gray-500">Este código no tiene reliquidaciones en el sistema.</p></div>
              ) : (
                <>
                  <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 flex flex-col">
                    <div className="p-4 border-b border-gray-100 shrink-0">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Devoluciones Aplicadas</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {devolucionesUnicas.map((dev: any) => (
                        <button
                          key={dev}
                          onClick={() => { setDevolucionActiva(dev); setTarifaActiva(null); }}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${devolucionActiva === dev ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                        >
                          <p className="font-bold leading-tight uppercase text-xs">{dev}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-2/3 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-gray-900 uppercase">{devolucionActiva}</h3>
                        {tarifasUnicas.length > 1 && (
                          <select className="mt-1.5 text-xs bg-gray-50 border border-gray-200 rounded p-1.5 font-bold text-gray-700 outline-none w-max max-w-[250px]" value={tarifaActiva || ''} onChange={(e) => setTarifaActiva(e.target.value || null)}>
                            <option value="">Todas las tarifas del grupo</option>
                            {tarifasUnicas.map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
                          </select>
                        )}
                        <p className="text-[11px] text-gray-500 font-bold mt-1.5">{datosTabla.length} periodos {tarifaActiva ? 'en esta tarifa' : 'liquidados'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tarifaActiva ? 'Subtotal Tarifa' : 'Total Grupo'}</p>
                        <p className="text-base font-black text-black">${subtotalTabla.toLocaleString('es-CO')}</p>
                        {tarifaActiva && <p className="text-[9px] text-gray-400 mt-0.5">Grupo: ${totalDevolucionActiva.toLocaleString('es-CO')}</p>}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white text-gray-400 text-[11px] uppercase tracking-wider border-b-2 border-black">
                            <th className="px-4 py-3 font-bold">Tarifa Origen</th>
                            <th className="px-4 py-3 font-bold">Periodo</th>
                            <th className="px-4 py-3 font-bold">Concepto</th>
                            <th className="px-4 py-3 font-bold text-right">Capital Base</th>
                            <th className="px-4 py-3 font-bold text-right">Intereses</th>
                            <th className="px-4 py-3 font-bold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {datosTabla.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-xs font-bold text-gray-900 bg-gray-50/50 border-r border-gray-100">{item.nombreTarifa}</td>
                              <td className="px-4 py-3 text-sm font-bold text-gray-900">{String(item.mesBase).padStart(2,'0')}/{item.anioBase}</td>
                              <td className="px-4 py-3 text-xs font-bold text-gray-600">{item.concepto}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-500 text-right">${item.capitalReliquidado?.toLocaleString('es-CO')}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-500 text-right">+${item.interesesCalculados?.toLocaleString('es-CO')}</td>
                              <td className="px-4 py-3 text-sm font-bold text-black text-right">${item.totalDevolucion?.toLocaleString('es-CO')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isLoadingHistorial && historialData?.length > 0 && (
              <div className="bg-black p-4 shrink-0 flex justify-between items-center text-white">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gran Total Histórico</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{historialData.length} registros totales en todas las devoluciones</p>
                </div>
                <p className="text-2xl font-black text-white">${totalHistorico.toLocaleString('es-CO')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}