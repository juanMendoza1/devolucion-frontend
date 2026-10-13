import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reliquidacionApi } from '../../api/reliquidacion';
import { descargarFacturacionDevolucion, getResumenFacturacionDevolucion } from '../../api/reportes';
import ReporteConsolidadoMes from './ReporteConsolidadoMes';

const fmtValor = (v: number | null | undefined) => {
  const n = Number(v ?? 0);
  const texto = Math.abs(n).toLocaleString('es-CO', { maximumFractionDigits: 10 });
  return n < 0 ? `-$${texto}` : `$${texto}`;
};

export default function ModuloReportes() {
  const [maestroId, setMaestroId] = useState<number | null>(null);

  const { data: devoluciones = [], isLoading: cargandoDevoluciones } = useQuery({
    queryKey: ['consolidados-reportes'],
    queryFn: reliquidacionApi.getConsolidados,
  });
  const devolucionesProduccion = devoluciones.filter((d: any) => !d.esDemo);

  const { data: resumen, isFetching: cargandoResumen, isError } = useQuery({
    queryKey: ['resumen-facturacion', maestroId],
    queryFn: () => getResumenFacturacionDevolucion(maestroId!),
    enabled: maestroId !== null,
  });

  const descarga = useMutation({
    mutationFn: (id: number) => descargarFacturacionDevolucion(id),
    onSuccess: (nombre) => toast.success(`Reporte descargado: ${nombre}`),
    onError: () => toast.error('No se pudo generar el reporte.'),
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div className="page-header">
        <div>
          <p className="page-kicker">Reportes</p>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Genere y descargue los reportes de las devoluciones liquidadas.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="text-base font-semibold">Facturación devolución</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Excel con una fila por usuario objeto de la devolución: código Dataease, valor de devolución e interés.
              Suma todas las tarifas de la devolución y conserva todos los decimales.
            </p>
          </div>
        </div>

        <div className="card-body space-y-6">
          <div className="max-w-lg">
            <label className="label" htmlFor="devolucion">Devolución</label>
            <select
              id="devolucion"
              className="input cursor-pointer"
              value={maestroId ?? ''}
              onChange={(e) => setMaestroId(e.target.value ? Number(e.target.value) : null)}
              disabled={cargandoDevoluciones || descarga.isPending}
            >
              <option value="">
                {cargandoDevoluciones ? 'Cargando devoluciones...' : devolucionesProduccion.length === 0 ? 'No hay devoluciones liquidadas' : '-- Seleccione una devolución --'}
              </option>
              {devolucionesProduccion.map((d: any) => (
                <option key={d.id} value={d.id}>{d.nombreDevolucion}</option>
              ))}
            </select>
          </div>

          {maestroId !== null && (
            cargandoResumen ? (
              <div className="rounded-xl border border-borde bg-fondo py-10 text-center text-sm text-slate-400">
                <span className="spinner mr-2" /> Calculando el contenido del reporte...
              </div>
            ) : isError || !resumen ? (
              <div className="rounded-xl border border-red-200 bg-red-50 py-6 text-center text-sm text-red-700">
                No fue posible consultar la devolución.
              </div>
            ) : (
              <div className="rounded-xl border border-borde overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-borde">
                  <div className="px-5 py-4">
                    <p className="kpi-label">Usuarios en el reporte</p>
                    <p className="mt-1 text-xl font-bold text-petroleo-900 tabular-nums">{Number(resumen.usuarios).toLocaleString('es-CO')}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="kpi-label">Valor devolución</p>
                    <p className="mt-1 text-xl font-bold text-petroleo-900 tabular-nums">{fmtValor(resumen.valor_devolucion)}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="kpi-label">Interés</p>
                    <p className="mt-1 text-xl font-bold text-petroleo-900 tabular-nums">{fmtValor(resumen.interes)}</p>
                  </div>
                </div>
                <div className="px-5 py-4 bg-fondo border-t border-borde flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Columnas: codigo_dataease, valor_devolucion, interes. Solo usuarios con valor de devolución.
                  </p>
                  <button
                    className="btn-primary"
                    disabled={descarga.isPending || Number(resumen.usuarios) === 0}
                    onClick={() => descarga.mutate(maestroId)}
                  >
                    {descarga.isPending && <span className="spinner" />}
                    {descarga.isPending ? 'Generando Excel...' : 'Descargar Excel'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <ReporteConsolidadoMes devoluciones={devolucionesProduccion} cargando={cargandoDevoluciones} />
    </div>
  );
}
