import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getTarifasPorLote, getAprovechadoresActivos, asignarAprovechador, retirarAprovechador } from '../../../api/tarifas';
import { confirmar } from '../../../utils/confirmar';

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

  // LÓGICA DE ASIGNACIÓN (Envía los arrays completos al backend)
  const handleAsignarVisualizados = () => {
    if (selectedAprovechadores.length === 0) return toast.error('Selecciona al menos una ASOCIACIÓN.');
    if (!registrosData?.content || registrosData.content.length === 0) return toast.error('No hay registros en esta vista.');

    const idsVisualizados = registrosData.content.map((reg: any) => reg.id);
    
    asignacionMutation.mutate({ 
      aprovechadorIds: selectedAprovechadores, 
      tarifasIds: idsVisualizados 
    });
  };

  const handleRetirarVisualizados = async () => {
    if (selectedAprovechadores.length === 0) return toast.error('Selecciona al menos una ASOCIACIÓN.');
    if (!registrosData?.content || registrosData.content.length === 0) return toast.error('No hay registros en esta vista.');
    const ok = await confirmar({
      titulo: '¿Retirar las asociaciones seleccionadas?',
      detalle: 'Se retiran de los registros visibles y queda registrado en el histórico.',
      textoConfirmar: 'Retirar',
      peligroso: true,
    });
    if (!ok) return;

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
      return ap ? `${ap.nit} - ${ap.nombre}` : "1 seleccionada";
    }
    return `${selectedAprovechadores.length} asociaciones seleccionadas`;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* CABECERA Y BOTÓN VOLVER */}
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={onVolver} className="btn-secondary btn-sm">
          Volver
        </button>
        <div>
          <h2 className="text-lg font-bold">
            Registros del periodo {String(tarifa.mes).padStart(2, '0')} / {tarifa.anio}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {tarifa.jobId}</p>
        </div>
      </div>

      {/* BARRA DE ASIGNACIÓN */}
      <div className="card">
        <div className="card-body py-5">
          <p className="label">Asociaciones a vincular o retirar de los registros visibles</p>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full">
            
            {/* SELECT MÚLTIPLE PERSONALIZADO */}
            <div className="relative flex-1 min-w-0" ref={dropdownRef}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="input cursor-pointer flex justify-between items-center gap-3 font-medium"
              >
                <span className="truncate">{getSelectText()}</span>
                <span className="shrink-0 text-xs font-semibold text-petroleo-600">{isDropdownOpen ? 'Ocultar' : 'Mostrar'}</span>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-borde rounded-xl shadow-elevada max-h-72 overflow-y-auto">
                  {(!aprovechadores || aprovechadores.length === 0) && (
                    <div className="px-5 py-4 text-sm text-slate-500">
                      No hay aprovechadores activos. Créelos en el módulo Aprovechadores.
                    </div>
                  )}
                  {aprovechadores && aprovechadores.length > 0 && (
                    <div className="grid grid-cols-[1rem_3rem_9rem_1fr] gap-3 px-5 py-2 bg-petroleo-50 text-[11px] font-semibold uppercase tracking-wide text-petroleo-700 border-b border-borde sticky top-0">
                      <span />
                      <span>Id</span>
                      <span>NIT</span>
                      <span>Nombre</span>
                    </div>
                  )}
                  {aprovechadores?.map((ap: any) => (
                    <label key={ap.id} className={`grid grid-cols-[1rem_3rem_9rem_1fr] gap-3 items-center px-5 py-2.5 cursor-pointer border-b border-slate-100 last:border-0 text-sm transition-colors ${selectedAprovechadores.includes(ap.id) ? 'bg-verde-50' : 'hover:bg-petroleo-50/60'}`}>
                      <input 
                        type="checkbox" 
                        checked={selectedAprovechadores.includes(ap.id)}
                        onChange={() => toggleAprovechador(ap.id)}
                        className="h-4 w-4 accent-petroleo-700 cursor-pointer"
                      />
                      <span className="font-mono text-slate-400">#{ap.id}</span>
                      <span className="font-mono text-slate-600 truncate">{ap.nit}</span>
                      <span className="font-semibold text-petroleo-900 truncate">{ap.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 shrink-0">
              <button 
                onClick={handleAsignarVisualizados} 
                disabled={isPending || registrosEnVista === 0 || selectedAprovechadores.length === 0} 
                className="btn-success whitespace-nowrap"
              >
                {asignacionMutation.isPending ? <><span className="spinner" /> Procesando...</> : `Vincular ${registrosEnVista} registros`}
              </button>
              <button 
                onClick={handleRetirarVisualizados} 
                disabled={isPending || registrosEnVista === 0 || selectedAprovechadores.length === 0} 
                className="btn-danger whitespace-nowrap"
              >
                {retiroMutation.isPending ? <><span className="spinner" /> Procesando...</> : 'Retirar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA COMPLETA DE ESTRUCTURA devol_tarifas */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base text-xs min-w-[1200px]">
            <thead>
              <tr>
                <th>Periodo</th>
                <th className="text-center">Estrato</th>
                <th>Concepto</th>
                <th className="text-right">Aplicado</th>
                <th className="text-right">Ajustado</th>
                <th className="text-right">Devolución</th>
                <th className="text-right">% Subcon</th>
                <th className="text-right">Subcon</th>
                <th className="text-right">Dev. aplicar</th>
                <th>Liquidación</th>
                <th className="text-center">ESP</th>
                <th>Asociación</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRegistros ? (
                <tr><td colSpan={12} className="py-12 text-center text-slate-400 text-sm"><span className="spinner mr-2" /> Cargando registros...</td></tr>
              ) : !registrosData?.content || registrosData.content.length === 0 ? (
                <tr><td colSpan={12} className="py-12 text-center text-slate-400 text-sm">Esta tarifa no tiene registros.</td></tr>
              ) : (
                registrosData?.content?.map((reg: any) => (
                  <tr key={reg.id}>
                    <td className="font-semibold text-petroleo-900 tabular-nums whitespace-nowrap">{reg.mes}/{reg.anio}</td>
                    <td className="text-center tabular-nums">{reg.estrato}</td>
                    <td className="font-semibold text-slate-600">{reg.concepto}</td>
                    <td className="text-right tabular-nums whitespace-nowrap text-slate-500">${reg.aplicado?.toLocaleString('es-CO')}</td>
                    <td className="text-right tabular-nums whitespace-nowrap font-semibold">${reg.ajustado?.toLocaleString('es-CO')}</td>
                    <td className="text-right tabular-nums whitespace-nowrap text-slate-500">${reg.devolucion?.toLocaleString('es-CO')}</td>
                    <td className="text-right tabular-nums whitespace-nowrap font-mono text-slate-400">{reg.porsubcon}%</td>
                    <td className="text-right tabular-nums whitespace-nowrap text-petroleo-600">${reg.subcon?.toLocaleString('es-CO')}</td>
                    <td className="text-right tabular-nums whitespace-nowrap font-bold text-petroleo-900">${reg.devolucionAplicar?.toLocaleString('es-CO')}</td>
                    <td className="text-slate-500">{reg.liquidacion}</td>
                    <td className="text-center text-slate-500">{reg.esp}</td>
                    
                    {/* MÚLTIPLES ASOCIACIONES (MANY-TO-MANY) */}
                    <td>
                      {reg.aprovechadores && reg.aprovechadores.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {reg.aprovechadores.map((ap: any) => (
                            <span key={ap.id} className="badge-info">
                              {ap.nombreRazonSocial}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="badge-warn">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {registrosData && (
          <div className="flex flex-wrap items-center justify-between border-t border-borde px-6 py-4 gap-4">
            <div className="text-sm text-slate-500 tabular-nums">
              Página <span className="font-semibold text-petroleo-900">{registrosData.number + 1}</span> de <span className="font-semibold text-petroleo-900">{registrosData.totalPages}</span> 
              <span className="ml-2">({registrosData.totalElements} registros totales)</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={registrosData.first} className="btn-secondary btn-sm">Anterior</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={registrosData.last} className="btn-secondary btn-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
