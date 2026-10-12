import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResumenAsignaciones, getDetalleAsignacion, getAuditoria } from '../../../api/tarifas';

const formatearFecha = (valor: string | number[] | null | undefined) => {
  if (!valor) return '-';
  const fecha = Array.isArray(valor)
    ? new Date(valor[0], valor[1] - 1, valor[2], valor[3] || 0, valor[4] || 0, valor[5] || 0)
    : new Date(valor);
  if (isNaN(fecha.getTime())) return '-';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(fecha);
};

const periodo = (mes?: number | null, anio?: number | null) =>
  mes && anio ? `${String(mes).padStart(2, '0')} / ${anio}` : '-';

export default function TablaAuditoria() {
  const [vista, setVista] = useState<'vigentes' | 'eventos'>('vigentes');

  const { data: resumenData, isLoading: isLoadingResumen } = useQuery({
    queryKey: ['resumenAsignaciones'],
    queryFn: getResumenAsignaciones,
  });

  const { data: eventosData, isLoading: isLoadingEventos } = useQuery({
    queryKey: ['eventosAsignacion'],
    queryFn: getAuditoria,
    enabled: vista === 'eventos',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<any>(null);

  // Consulta que se dispara solo cuando el modal está abierto
  const { data: detalleData, isLoading: isLoadingDetalle } = useQuery({
    queryKey: ['detalleAsignacion', registroSeleccionado?.jobId, registroSeleccionado?.aprovechadorId],
    queryFn: () => getDetalleAsignacion(registroSeleccionado.jobId, registroSeleccionado.aprovechadorId),
    enabled: !!registroSeleccionado && modalOpen
  });

  const abrirDetalle = (registro: any) => {
    setRegistroSeleccionado(registro);
    setModalOpen(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {vista === 'vigentes' ? 'Tarifas Asignadas' : 'Bitácora de Asignaciones'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {vista === 'vigentes'
              ? 'Vínculos vigentes entre lotes tarifarios y asociaciones, con la fecha en que se asignaron.'
              : 'Cada asignación y retiro realizado: quién, cuándo, qué lote y cuántas tarifas.'}
          </p>
        </div>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-fit">
          <button onClick={() => setVista('vigentes')} className={`px-4 py-2 rounded-lg text-xs font-bold ${vista === 'vigentes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Vigentes</button>
          <button onClick={() => setVista('eventos')} className={`px-4 py-2 rounded-lg text-xs font-bold ${vista === 'eventos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Bitácora</button>
        </div>
      </div>

      {vista === 'vigentes' ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-gray-100">Periodo</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Lote / Novedad</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Asociación Vinculada</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100 text-center">Registros</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Asignado el</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoadingResumen ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">Cargando registros...</td></tr>
              ) : !resumenData || resumenData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold">No hay tarifas asignadas a ninguna asociación.</td></tr>
              ) : (
                resumenData.map((registro: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{periodo(registro.mes, registro.anio)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{registro.loteNovedad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="font-bold text-gray-900">{registro.aprovechadorNit}</span> - {registro.aprovechadorNombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-blue-600 text-center">
                      {registro.cantidadRegistros.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {formatearFecha(registro.primeraAsignacion)}
                      {registro.ultimaAsignacion && formatearFecha(registro.ultimaAsignacion) !== formatearFecha(registro.primeraAsignacion) && (
                        <div className="text-[10px] text-gray-400">Última: {formatearFecha(registro.ultimaAsignacion)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => abrirDetalle(registro)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors"
                      >
                        VER DETALLE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-gray-100">Fecha</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Acción</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Usuario</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Asociación</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Lote / Periodo</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100 text-center">Tarifas</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoadingEventos ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">Cargando bitácora...</td></tr>
              ) : !eventosData || eventosData.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-bold">Sin eventos registrados.</td></tr>
              ) : (
                eventosData.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-600">{formatearFecha(ev.fechaAsignacion)}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${ev.accion === 'RETIRAR' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{ev.accion}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-700 font-medium">{ev.usuarioEmail}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-600"><span className="font-bold text-gray-900">{ev.aprovechadorNit}</span> - {ev.aprovechadorNombre}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-600">{ev.novedad || (ev.jobId ? ev.jobId.substring(0, 8) + '...' : 'Varios')} <span className="text-gray-400 text-xs">({periodo(ev.mes, ev.anio)})</span></td>
                    <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-gray-900">{ev.cantidadTarifas}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{ev.detallesAdicionales}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CON LA ESTRUCTURA DE devol_tarifas */}
      {modalOpen && registroSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95">
            
            {/* HEADER MODAL */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detalle de Registros Asignados</h3>
                <p className="text-xs font-medium text-blue-700 mt-1 uppercase">ASOCIACIÓN: {registroSeleccionado.aprovechadorNombre}</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
            
            {/* TABLA DEL MODAL */}
            <div className="flex-1 overflow-auto bg-white p-4">
              <table className="w-full text-left border-collapse min-w-[1300px] text-xs">
                <thead>
                  <tr className="bg-[#F8F9FA] text-gray-500 uppercase tracking-wider sticky top-0 shadow-sm">
                    <th className="px-4 py-3 font-bold border-b border-gray-100">Periodo</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-center">Estrato</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100">Concepto</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Aplicado</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Ajustado</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Devolución</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-center">% Subcon</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Subcon</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Dev. Aplicar</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100">Liquidación</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100 text-center">ESP</th>
                    <th className="px-4 py-3 font-bold border-b border-gray-100">Asignado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoadingDetalle ? (
                    <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">Cargando registros...</td></tr>
                  ) : (
                    detalleData?.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{reg.mes}/{reg.anio}</td>
                        <td className="px-4 py-3 text-center text-gray-600 font-medium">{reg.estrato}</td>
                        <td className="px-4 py-3 text-gray-600 font-bold">{reg.concepto}</td>
                        <td className="px-4 py-3 text-right text-gray-500">${reg.aplicado?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-700">${reg.ajustado?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-right text-gray-500">${reg.devolucion?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-center font-mono text-gray-400">{reg.porsubcon}%</td>
                        <td className="px-4 py-3 text-right text-blue-600 font-medium">${reg.subcon?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-right font-black text-black">${reg.devolucionAplicar?.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-gray-500">{reg.liquidacion}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{reg.esp}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatearFecha(reg.fechaAsignacion)}
                          <div className="text-[10px] text-gray-400">{reg.usuarioAsignacion}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
