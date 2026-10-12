import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getTarifasPorLote, getAprovechadoresActivos, asignarAprovechador, retirarAprovechador } from '../../../api/tarifas';

interface DetalleTarifaProps {
  tarifa: { jobId: string; mes: number; anio: number };
  onVolver: () => void;
}

export default function DetalleTarifa({ tarifa, onVolver }: DetalleTarifaProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(24);
  
  // Estados para el Select Múltiple
  const [selectedAprovechadores, setSelectedAprovechadores] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: registrosData, isLoading: isLoadingRegistros } = useQuery({
    queryKey: ['tarifas', tarifa.jobId, tarifa.mes, tarifa.anio, page, size],
    queryFn: () => getTarifasPorLote(tarifa.jobId, tarifa.mes, tarifa.anio, page, size),
    placeholderData: (prev) => prev,
  });

  const { data: aprovechadores } = useQuery({ queryKey: ['aprovechadores'], queryFn: getAprovechadoresActivos });

  // Cierra el dropdown si se hace clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAprovechador = (id: number) => {
    setSelectedAprovechadores(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['tarifas', tarifa.jobId] });
    queryClient.invalidateQueries({ queryKey: ['lotes'] });
    queryClient.invalidateQueries({ queryKey: ['resumenAsignaciones'] });
    queryClient.invalidateQueries({ queryKey: ['eventosAsignacion'] });
  };

  // Mutación para asignar: AGREGA vínculos (no reemplaza los existentes) y guarda fecha/usuario
  const asignacionMutation = useMutation({ 
    mutationFn: asignarAprovechador, 
    onSuccess: (data: any) => {
      const n = data?.registrosActualizados ?? 0;
      toast.success(n > 0 ? `¡Éxito! ${n} vínculos nuevos registrados.` : 'Los registros ya estaban vinculados a esas asociaciones.');
      setSelectedAprovechadores([]);
      setIsDropdownOpen(false);
      refrescar();
    }, 
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error en la asignación múltiple.');
    }
  });

  // Mutación para retirar: desactiva el vínculo (queda en el historial con fecha y usuario de retiro)
  const retiroMutation = useMutation({
    mutationFn: retirarAprovechador,
    onSuccess: (data: any) => {
      toast.success(`${data?.registrosActualizados ?? 0} vínculos retirados.`);
      setSelectedAprovechadores([]);
      setIsDropdownOpen(false);
      refrescar();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al retirar la asociación.');
    }
  });

  // 🔥 LÓGICA DE ASIGNACIÓN (Envía los arrays completos al backend)
  const handleAsignarVisualizados = () => {
    if (selectedAprovechadores.length === 0) return toast.error('Selecciona al menos una ASOCIACIÓN.');
    if (!registrosData?.content || registrosData.content.length === 0) return toast.error('No hay registros en esta vista.');

    const idsVisualizados = registrosData.content.map((reg: any) => reg.id);
    
    asignacionMutation.mutate({ 
      aprovechadorIds: selectedAprovechadores, 
      tarifasIds: idsVisualizados 
    });
  };

  const handleRetirarVisualizados = () => {
    if (selectedAprovechadores.length === 0) return toast.error('Selecciona al menos una ASOCIACIÓN.');
    if (!registrosData?.content || registrosData.content.length === 0) return toast.error('No hay registros en esta vista.');
    if (!window.confirm('¿Retirar las asociaciones seleccionadas de los registros visibles? Quedará registrado en el histórico.')) return;

    retiroMutation.mutate({
      aprovechadorIds: selectedAprovechadores,
      tarifasIds: registrosData.content.map((reg: any) => reg.id)
    });
  };

  const isPending = asignacionMutation.isPending || retiroMutation.isPending;
  const registrosEnVista = registrosData?.content?.length || 0;

  // Texto dinámico para el Select
  const getSelectText = () => {
    if (selectedAprovechadores.length === 0) return "-- Seleccionar Asociaciones --";
    if (selectedAprovechadores.length === 1) {
      const ap = aprovechadores?.find((a: any) => a.id === selectedAprovechadores[0]);
      return ap ? ap.nombreRazonSocial : "1 seleccionada";
    }
    return `${selectedAprovechadores.length} asociaciones seleccionadas`;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
      
      {/* CABECERA Y BOTÓN VOLVER */}
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onVolver} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors">
          Volver
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Registros del Periodo {String(tarifa.mes).padStart(2, '0')} / {tarifa.anio}
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Ref: {tarifa.jobId}</p>
        </div>
      </div>

      {/* BARRA DE ASIGNACIÓN PRO */}
      <div className="mb-6 p-4 bg-gray-50 rounded-2xl flex items-center justify-between shadow-md border border-gray-200 gap-4">
        <div className="flex items-center space-x-3 w-full">
          
          {/* SELECT MÚLTIPLE PERSONALIZADO */}
          <div className="relative flex-1" ref={dropdownRef}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-5 py-3 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all cursor-pointer shadow-sm flex justify-between items-center"
            >
              <span className="truncate">{getSelectText()}</span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isDropdownOpen && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                {aprovechadores?.map((ap: any) => (
                  <label key={ap.id} className="flex items-center px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedAprovechadores.includes(ap.id)}
                      onChange={() => toggleAprovechador(ap.id)}
                      className="mr-3 h-4 w-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800 leading-none mb-1">{ap.nombreRazonSocial}</span>
                      <span className="text-[10px] text-gray-400 font-mono">NIT: {ap.nit}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleAsignarVisualizados} 
            disabled={isPending || registrosEnVista === 0 || selectedAprovechadores.length === 0} 
            className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm"
          >
            {asignacionMutation.isPending ? 'Procesando...' : `Vincular ${registrosEnVista} Registros`}
          </button>
          <button 
            onClick={handleRetirarVisualizados} 
            disabled={isPending || registrosEnVista === 0 || selectedAprovechadores.length === 0} 
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-sm font-bold hover:border-red-400 hover:text-red-600 disabled:opacity-50 transition-colors whitespace-nowrap shadow-sm"
          >
            {retiroMutation.isPending ? 'Procesando...' : 'Retirar'}
          </button>
        </div>
      </div>

      {/* TABLA COMPLETA DE ESTRUCTURA devol_tarifas */}
      <div className="flex-1 overflow-x-auto rounded-xl border border-gray-100 bg-white flex flex-col">
        <table className="w-full text-left border-collapse min-w-[1200px] text-xs">
          <thead>
            <tr className="bg-[#F8F9FA] text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 font-bold border-b border-gray-100">Periodo</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-center">Estrato</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100">Concepto</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Aplicado</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Ajustado</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Devolución</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-center">% Subcon</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Subcon</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-right">Dev. Aplicar</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100">Liquidación</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100 text-center">ESP</th>
              <th className="px-4 py-3 font-bold border-b border-gray-100">Asociación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoadingRegistros ? (
              <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">Cargando registros...</td></tr>
            ) : (
              registrosData?.content?.map((reg: any) => (
                <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900">{reg.mes}/{reg.anio}</td>
                  <td className="px-4 py-3 text-center text-gray-600 font-medium">{reg.estrato}</td>
                  <td className="px-4 py-3 text-gray-600 font-bold">{reg.concepto}</td>
                  <td className="px-4 py-3 text-right text-gray-500">${reg.aplicado?.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-700">${reg.ajustado?.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-right text-gray-500">${reg.devolucion?.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-center font-mono text-gray-400">{reg.porsubcon}%</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">${reg.subcon?.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-right font-black text-black">${reg.devolucionAplicar?.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-gray-500">{reg.liquidacion}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{reg.esp}</td>
                  
                  {/* 🔥 AHORA RENDERIZAMOS MÚLTIPLES ASOCIACIONES (MANY-TO-MANY) */}
                  <td className="px-4 py-3">
                    {reg.aprovechadores && reg.aprovechadores.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {reg.aprovechadores.map((ap: any) => (
                          <span key={ap.id} className="inline-flex px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                            {ap.nombreRazonSocial}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">Sin asignar</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINACIÓN */}
        {registrosData && (
          <div className="mt-auto flex flex-wrap items-center justify-between border-t border-gray-100 bg-white px-6 py-4 gap-4">
            <div className="text-sm text-gray-500">
              Página <span className="font-bold text-gray-900">{registrosData.number + 1}</span> de <span className="font-bold text-gray-900">{registrosData.totalPages}</span> 
              <span className="ml-2">({registrosData.totalElements} registros totales)</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={registrosData.first} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Anterior</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={registrosData.last} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}