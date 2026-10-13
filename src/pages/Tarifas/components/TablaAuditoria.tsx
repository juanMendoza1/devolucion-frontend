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
    <div className="relative">
      <div className="card overflow-hidden">
        <div className="card-header flex-col md:flex-row md:items-center items-start">
          <div>
            <h2 className="text-base font-semibold">
              {vista === 'vigentes' ? 'Tarifas asignadas' : 'Bitácora de asignaciones'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {vista === 'vigentes'
                ? 'Vínculos vigentes entre tarifas y asociaciones, con la fecha en que se asignaron.'
                : 'Cada asignación y retiro realizado: quién, cuándo, qué tarifa y cuántos registros.'}
            </p>
          </div>
          <div className="inline-flex gap-1 rounded-xl border border-borde bg-white p-1 shrink-0">
            <button onClick={() => setVista('vigentes')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${vista === 'vigentes' ? 'bg-petroleo-700 text-white shadow-sm' : 'text-petroleo-700 hover:bg-petroleo-50'}`}>Vigentes</button>
            <button onClick={() => setVista('eventos')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${vista === 'eventos' ? 'bg-petroleo-700 text-white shadow-sm' : 'text-petroleo-700 hover:bg-petroleo-50'}`}>Bitácora</button>
          </div>
        </div>

        {vista === 'vigentes' ? (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Tarifa / novedad</th>
                  <th>Asociación vinculada</th>
                  <th className="text-right">Registros</th>
                  <th>Asignado el</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingResumen ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400"><span className="spinner mr-2" /> Cargando registros...</td></tr>
                ) : !resumenData || resumenData.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">No hay tarifas asignadas a ninguna asociación.</td></tr>
                ) : (
                  resumenData.map((registro: any, idx: number) => (
                    <tr key={idx}>
                      <td className="whitespace-nowrap font-semibold text-petroleo-900 tabular-nums">{periodo(registro.mes, registro.anio)}</td>
                      <td className="whitespace-nowrap">{registro.loteNovedad}</td>
                      <td className="whitespace-nowrap">
                        <span className="font-mono font-semibold text-petroleo-900">{registro.aprovechadorNit}</span> - {registro.aprovechadorNombre}
                      </td>
                      <td className="whitespace-nowrap text-right font-semibold text-petroleo-700 tabular-nums">
                        {registro.cantidadRegistros.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap text-xs tabular-nums">
                        {formatearFecha(registro.primeraAsignacion)}
                        {registro.ultimaAsignacion && formatearFecha(registro.ultimaAsignacion) !== formatearFecha(registro.primeraAsignacion) && (
                          <div className="text-[11px] text-slate-400">Última: {formatearFecha(registro.ultimaAsignacion)}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <button 
                          onClick={() => abrirDetalle(registro)}
                          className="btn-link"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Acción</th>
                  <th>Usuario</th>
                  <th>Asociación</th>
                  <th>Tarifa / periodo</th>
                  <th className="text-right">Tarifas</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingEventos ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400"><span className="spinner mr-2" /> Cargando bitácora...</td></tr>
                ) : !eventosData || eventosData.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">Sin eventos registrados.</td></tr>
                ) : (
                  eventosData.map((ev: any) => (
                    <tr key={ev.id}>
                      <td className="whitespace-nowrap text-xs tabular-nums">{formatearFecha(ev.fechaAsignacion)}</td>
                      <td className="whitespace-nowrap">
                        <span className={ev.accion === 'RETIRAR' ? 'badge-error' : 'badge-ok'}>{ev.accion}</span>
                      </td>
                      <td className="whitespace-nowrap font-medium">{ev.usuarioEmail}</td>
                      <td className="whitespace-nowrap"><span className="font-mono font-semibold text-petroleo-900">{ev.aprovechadorNit}</span> - {ev.aprovechadorNombre}</td>
                      <td className="whitespace-nowrap">{ev.novedad || (ev.jobId ? ev.jobId.substring(0, 8) + '...' : 'Varios')} <span className="text-slate-400 text-xs">({periodo(ev.mes, ev.anio)})</span></td>
                      <td className="whitespace-nowrap text-right font-semibold text-petroleo-900 tabular-nums">{ev.cantidadTarifas}</td>
                      <td className="text-xs text-slate-500">{ev.detallesAdicionales}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CON LA ESTRUCTURA DE devol_tarifas */}
      {modalOpen && registroSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-petroleo-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevada w-full max-w-7xl overflow-hidden flex flex-col h-[85vh]">
            
            {/* HEADER MODAL */}
            <div className="card-header bg-petroleo-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold">Detalle de registros asignados</h3>
                <p className="text-xs font-semibold text-petroleo-600 mt-1 uppercase">Asociación: {registroSeleccionado.aprovechadorNombre}</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="btn-secondary btn-sm"
              >
                Cerrar
              </button>
            </div>
            
            {/* TABLA DEL MODAL */}
            <div className="flex-1 overflow-auto bg-white">
              <table className="table-base text-xs min-w-[1300px]">
                <thead className="sticky top-0">
                  <tr>
                    <th>Periodo</th>
                    <th className="text-center">Estrato</th>
                    <th>Concepto</th>
                    <th className="text-right">Aplicado</th>
                    <th className="text-right">Ajustado</th>
                    <th className="text-right">Devolución</th>
                    <th className="text-right">% Subcon</th>
                    <th className="text-right">Subcon</th>
                    <th className="text-right">Dev. aplicar</th>
                    <th>Liquidación</th>
                    <th className="text-center">ESP</th>
                    <th>Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingDetalle ? (
                    <tr><td colSpan={12} className="py-12 text-center text-slate-400 text-sm"><span className="spinner mr-2" /> Cargando registros...</td></tr>
                  ) : (
                    detalleData?.map((reg: any) => (
                      <tr key={reg.id}>
                        <td className="font-semibold text-petroleo-900 tabular-nums whitespace-nowrap">{reg.mes}/{reg.anio}</td>
                        <td className="text-center tabular-nums">{reg.estrato}</td>
                        <td className="font-semibold text-slate-600">{reg.concepto}</td>
                        <td className="text-right tabular-nums whitespace-nowrap text-slate-500">${reg.aplicado?.toLocaleString('es-CO')}</td>
                        <td className="text-right tabular-nums whitespace-nowrap font-semibold">${reg.ajustado?.toLocaleString('es-CO')}</td>
                        <td className="text-right tabular-nums whitespace-nowrap text-slate-500">${reg.devolucion?.toLocaleString('es-CO')}</td>
                        <td className="text-right tabular-nums whitespace-nowrap font-mono text-slate-400">{reg.porsubcon}%</td>
                        <td className="text-right tabular-nums whitespace-nowrap text-petroleo-600">${reg.subcon?.toLocaleString('es-CO')}</td>
                        <td className="text-right tabular-nums whitespace-nowrap font-bold text-petroleo-900">${reg.devolucionAplicar?.toLocaleString('es-CO')}</td>
                        <td className="text-slate-500">{reg.liquidacion}</td>
                        <td className="text-center text-slate-500">{reg.esp}</td>
                        <td className="text-slate-500 whitespace-nowrap tabular-nums">
                          {formatearFecha(reg.fechaAsignacion)}
                          <div className="text-[11px] text-slate-400">{reg.usuarioAsignacion}</div>
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
