import { useQuery } from '@tanstack/react-query';
import { getEstadisticasAprovechadores, type EstadisticaAprovechador } from '../api/aprovechadores';

// Valores completos, sin redondear; el signo va antes del símbolo.
const fmtValor = (v: number | null | undefined) => {
  const n = Number(v ?? 0);
  const texto = Math.abs(n).toLocaleString('es-CO', { maximumFractionDigits: 10 });
  return n < 0 ? `-$${texto}` : `$${texto}`;
};
const fmtNum = (v: number | null | undefined) => Number(v ?? 0).toLocaleString('es-CO');

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['estadisticas-aprovechadores'],
    queryFn: getEstadisticasAprovechadores,
  });

  const encabezado = (
    <div className="page-header">
      <div>
        <p className="page-kicker">Datos</p>
        <h1 className="page-title">Panel general</h1>
        <p className="page-subtitle">Resumen de las devoluciones liquidadas y su distribución por aprovechador.</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl">
        {encabezado}
        <div className="card card-body py-16 text-center text-slate-400 text-sm">
          <span className="spinner mr-2" /> Calculando estadísticas...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-7xl">
        {encabezado}
        <div className="card card-body py-16 text-center text-sm font-medium text-red-600">
          No fue posible cargar las estadísticas.
        </div>
      </div>
    );
  }

  const { totales } = data;
  // Ordenados por monto devuelto (valor absoluto), mayor primero
  const filas = [...data.aprovechadores].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const maxTotal = Math.max(...filas.map((f) => Math.abs(f.total)), 0);
  const maxUsuarios = Math.max(...filas.map((f) => f.usuarios), 0);
  const conDatos = filas.some((f) => f.total !== 0 || f.tarifasAsignadas > 0);

  return (
    <div className="max-w-7xl space-y-6">
      {encabezado}

      {/* Indicadores globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="kpi">
          <p className="kpi-label">Devoluciones liquidadas</p>
          <p className="kpi-value">{fmtNum(totales.devoluciones)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Tarifas liquidadas</p>
          <p className="kpi-value">
            {fmtNum(totales.tarifas_liquidadas)}
            <span className="text-base font-semibold text-slate-400"> de {fmtNum(totales.tarifas_cargadas)}</span>
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Usuarios en devoluciones</p>
          <p className="kpi-value">{fmtNum(totales.usuarios)}</p>
        </div>
        <div className="kpi border-l-verde-500">
          <p className="kpi-label">Total a devolver</p>
          <p className="kpi-value">{fmtValor(totales.total)}</p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            Capital {fmtValor(totales.capital)} · Intereses {fmtValor(totales.intereses)}
          </p>
        </div>
      </div>

      {!conDatos ? (
        <div className="card card-body py-16 text-center">
          <p className="text-sm font-semibold text-petroleo-900">Aún no hay estadísticas</p>
          <p className="text-sm text-slate-400 mt-1">
            Registre aprovechadores, asígneles tarifas y liquide una devolución para ver aquí su distribución.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Gráfica 1: total devuelto por aprovechador (capital + intereses) */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-base font-semibold">Total a devolver por aprovechador</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Capital e intereses de las tarifas vinculadas.</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-petroleo-600" /> Capital</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-verde-400" /> Intereses</span>
                </div>
              </div>
              <div className="card-body space-y-5">
                {filas.map((f) => {
                  const ancho = maxTotal ? (Math.abs(f.total) / maxTotal) * 100 : 0;
                  const parteCapital = f.total ? (Math.abs(f.capital) / (Math.abs(f.capital) + Math.abs(f.intereses))) * 100 : 0;
                  return (
                    <div key={f.id ?? 'sin'}>
                      <div className="flex justify-between items-baseline gap-3 mb-1.5">
                        <p className={`text-sm font-semibold truncate ${f.id === null ? 'text-amber-700' : 'text-petroleo-900'}`}>{f.nombre}</p>
                        <p className="text-sm font-bold text-petroleo-900 tabular-nums shrink-0">{fmtValor(f.total)}</p>
                      </div>
                      <div className="h-3 w-full rounded-full bg-petroleo-50 overflow-hidden">
                        <div className="h-3 flex" style={{ width: `${ancho}%` }}>
                          <div className="h-3 bg-petroleo-600" style={{ width: `${parteCapital}%` }} />
                          <div className="h-3 bg-verde-400" style={{ width: `${100 - parteCapital}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfica 2: usuarios beneficiados y avance de tarifas */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-base font-semibold">Usuarios beneficiados y avance de tarifas</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Usuarios con devolución por tarifa, y tarifas liquidadas sobre asignadas.</p>
                </div>
              </div>
              <div className="card-body space-y-5">
                {filas.map((f) => {
                  const anchoUsuarios = maxUsuarios ? (f.usuarios / maxUsuarios) * 100 : 0;
                  const avance = f.tarifasAsignadas ? (f.tarifasLiquidadas / f.tarifasAsignadas) * 100 : 0;
                  return (
                    <div key={f.id ?? 'sin'}>
                      <div className="flex justify-between items-baseline gap-3 mb-1.5">
                        <p className={`text-sm font-semibold truncate ${f.id === null ? 'text-amber-700' : 'text-petroleo-900'}`}>{f.nombre}</p>
                        <p className="text-sm font-bold text-petroleo-900 tabular-nums shrink-0">{fmtNum(f.usuarios)}</p>
                      </div>
                      <div className="h-3 w-full rounded-full bg-petroleo-50 overflow-hidden">
                        <div className="h-3 rounded-full bg-petroleo-500" style={{ width: `${anchoUsuarios}%` }} />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-1.5 rounded-full bg-verde-500" style={{ width: `${avance}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-500 tabular-nums shrink-0">
                          {fmtNum(f.tarifasLiquidadas)} de {fmtNum(f.tarifasAsignadas)} tarifas liquidadas
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detalle */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <h2 className="text-base font-semibold">Detalle por aprovechador</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Una tarifa vinculada a varias asociaciones suma en cada una de ellas.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base whitespace-nowrap">
                <thead>
                  <tr>
                    <th>Aprovechador</th>
                    <th>NIT</th>
                    <th>Estado</th>
                    <th className="text-right">Tarifas asignadas</th>
                    <th className="text-right">Tarifas liquidadas</th>
                    <th className="text-right">Usuarios</th>
                    <th className="text-right">Capital</th>
                    <th className="text-right">Intereses</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f: EstadisticaAprovechador) => (
                    <tr key={f.id ?? 'sin'}>
                      <td className={`font-semibold ${f.id === null ? 'text-amber-700' : 'text-petroleo-900'}`}>{f.nombre}</td>
                      <td className="font-mono text-xs">{f.nit ?? '-'}</td>
                      <td>
                        {f.id === null ? <span className="badge-warn">Sin asignar</span>
                          : <span className={f.activo ? 'badge-ok' : 'badge-off'}>{f.activo ? 'Activo' : 'Inactivo'}</span>}
                      </td>
                      <td className="text-right tabular-nums">{fmtNum(f.tarifasAsignadas)}</td>
                      <td className="text-right tabular-nums">{fmtNum(f.tarifasLiquidadas)}</td>
                      <td className="text-right tabular-nums">{fmtNum(f.usuarios)}</td>
                      <td className="text-right tabular-nums">{fmtValor(f.capital)}</td>
                      <td className="text-right tabular-nums">{fmtValor(f.intereses)}</td>
                      <td className="text-right tabular-nums font-bold text-petroleo-900">{fmtValor(f.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
