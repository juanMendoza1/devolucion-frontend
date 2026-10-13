import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { eliminarLoteTarifas, getResumenLotes } from '../../../api/tarifas';
import { confirmar } from '../../../utils/confirmar';

interface GridTarifasProps {
  onSelectTarifa: (tarifa: { jobId: string; mes: number; anio: number }) => void;
}

export default function GridTarifas({ onSelectTarifa }: GridTarifasProps) {
  const { data: tarifasData, isLoading: isLoadingTarifas } = useQuery({
    queryKey: ['lotes'], // Mantenemos la key para la caché de React Query
    queryFn: getResumenLotes,
  });

  const queryClient = useQueryClient();
  const eliminarMutation = useMutation({
    mutationFn: eliminarLoteTarifas,
    onSuccess: (data: any) => {
      toast.success(`Tarifa eliminada (${data?.tarifasEliminadas ?? 0} registros).`);
      queryClient.invalidateQueries({ queryKey: ['lotes'] });
      queryClient.invalidateQueries({ queryKey: ['tarifas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'No se pudo eliminar la tarifa.');
    },
  });

  const confirmarEliminar = async (e: React.MouseEvent, tarifa: any) => {
    e.stopPropagation(); // no abrir el detalle
    const periodo = `${String(tarifa.mes).padStart(2, '0')}/${tarifa.anio}`;
    const ok = await confirmar({
      titulo: `¿Eliminar la tarifa del periodo ${periodo}?`,
      detalle: `Se eliminarán ${tarifa.totalTarifas} registros. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (ok) {
      eliminarMutation.mutate(tarifa.jobId);
    }
  };

  if (isLoadingTarifas) {
    return (
      <div className="card card-body py-16 text-center text-slate-400 text-sm">
        <span className="spinner mr-2" /> Cargando tarifas...
      </div>
    );
  }

  if (!tarifasData || tarifasData.length === 0) {
    return (
      <div className="card card-body py-16 text-center">
        <p className="text-sm font-semibold text-petroleo-900">No hay tarifas cargadas</p>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Importe una base de tarifas desde el módulo de importaciones para comenzar a asignarlas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {tarifasData?.map((tarifa: any) => (
        <div 
          key={tarifa.jobId} 
          onClick={() => onSelectTarifa({ jobId: tarifa.jobId, mes: tarifa.mes, anio: tarifa.anio })} 
          className="card p-6 cursor-pointer flex flex-col h-full transition-all hover:border-petroleo-300 hover:shadow-elevada"
        >
          {/* CABECERA: ESTADO Y PERIODO */}
          <div className="flex justify-between items-start gap-3 mb-4">
            <div>
              <span className="kpi-label">Periodo</span>
              <h3 className="font-bold text-2xl leading-none mt-1.5 tabular-nums">
                {String(tarifa.mes).padStart(2, '0')} / {tarifa.anio}
              </h3>
            </div>
            {tarifa.pendientes === 0 ? (
              <span className="badge-ok">Asignada</span>
            ) : (
              <span className="badge-warn">Pendiente</span>
            )}
          </div>
          
          {/* NOVEDAD */}
          <div className="mb-3">
            <span className="badge-info text-xs">
              {tarifa.novedad || 'Sin novedad'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono mb-4 truncate" title={tarifa.jobId}>
            Ref: {tarifa.jobId.split('-')[0]}...
          </div>

          {/* MÉTRICAS */}
          <div className="mt-auto space-y-1.5 text-sm text-slate-500 pt-4 border-t border-borde">
            <div className="flex justify-between">
              <span>Registros totales</span> <span className="font-semibold text-petroleo-900 tabular-nums">{tarifa.totalTarifas}</span>
            </div>
            <div className="flex justify-between">
              <span>Asignados</span> <span className="font-semibold text-verde-700 tabular-nums">{tarifa.totalAsignadas}</span>
            </div>
            <div className="flex justify-between">
              <span>Sin asignar</span> <span className="font-semibold text-amber-700 tabular-nums">{tarifa.pendientes}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="btn-link">Ver detalle</p>
            {tarifa.totalAsignadas === 0 ? (
              <button
                className="btn-link text-red-600 hover:text-red-700"
                disabled={eliminarMutation.isPending}
                onClick={(e) => confirmarEliminar(e, tarifa)}
              >
                {eliminarMutation.isPending && eliminarMutation.variables === tarifa.jobId ? 'Eliminando...' : 'Eliminar tarifa'}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400" title="Retire las asignaciones para poder eliminarlo">
                Con asignaciones
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
