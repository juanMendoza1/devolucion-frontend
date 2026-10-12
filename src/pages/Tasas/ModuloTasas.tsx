import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTasas, createTasa, updateTasa, deleteTasa, type TasaInteres } from '../../api/tasas';

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

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta tasa?')) {
      mutationDelete.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Tasas
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 font-medium">
            Administra las tasas de interés (TSI) para los cálculos de reliquidación.
          </p>
        </div>
        <button 
          onClick={() => abrirModal()}
          className="flex items-center bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" /> Nueva Tasa
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col min-h-[500px]">
        <div className="flex-1 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-gray-100">Periodo (Mes/Año)</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Tasa de Interés (TSI)</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></td></tr>
              ) : data?.content?.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center font-bold text-gray-400">No hay tasas registradas.</td></tr>
              ) : (
                data?.content?.map((tasa: TasaInteres) => (
                  <tr key={tasa.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {String(tasa.mes).padStart(2, '0')} / {tasa.ano}
                    </td>
                    {/* 🔥 COLUMNA DE TASA AJUSTADA A GRIS */}
                    <td className="px-6 py-4 font-mono font-bold text-gray-700 bg-gray-50/50">
                      {tasa.tsi} %
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => abrirModal(tasa)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 rounded-lg transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(tasa.id!)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
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
          <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
            <p className="text-sm text-gray-400 font-medium">
              Página <span className="font-bold text-gray-900">{page + 1}</span> de <span className="font-bold text-gray-900">{data.totalPages}</span>
            </p>
            <div className="flex space-x-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage(p => (!data.last ? p + 1 : p))} disabled={data?.last} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{tasaEditando ? 'Editar Tasa' : 'Nueva Tasa'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes</label>
                  <select 
                    value={formData.mes} 
                    onChange={e => setFormData({...formData, mes: Number(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-black"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Año</label>
                  <input 
                    type="number" 
                    value={formData.ano} 
                    onChange={e => setFormData({...formData, ano: Number(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tasa (TSI) Ej: 0.015</label>
                <input 
                  type="number" 
                  step="0.000001"
                  value={formData.tsi} 
                  onChange={e => setFormData({...formData, tsi: Number(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-black"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={mutationSave.isPending}
                className="w-full bg-black text-white font-bold py-3 rounded-xl mt-4 hover:bg-gray-800 disabled:opacity-50"
              >
                {mutationSave.isPending ? 'Guardando...' : 'Guardar Tasa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}