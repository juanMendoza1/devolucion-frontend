import { useQuery } from '@tanstack/react-query';
import { getAuditoria } from '../../../api/tarifas';

export default function TablaAuditoria() {
  const { data: auditoriaData, isLoading: isLoadingAuditoria } = useQuery({
    queryKey: ['auditoria'],
    queryFn: getAuditoria,
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Registro de Movimientos</h2>
        <p className="text-sm text-gray-500 mt-1">Trazabilidad completa de las asignaciones masivas realizadas en el sistema.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-bold border-b border-gray-100">Fecha y Hora</th>
              <th className="px-6 py-4 font-bold border-b border-gray-100">Usuario</th>
              <th className="px-6 py-4 font-bold border-b border-gray-100">Aprovechador Asignado</th>
              <th className="px-6 py-4 font-bold border-b border-gray-100 text-right">Tarifas Afectadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoadingAuditoria ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Cargando registros...</td></tr>
            ) : auditoriaData?.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay movimientos registrados aún.</td></tr>
            ) : (
              auditoriaData?.map((registro: any) => (
                <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(registro.fechaAsignacion).toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {registro.usuarioEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{registro.aprovechadorNit}</span> - {registro.aprovechadorNombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 text-right">
                    +{registro.cantidadTarifas.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}