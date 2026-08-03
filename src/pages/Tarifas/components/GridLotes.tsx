import { useQuery } from '@tanstack/react-query';
import { getResumenLotes } from '../../../api/tarifas';

interface GridLotesProps {
  onSelectLote: (lote: { jobId: string; mes: number; anio: number }) => void;
}

export default function GridLotes({ onSelectLote }: GridLotesProps) {
  const { data: lotesData, isLoading: isLoadingLotes } = useQuery({
    queryKey: ['lotes'],
    queryFn: getResumenLotes,
  });

  if (isLoadingLotes) {
    return <div className="text-center py-12 text-gray-400">Cargando lotes...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
      {lotesData?.map((lote: any) => (
        <div 
          key={lote.jobId} 
          onClick={() => onSelectLote({ jobId: lote.jobId, mes: lote.mes, anio: lote.anio })} 
          className="p-6 border border-gray-100 rounded-2xl hover:border-gray-900 hover:shadow-lg cursor-pointer bg-gray-50/50 hover:bg-white transition-all group flex flex-col h-full"
        >
          {/* CABECERA: ESTADO Y PERIODO */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Periodo</span>
              <h3 className="font-black text-3xl text-gray-900 leading-none mt-1">
                {String(lote.mes).padStart(2, '0')} / {lote.anio}
              </h3>
            </div>
            {lote.pendientes === 0 ? (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Completado</span>
            ) : (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">Pendiente</span>
            )}
          </div>
          
          {/* NOVEDAD */}
          <div className="mb-4">
            <span className="inline-block bg-blue-50 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-blue-100">
              {lote.novedad || 'Sin novedad'}
            </span>
          </div>

          {/* REF JOB ID SUTIL */}
          <div className="text-[11px] text-gray-400 font-mono mb-4 truncate" title={lote.jobId}>
            Ref: {lote.jobId.split('-')[0]}...
          </div>

          {/* MÉTRICAS */}
          <div className="mt-auto space-y-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex justify-between">
              <span>Total de tarifas:</span> <span className="font-bold text-gray-900">{lote.totalTarifas}</span>
            </div>
            <div className="flex justify-between">
              <span>Asignadas:</span> <span className="font-bold text-blue-600">{lote.totalAsignadas}</span>
            </div>
            <div className="flex justify-between">
              <span>Sin Asignar:</span> <span className="font-bold text-amber-600">{lote.pendientes}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}