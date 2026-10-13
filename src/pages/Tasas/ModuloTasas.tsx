import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getTasas, createTasa, updateTasa, deleteTasa, type TasaInteres } from '../../api/tasas';
import { confirmar } from '../../utils/confirmar';

export default function ModuloTasas() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasaEditando, setTasaEditando] = useState<TasaInteres | null>(null);
  
  // Estado del Formulario
  const [formData, setFormData] = useState<TasaInteres>({ mes: 1, ano: new Date().getFullYear(), tsi: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['tasas', page, size],
    queryFn: () => getTasas(page, size),
  });

  const mutationSave = useMutation({
    mutationFn: (tasa: TasaInteres) => tasaEditando ? updateTasa(tasaEditando.id!, tasa) : createTasa(tasa),
    onSuccess: () => {
      toast.success(`Tasa ${tasaEditando ? 'actualizada' : 'creada'} con éxito`);
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tasas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar la tasa');
    }
  });

  const mutationDelete = useMutation({
    mutationFn: deleteTasa,
    onSuccess: () => {
      toast.success('Tasa eliminada');
      queryClient.invalidateQueries({ queryKey: ['tasas'] });
    },
    onError: () => toast.error('Error al eliminar')
  });

  const abrirModal = (tasa?: TasaInteres) => {
    if (tasa) {
      setTasaEditando(tasa);
      setFormData(tasa);
    } else {
      setTasaEditando(null);
      setFormData({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), tsi: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutationSave.mutate(formData);
  };

  const handleDelete = async (id: number) => {
    if (await confirmar({ titulo: '¿Eliminar esta tasa de interés?', textoConfirmar: 'Eliminar', peligroso: true })) {
      mutationDelete.mutate(id);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <p className="page-kicker">Parametrización</p>
          <h1 className="page-title">Tasas de interés</h1>
          <p className="page-subtitle">
            Tasas de interés (TSI) por periodo usadas en los cálculos de reliquidación.
          </p>
        </div>
        <button 
          onClick={() => abrirModal()}
          className="btn-primary"
        >
          Nueva tasa
        </button>
      </div>

      {/* TABLA */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Periodo (mes / año)</th>
                <th className="text-right">Tasa de interés (TSI)</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="py-12 text-center text-slate-400"><span className="spinner mr-2" /> Cargando tasas...</td></tr>
              ) : data?.content?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center">
                    <p className="text-sm font-semibold text-petroleo-900">No hay tasas registradas</p>
                    <p className="text-sm text-slate-400 mt-1">Use el botón Nueva tasa para registrar la primera.</p>
                  </td>
                </tr>
              ) : (
                data?.content?.map((tasa: TasaInteres) => (
                  <tr key={tasa.id}>
                    <td className="font-semibold text-petroleo-900 tabular-nums">
                      {String(tasa.mes).padStart(2, '0')} / {tasa.ano}
                    </td>
                    <td className="text-right font-mono font-semibold text-petroleo-800 tabular-nums">
                      {tasa.tsi} %
                    </td>
                    <td className="text-right whitespace-nowrap space-x-3">
                      <button onClick={() => abrirModal(tasa)} className="btn-link">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(tasa.id!)} className="btn-link text-red-600 hover:text-red-700">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {data?.totalPages > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-borde">
            <p className="text-sm text-slate-500 tabular-nums">
              Página <span className="font-semibold text-petroleo-900">{page + 1}</span> de <span className="font-semibold text-petroleo-900">{data.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary btn-sm">Anterior</button>
              <button onClick={() => setPage(p => (!data.last ? p + 1 : p))} disabled={data?.last} className="btn-secondary btn-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-petroleo-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-elevada w-full max-w-sm overflow-hidden">
            <div className="card-header bg-petroleo-50">
              <h3 className="text-base font-bold">{tasaEditando ? 'Editar tasa' : 'Nueva tasa'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary btn-sm">Cerrar</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="tasa-mes">Mes</label>
                  <select 
                    id="tasa-mes"
                    value={formData.mes} 
                    onChange={e => setFormData({...formData, mes: Number(e.target.value)})}
                    className="input h-11"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="tasa-ano">Año</label>
                  <input 
                    id="tasa-ano"
                    type="number" 
                    value={formData.ano} 
                    onChange={e => setFormData({...formData, ano: Number(e.target.value)})}
                    className="input h-11 tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="tasa-tsi">Tasa (TSI) ej: 0.015</label>
                <input 
                  id="tasa-tsi"
                  type="number" 
                  step="0.000001"
                  value={formData.tsi} 
                  onChange={e => setFormData({...formData, tsi: Number(e.target.value)})}
                  className="input font-mono tabular-nums"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={mutationSave.isPending}
                className="btn-primary w-full mt-2 py-3"
              >
                {mutationSave.isPending ? <><span className="spinner" /> Guardando...</> : 'Guardar tasa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
