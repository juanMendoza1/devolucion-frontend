import { useQuery } from '@tanstack/react-query';
import { ArrowDownToLine, Activity, Clock, CheckCircle, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { getHistorialAuditoria } from '../api/auditoria';

export default function Dashboard() {
  
  // Consulta a React Query para traer el historial
  const { data: auditorias, isLoading, isError } = useQuery({
    queryKey: ['auditorias'],
    queryFn: getHistorialAuditoria,
    // Refrescar automáticamente cada 10 segundos para ver si una importación "EN_PROCESO" termina
    refetchInterval: 10000, 
  });

  // Función para formatear fechas (ej: "24/7/2026, 09:30 AM")
  const formatearFecha = (fechaArray: string | number[]) => {
    if (!fechaArray) return '-';
    try {
      // Spring a veces devuelve la fecha como un array [año, mes, dia, hora, min, seg] o un string ISO
      const fecha = Array.isArray(fechaArray) 
        ? new Date(fechaArray[0], fechaArray[1] - 1, fechaArray[2], fechaArray[3] || 0, fechaArray[4] || 0)
        : new Date(fechaArray);
      
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(fecha);
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Título limpio */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Resumen Operativo</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Monitorea el estado de las importaciones y reliquidaciones en tiempo real.
        </p>
      </div>

      {/* Tarjetas de KPIs Minimalistas (Estáticas por ahora) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Reliquidado" value="$0" icon={Activity} />
        <KPICard title="Total a Devolver" value="$0" icon={ArrowDownToLine} />
        <KPICard title="Archivos Procesados" value={auditorias?.length?.toString() || "0"} icon={CheckCircle} />
        <KPICard title="Procesos Pendientes" value="0" icon={Clock} />
      </div>

      {/* Tarjeta del Historial de Importaciones */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Historial de Importaciones</h3>
            <p className="text-sm font-medium text-gray-400 mt-1">Registro de todas las cargas masivas realizadas en el sistema.</p>
          </div>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <FileSpreadsheet className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Tabla de Auditoría */}
        <div className="flex-1 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-gray-100 rounded-tl-xl">Archivo</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Usuario</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Inicio</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Registros</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100 rounded-tr-xl">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">Cargando historial...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-red-500 flex flex-col items-center">
                    <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
                    Error al cargar el historial de auditoría.
                  </td>
                </tr>
              ) : auditorias?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="bg-gray-50 p-4 rounded-full inline-block mb-4">
                      <Activity className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Sin datos de importación</h3>
                    <p className="text-sm font-medium text-gray-400 max-w-sm mx-auto">
                      Aún no se han realizado importaciones en el sistema. Los registros aparecerán aquí automáticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                auditorias?.map((audit: any) => (
                  <tr key={audit.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{audit.nombreArchivo}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5" title={audit.jobId}>
                        ID: {audit.jobId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {audit.usuIdRegistro}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearFecha(audit.fechaInicio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {audit.totalRegistros ? audit.totalRegistros.toLocaleString('es-CO') : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg border ${
                        audit.estado === 'COMPLETADO' 
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : audit.estado === 'EN_PROCESO'
                          ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {audit.estado === 'EN_PROCESO' && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                        {audit.estado}
                      </span>
                      {/* Si hay error, mostrar un tooltip o pequeño texto debajo */}
                      {audit.estado === 'ERROR' && audit.mensajeError && (
                        <div className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={audit.mensajeError}>
                          {audit.mensajeError}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de Tarjeta con Sombra Suave
function KPICard({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className="bg-gray-50 p-3.5 rounded-2xl">
        <Icon className="h-6 w-6 text-gray-700" />
      </div>
    </div>
  );
}