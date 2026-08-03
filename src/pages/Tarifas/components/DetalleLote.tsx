import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Link as LinkIcon, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTarifasPorLote, getAprovechadoresActivos, asignarAprovechador, asignarLoteCompleto } from '../../../api/tarifas';

interface DetalleLoteProps {
  lote: { jobId: string; mes: number; anio: number };
  onVolver: () => void;
}

export default function DetalleLote({ lote, onVolver }: DetalleLoteProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  
  const [selectedTarifas, setSelectedTarifas] = useState<number[]>([]);
  const [isGlobalSelection, setIsGlobalSelection] = useState(false);
  const [selectedAprovechador, setSelectedAprovechador] = useState<string>('');

  // --------------------------------------------------------
  // QUERIES
  // --------------------------------------------------------
  const { data: tarifasData, isLoading: isLoadingTarifas } = useQuery({
    queryKey: ['tarifas', lote.jobId, lote.mes, lote.anio, page, size],
    queryFn: () => getTarifasPorLote(lote.jobId, lote.mes, lote.anio, page, size),
    placeholderData: (prev) => prev,
  });

  const { data: aprovechadores } = useQuery({
    queryKey: ['aprovechadores'],
    queryFn: getAprovechadoresActivos,
  });

  // --------------------------------------------------------
  // MUTACIONES
  // --------------------------------------------------------
  const onAsignacionExito = (res: any) => {
    // Si viene de la mutación global, el mensaje puede variar un poco, usamos un texto seguro
    const mensaje = res.registrosActualizados 
      ? `¡Éxito! ${res.registrosActualizados} tarifas asignadas.` 
      : '¡Éxito! Tarifas asignadas correctamente.';
    
    toast.success(mensaje);
    setSelectedTarifas([]);
    setIsGlobalSelection(false);
    setSelectedAprovechador('');
    queryClient.invalidateQueries({ queryKey: ['tarifas', lote.jobId] });
    queryClient.invalidateQueries({ queryKey: ['lotes'] });
    queryClient.invalidateQueries({ queryKey: ['auditoria'] });
  };

  const onError = (error: any) => {
    toast.error(error.response?.data?.error || 'Error en la asignación.');
  };

  const asignacionMutation = useMutation({
    mutationFn: asignarAprovechador,
    onSuccess: onAsignacionExito,
    onError,
  });

  const asignacionGlobalMutation = useMutation({
    mutationFn: asignarLoteCompleto,
    onSuccess: onAsignacionExito,
    onError,
  });

  // --------------------------------------------------------
  // LÓGICA DE SELECCIÓN
  // --------------------------------------------------------
  const toggleSeleccion = (id: number) => {
    if (isGlobalSelection) setIsGlobalSelection(false); // Rompe el global si desmarca uno suelto
    setSelectedTarifas((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSeleccionTodos = () => {
    if (!tarifasData?.content) return;
    const idsPagina = tarifasData.content.map((t: any) => t.id);

    if (selectedTarifas.length === idsPagina.length || isGlobalSelection) {
      // Si ya estaban todos seleccionados (o estaba en modo global), limpia la selección
      setSelectedTarifas([]);
      setIsGlobalSelection(false);
    } else {
      // Selecciona solo los de esta página
      setSelectedTarifas(idsPagina);
      setIsGlobalSelection(false);
    }
  };

  const handleAsignar = () => {
    if (!selectedAprovechador) return toast.error('Selecciona un Aprovechador.');
    
    if (isGlobalSelection) {
      asignacionGlobalMutation.mutate({ 
        jobId: lote.jobId, 
        mes: lote.mes, 
        anio: lote.anio, 
        aprovechadorId: Number(selectedAprovechador) 
      });
    } else {
      asignacionMutation.mutate({ 
        aprovechadorId: Number(selectedAprovechador), 
        tarifasIds: selectedTarifas 
      });
    }
  };

  // Variables calculadas para la UI
  const isPending = asignacionMutation.isPending || asignacionGlobalMutation.isPending;
  const isAllPageSelected = tarifasData?.content?.length > 0 && selectedTarifas.length === tarifasData.content.length;

  // --------------------------------------------------------
  // RENDERIZADO
  // --------------------------------------------------------
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
      
      {/* Botón Volver y Título */}
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onVolver} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="h-6 w-6 text-gray-500" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Tarifas de {String(lote.mes).padStart(2, '0')} / {lote.anio}
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Ref: {lote.jobId}</p>
        </div>
      </div>

      {/* Barra de Asignación Flotante */}
      {(selectedTarifas.length > 0 || isGlobalSelection) && (
        <div className="mb-6 p-4 bg-gray-900 rounded-2xl flex flex-wrap items-center justify-between shadow-lg gap-4">
          <span className="bg-gray-800 px-3 py-1 rounded-lg text-sm font-bold text-white">
            {isGlobalSelection 
              ? `Todos los ${tarifasData?.totalElements} seleccionados` 
              : `${selectedTarifas.length} seleccionadas`}
          </span>
          <div className="flex items-center space-x-3">
            <select
              value={selectedAprovechador}
              onChange={(e) => setSelectedAprovechador(e.target.value)}
              className="bg-gray-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none border-none"
            >
              <option value="">-- Elegir Aprovechador --</option>
              {aprovechadores?.map((ap: any) => (
                <option key={ap.id} value={ap.id}>{ap.nit} - {ap.nombreRazonSocial}</option>
              ))}
            </select>
            <button
              onClick={handleAsignar}
              disabled={isPending}
              className="flex items-center bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
              Vincular
            </button>
          </div>
        </div>
      )}

      {/* Contenedor Principal (Banner + Tabla) */}
      <div className="flex-1 overflow-x-auto rounded-xl border border-gray-100 bg-white flex flex-col">
        
        {/* BANNER INTELIGENTE: Ofrece seleccionar todos si seleccionaste la página y hay más páginas */}
        {isAllPageSelected && !isGlobalSelection && tarifasData?.totalElements > tarifasData?.content?.length && (
          <div className="bg-blue-50 py-3 text-center text-sm text-blue-800 border-b border-blue-100">
            Se han seleccionado los <strong>{selectedTarifas.length}</strong> registros de esta página. 
            <button 
              onClick={() => setIsGlobalSelection(true)} 
              className="ml-2 font-bold underline hover:text-blue-900 transition-colors"
            >
              Seleccionar los {tarifasData.totalElements} registros del lote
            </button>
          </div>
        )}

        {/* BANNER INTELIGENTE: Avisa que estás en modo global */}
        {isGlobalSelection && (
          <div className="bg-blue-100 py-3 text-center text-sm text-blue-900 border-b border-blue-200">
            Estás seleccionando los <strong>{tarifasData?.totalElements}</strong> registros del lote completo.
            <button 
              onClick={() => { setSelectedTarifas([]); setIsGlobalSelection(false); }} 
              className="ml-2 font-bold underline hover:text-blue-900 transition-colors"
            >
              Deshacer selección
            </button>
          </div>
        )}

        {/* Tabla */}
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#F8F9FA] text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 border-b border-gray-100 w-12">
                <input 
                  type="checkbox" 
                  onChange={toggleSeleccionTodos} 
                  checked={isAllPageSelected || isGlobalSelection} 
                  className="rounded border-gray-300 focus:ring-gray-900 h-4 w-4" 
                />
              </th>
              <th className="px-6 py-4 font-bold border-b border-gray-100">Periodo</th>
              <th className="px-6 py-4 font-bold border-b border-gray-100">Concepto</th>
              <th className="px-6 py-4 font-bold border-b border-gray-100">Ajustado</th>
              <th className="px-6 py-4 font-bold border-b border-gray-100">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoadingTarifas ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Cargando tarifas...</td></tr>
            ) : (
              tarifasData?.content?.map((tarifa: any) => {
                const isChecked = selectedTarifas.includes(tarifa.id) || isGlobalSelection;
                return (
                  <tr key={tarifa.id} className={isChecked ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => toggleSeleccion(tarifa.id)} 
                        className="rounded border-gray-300 focus:ring-gray-900 h-4 w-4" 
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{tarifa.mes}/{tarifa.anio}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tarifa.concepto}</td>
                    <td className="px-6 py-4 text-sm font-bold">${tarifa.ajustado?.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4">
                      {tarifa.aprovechador ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                          {tarifa.aprovechador.nombreRazonSocial}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {tarifasData && (
          <div className="mt-auto flex flex-wrap items-center justify-between border-t border-gray-100 bg-white px-6 py-4 gap-4">
            <div className="text-sm text-gray-500">
              Página <span className="font-bold text-gray-900">{tarifasData.number + 1}</span> de <span className="font-bold text-gray-900">{tarifasData.totalPages}</span> 
              <span className="ml-2">({tarifasData.totalElements} registros)</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={tarifasData.first}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={tarifasData.last}
                className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}