import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { descargarConsolidadoMes, getConsolidadoMes, type ModoConsolidado } from '../../api/reportes';

const fmtValor = (v: number | null | undefined) => {
  if (v === null || v === undefined || Number(v) === 0) return '';
  const n = Number(v);
  const texto = Math.abs(n).toLocaleString('es-CO', { maximumFractionDigits: 10 });
  return n < 0 ? `-$${texto}` : `$${texto}`;
};
const fmtTasa = (v: number | null) =>
  v === null || v === undefined ? '' : `${(Number(v) * 100).toLocaleString('es-CO', { maximumFractionDigits: 8 })} %`;
const periodo = (mes: number, anio: number) => `${String(mes).padStart(2, '0')}/${anio}`;

/** Reporte Consolidado mes: capital, tasa, interés y acumulado por mes de facturación. */
export default function ReporteConsolidadoMes({ devoluciones, cargando }: { devoluciones: any[]; cargando: boolean }) {
  const [maestroId, setMaestroId] = useState<number | null>(null);
  const [modo, setModo] = useState<ModoConsolidado>('CONSOLIDADO');

  const { data: tablas, isFetching, isError } = useQuery({
    queryKey: ['consolidado-mes', maestroId, modo],
    queryFn: () => getConsolidadoMes(maestroId!, modo),
    enabled: maestroId !== null,
  });

  const descarga = useMutation({
    mutationFn: () => descargarConsolidadoMes(maestroId!, modo),
    onSuccess: (nombre) => toast.success(`Reporte descargado: ${nombre}`),
    onError: () => toast.error('No se pudo generar el reporte.'),
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="text-base font-semibold">Consolidado mes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Por mes de facturación: capital (mes inicial de cada tarifa), tasa, interés liquidado (solo usuarios que pagaron) y acumulado.
          </p>
        </div>
      </div>

      <div className="card-body space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-64 max-w-lg">
            <label className="label" htmlFor="devolucion-consolidado">Devolución</label>
            <select
              id="devolucion-consolidado"
              className="input cursor-pointer"
              value={maestroId ?? ''}
              onChange={(e) => setMaestroId(e.target.value ? Number(e.target.value) : null)}
              disabled={cargando || descarga.isPending}
            >
              <option value="">
                {cargando ? 'Cargando devoluciones...' : devoluciones.length === 0 ? 'No hay devoluciones liquidadas' : '-- Seleccione una devolución --'}
              </option>
              {devoluciones.map((d: any) => (
                <option key={d.id} value={d.id}>{d.nombreDevolucion}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Presentación</label>
            <div className="inline-flex gap-1 rounded-xl border border-borde bg-white p-1">
              {([['CONSOLIDADO', 'Consolidado'], ['POR_MES', 'Por mes (una hoja por tarifa)']] as const).map(([valor, texto]) => (
                <button
                  key={valor}
                  onClick={() => setModo(valor)}
                  disabled={descarga.isPending}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${modo === valor ? 'bg-petroleo-700 text-white shadow-sm' : 'text-petroleo-700 hover:bg-petroleo-50'}`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-primary"
            disabled={maestroId === null || descarga.isPending || isFetching || !tablas?.length}
            onClick={() => descarga.mutate()}
          >
            {descarga.isPending && <span className="spinner" />}
            {descarga.isPending ? 'Generando Excel...' : 'Descargar Excel'}
          </button>
        </div>

        {maestroId !== null && (
          isFetching ? (
            <div className="rounded-xl border border-borde bg-fondo py-10 text-center text-sm text-slate-400">
              <span className="spinner mr-2" /> Calculando el consolidado...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 py-6 text-center text-sm text-red-700">
              No fue posible consultar la devolución.
            </div>
          ) : !tablas?.length ? (
            <div className="rounded-xl border border-borde bg-fondo py-10 text-center text-sm text-slate-400">
              La devolución no tiene resultados.
            </div>
          ) : (
            <div className="space-y-6">
              {tablas.map((t) => (
                <div key={t.nombre} className="rounded-xl border border-borde overflow-hidden">
                  {modo === 'POR_MES' && (
                    <div className="px-5 py-3 bg-petroleo-50 border-b border-borde">
                      <p className="text-sm font-bold text-petroleo-900">{t.nombre}</p>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="table-base whitespace-nowrap">
                      <thead>
                        <tr>
                          <th>Mes de facturación</th>
                          <th className="text-right">Capital</th>
                          <th className="text-right">Tasa interés</th>
                          <th className="text-right">Interés</th>
                          <th className="text-right">Capital + interés</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.filas.map((f) => (
                          <tr key={`${f.anio}-${f.mes}`}>
                            <td className="font-semibold tabular-nums">{periodo(f.mes, f.anio)}</td>
                            <td className="text-right tabular-nums">{fmtValor(f.capital)}</td>
                            <td className="text-right tabular-nums text-slate-500">{fmtTasa(f.tasa)}</td>
                            <td className="text-right tabular-nums">{fmtValor(f.interes)}</td>
                            <td className="text-right tabular-nums font-semibold text-petroleo-900">{fmtValor(f.acumulado)}</td>
                          </tr>
                        ))}
                        <tr className="bg-verde-50 hover:bg-verde-50">
                          <td className="font-bold text-petroleo-900">Total</td>
                          <td className="text-right tabular-nums font-bold">{fmtValor(t.totalCapital)}</td>
                          <td />
                          <td className="text-right tabular-nums font-bold">{fmtValor(t.totalInteres)}</td>
                          <td className="text-right tabular-nums font-bold text-petroleo-900">{fmtValor(t.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
