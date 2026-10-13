import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFacturas, getHistorialCodigo, getPeriodosFacturas } from '../api/facturas';
import { useDebounce } from '../hooks/useDebounce'; 

// ---------- Formatos (sin redondear: se muestran todos los decimales que trae el cálculo) ----------
const num = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v));
const fmtValor = (v: any) => {
  const n = num(v);
  if (n === null || isNaN(n)) return '-';
  const texto = Math.abs(n).toLocaleString('es-CO', { maximumFractionDigits: 10 });
  return n < 0 ? `-$${texto}` : `$${texto}`;
};
const fmtTasa = (v: any) => {
  const n = num(v);
  return n === null || isNaN(n) ? '-' : `${(n * 100).toLocaleString('es-CO', { maximumFractionDigits: 8 })} %`;
};
const periodo = (mes: number, anio: number) => `${String(mes).padStart(2, '0')}/${anio}`;

interface FilaHistorial {
  maestroId: number;
  nombreDevolucion: string;
  fechaCalculo: string;
  nombreTarifa: string;
  jobId: string;
  concepto: string;
  tipoInteres: string;
  mes: number;
  anio: number;
  desocupadoMesBase: boolean | null;
  factura: string;
  tasa: string;
  valorBaseTarifa: number;
  capital: number;
  intereses: number;
  total: number;
  pagada: boolean | null;
}

interface TarifaAplicada {
  jobId: string;
  nombreTarifa: string;
  concepto: string;
  tipoInteres: string;
  deshabitado: boolean;
  inicioInteres: string | null;
  capital: number;
  intereses: number;
  total: number;
  meses: (FilaHistorial & { acumulado: number })[];
}

interface DevolucionAplicada {
  maestroId: number;
  nombre: string;
  fecha: string;
  total: number;
  tarifas: TarifaAplicada[];
}

/** Agrupa las filas mes a mes en devolución -> tarifa, con el acumulado y el mes en que inició el interés. */
function agrupar(filas: FilaHistorial[]): DevolucionAplicada[] {
  const devoluciones = new Map<number, DevolucionAplicada>();
  for (const f of filas) {
    let dev = devoluciones.get(f.maestroId);
    if (!dev) {
      dev = { maestroId: f.maestroId, nombre: f.nombreDevolucion, fecha: f.fechaCalculo, total: 0, tarifas: [] };
      devoluciones.set(f.maestroId, dev);
    }
    let tar = dev.tarifas.find((t) => t.jobId === f.jobId);
    if (!tar) {
      tar = {
        jobId: f.jobId, nombreTarifa: f.nombreTarifa, concepto: f.concepto, tipoInteres: f.tipoInteres,
        deshabitado: !!f.desocupadoMesBase, inicioInteres: null, capital: 0, intereses: 0, total: 0, meses: [],
      };
      dev.tarifas.push(tar);
    }
    const capital = Number(f.capital || 0);
    const intereses = Number(f.intereses || 0);
    tar.capital += capital;
    tar.intereses += intereses;
    tar.total += capital + intereses;
    if (!tar.inicioInteres && f.pagada === true && !tar.deshabitado) tar.inicioInteres = periodo(f.mes, f.anio);
    tar.meses.push({ ...f, acumulado: tar.total });
    dev.total += capital + intereses;
  }
  return [...devoluciones.values()];
}

export default function VisorFacturas() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [filtroFactura, setFiltroFactura] = useState('');
  const [filtroDataease, setFiltroDataease] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>(''); 

  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string | null>(null);
  const [devolucionElegida, setDevolucionElegida] = useState<number | null>(null);

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

  const { data: historialData, isLoading: isLoadingHistorial } = useQuery<FilaHistorial[]>({
    queryKey: ['historial', codigoSeleccionado],
    queryFn: () => getHistorialCodigo(codigoSeleccionado!),
    enabled: !!codigoSeleccionado,
  });

  const devoluciones = useMemo(() => agrupar(historialData || []), [historialData]);
  const devolucionActiva = devoluciones.find((d) => d.maestroId === devolucionElegida) || devoluciones[0];
  const totalGeneral = devoluciones.reduce((s, d) => s + d.total, 0);

  const abrirDevoluciones = (codigo: string) => {
    setDevolucionElegida(null);
    setCodigoSeleccionado(codigo);
  };

  const cerrar = () => {
    setCodigoSeleccionado(null);
    setDevolucionElegida(null);
  };

  return (
    <div className="max-w-7xl relative">
      <div className="page-header">
        <div>
          <p className="page-kicker">Datos</p>
          <h1 className="page-title">Visor de facturas</h1>
          <p className="page-subtitle">
            Consulte la facturación importada y las devoluciones aplicadas a cada usuario.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-body pb-5 border-b border-borde grid grid-cols-1 md:grid-cols-[14rem_1fr_1fr] gap-4">
          <div>
            <label className="label" htmlFor="filtro-periodo">Periodo</label>
            <select
              id="filtro-periodo"
              value={filtroPeriodo}
              onChange={(e) => { setFiltroPeriodo(e.target.value); setPage(0); }}
              className="input h-11 cursor-pointer"
            >
              <option value="">Todos los periodos</option>
              {periodosData?.map((p: any) => (
                <option key={`${p.mes}-${p.anio}`} value={`${p.mes}-${p.anio}`}>
                  {String(p.mes).padStart(2, '0')} / {p.anio}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="filtro-factura">No. factura</label>
            <input
              id="filtro-factura"
              type="text"
              placeholder="Buscar número de factura"
              value={filtroFactura}
              onChange={(e) => { setFiltroFactura(e.target.value); setPage(0); }}
              className="input h-11"
            />
          </div>

          <div>
            <label className="label" htmlFor="filtro-dataease">Código Dataease</label>
            <input
              id="filtro-dataease"
              type="text"
              placeholder="Buscar por código Dataease"
              value={filtroDataease}
              onChange={(e) => { setFiltroDataease(e.target.value); setPage(0); }}
              className="input h-11"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Dataease</th>
                <th>Periodo</th>
                <th>Perfil inmueble</th>
                <th className="text-center">Habitado</th>
                <th className="text-center">Dcto. PAP</th>
                <th className="text-right">Estado financiero</th>
                <th className="text-right">Devoluciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400"><span className="spinner mr-2" /> Cargando registros...</td></tr>
              ) : isError ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm font-medium text-red-600">Error al cargar los datos.</td></tr>
              ) : data?.content?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="text-sm font-semibold text-petroleo-900">No se encontraron facturas</p>
                    <p className="text-sm text-slate-400 mt-1">Ajuste los filtros o importe facturas desde el módulo de importaciones.</p>
                  </td>
                </tr>
              ) : (
                data?.content?.map((factura: any) => {
                  const estaDesocupado = factura.desocupa === true;
                  const tieneDescuento = factura.desctoPap === true || factura.descto_pap === true;
                  const estaPagada = factura.pagada === true;

                  return (
                    <tr key={factura.id}>
                      <td className="whitespace-nowrap">
                        <p className="font-semibold text-petroleo-900 font-mono">{factura.codigoDataease}</p>
                        <p className="text-[11px] text-slate-400">Factura: {factura.factura}</p>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="badge-info tabular-nums">{periodo(factura.mes, factura.ano)}</span>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-700 uppercase">{factura.uso === 'R' ? 'Residencial' : 'Comercial'}</p>
                        <p className="text-[11px] text-slate-500">Estrato {factura.estrato}</p>
                      </td>
                      <td className="whitespace-nowrap text-center">
                        {estaDesocupado ? <span className="badge-off">NO</span> : <span className="badge-ok">SÍ</span>}
                      </td>
                      <td className="whitespace-nowrap text-center">
                        {tieneDescuento ? <span className="badge-info">SÍ</span> : <span className="badge-off">NO</span>}
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        <p className="font-semibold text-petroleo-900">${factura.vlrFactu?.toLocaleString('es-CO')}</p>
                        {estaPagada ? (
                          <p className="text-[11px] text-verde-700 font-semibold">Pagado (${factura.vlrPagado?.toLocaleString('es-CO')})</p>
                        ) : (
                          <p className="text-[11px] text-red-600 font-semibold">Pendiente de pago</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <button onClick={() => abrirDevoluciones(factura.codigoDataease)} className="btn-link">
                          Ver devoluciones
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
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-borde">
            <p className="text-sm text-slate-500 tabular-nums">
              Mostrando <span className="font-semibold text-petroleo-900">{(page * size) + 1}</span> a <span className="font-semibold text-petroleo-900">{Math.min((page + 1) * size, data.totalElements)}</span> de <span className="font-semibold text-petroleo-900">{data.totalElements}</span> registros
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary btn-sm">Anterior</button>
              <button onClick={() => setPage((p) => (!data.last ? p + 1 : p))} disabled={data?.last} className="btn-secondary btn-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* DEVOLUCIONES APLICADAS AL USUARIO */}
      {codigoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-petroleo-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevada w-full max-w-6xl overflow-hidden flex flex-col h-[88vh]">

            <div className="card-header bg-petroleo-50 shrink-0">
              <div>
                <p className="page-kicker">Devoluciones aplicadas</p>
                <h2 className="text-lg font-bold">Usuario {codigoSeleccionado}</h2>
                {devoluciones.length > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {devoluciones.length} devolución(es) · Total devuelto <span className="font-semibold text-petroleo-900 tabular-nums">{fmtValor(totalGeneral)}</span>
                  </p>
                )}
              </div>
              <button onClick={cerrar} className="btn-secondary btn-sm">Cerrar</button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {isLoadingHistorial ? (
                <div className="w-full flex items-center justify-center text-slate-400 text-sm"><span className="spinner mr-2" /> Consultando devoluciones...</div>
              ) : devoluciones.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center text-center space-y-1">
                  <p className="text-base font-semibold text-petroleo-900">Sin devoluciones aplicadas</p>
                  <p className="text-sm text-slate-500">Este usuario no fue incluido en ninguna devolución.</p>
                </div>
              ) : (
                <>
                  {/* Lista de devoluciones */}
                  <div className="w-72 shrink-0 border-r border-borde bg-fondo overflow-y-auto p-4 space-y-2">
                    {devoluciones.map((d) => {
                      const activa = devolucionActiva?.maestroId === d.maestroId;
                      return (
                        <button
                          key={d.maestroId}
                          onClick={() => setDevolucionElegida(d.maestroId)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors cursor-pointer ${activa ? 'bg-petroleo-700 text-white border-petroleo-700 shadow-suave' : 'bg-white text-petroleo-900 border-borde hover:border-petroleo-200 hover:bg-petroleo-50'}`}
                        >
                          <p className="text-xs font-semibold uppercase leading-tight">{d.nombre}</p>
                          <p className={`text-[11px] mt-1 ${activa ? 'text-petroleo-100' : 'text-slate-400'}`}>
                            {d.tarifas.length} tarifa(s) · {d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO') : ''}
                          </p>
                          <p className={`text-sm font-bold mt-1 tabular-nums ${activa ? 'text-white' : 'text-petroleo-900'}`}>{fmtValor(d.total)}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detalle de la devolución activa */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {devolucionActiva?.tarifas.map((t) => (
                      <section key={t.jobId} className="card overflow-hidden">
                        <div className="card-header flex-wrap">
                          <div>
                            <h3 className="text-sm font-bold">{t.nombreTarifa}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Concepto {t.concepto} · Interés {t.tipoInteres?.toLowerCase()}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={t.deshabitado ? 'badge-off' : 'badge-ok'}>
                              Mes inicial: {t.deshabitado ? 'deshabitado (no aplica)' : 'habitado'}
                            </span>
                            {!t.deshabitado && (
                              <span className={t.inicioInteres ? 'badge-info' : 'badge-warn'}>
                                {t.inicioInteres ? `Interés desde ${t.inicioInteres}` : 'Sin recaudo: sin interés'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Resumen de la tarifa */}
                        <div className="grid grid-cols-3 divide-x divide-borde border-b border-borde">
                          <div className="px-5 py-3">
                            <p className="kpi-label">Capital (una vez)</p>
                            <p className="mt-1 font-semibold text-petroleo-900 tabular-nums">{fmtValor(t.capital)}</p>
                          </div>
                          <div className="px-5 py-3">
                            <p className="kpi-label">Intereses</p>
                            <p className="mt-1 font-semibold text-petroleo-900 tabular-nums">{fmtValor(t.intereses)}</p>
                          </div>
                          <div className="px-5 py-3 bg-verde-50">
                            <p className="kpi-label text-verde-800">Total devolución</p>
                            <p className="mt-1 font-bold text-petroleo-900 tabular-nums">{fmtValor(t.total)}</p>
                          </div>
                        </div>

                        {/* Mes a mes */}
                        <div className="overflow-x-auto">
                          <table className="table-base whitespace-nowrap">
                            <thead>
                              <tr>
                                <th>Periodo</th>
                                <th>Factura</th>
                                <th>Recaudo</th>
                                <th className="text-right">Tasa</th>
                                <th className="text-right">Capital</th>
                                <th className="text-right">Interés</th>
                                <th className="text-right">Acumulado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.meses.map((m, i) => (
                                <tr key={`${m.anio}-${m.mes}`}>
                                  <td className="font-semibold tabular-nums">
                                    {periodo(m.mes, m.anio)}
                                    {i === 0 && <span className="badge-info ml-2">Inicial</span>}
                                  </td>
                                  <td className="font-mono text-xs">{m.factura}</td>
                                  <td>
                                    {m.pagada === true ? <span className="badge-ok">Pagada</span>
                                      : m.pagada === false ? <span className="badge-warn">Sin pago</span>
                                      : <span className="badge-off">No facturó</span>}
                                  </td>
                                  <td className="text-right tabular-nums text-slate-500">{fmtTasa(m.tasa)}</td>
                                  <td className="text-right tabular-nums">{Number(m.capital) !== 0 ? fmtValor(m.capital) : '-'}</td>
                                  <td className="text-right tabular-nums">{Number(m.intereses) !== 0 ? fmtValor(m.intereses) : '-'}</td>
                                  <td className="text-right tabular-nums font-semibold text-petroleo-900">{fmtValor(m.acumulado)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))}
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
