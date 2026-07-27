import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, ChevronLeft, ChevronRight, Loader2, Filter } from 'lucide-react';
import { getFacturas } from '../api/facturas';
import { useDebounce } from '../hooks/useDebounce'; 

export default function VisorFacturas() {
  // Estados de paginación y filtros en tiempo real
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [filtroFactura, setFiltroFactura] = useState('');
  const [filtroDataease, setFiltroDataease] = useState('');

  // 1. Aplicamos el Debounce: espera 500ms después de que el usuario deja de escribir
  const debouncedFactura = useDebounce(filtroFactura, 500);
  const debouncedDataease = useDebounce(filtroDataease, 500);

  // 2. Consulta a React Query usando los valores debounced
  const { data, isLoading, isError } = useQuery({
    queryKey: ['facturas', page, size, debouncedFactura, debouncedDataease],
    queryFn: () => getFacturas(page, size, { 
      factura: debouncedFactura, 
      codigoDataease: debouncedDataease 
    }),
    placeholderData: (previousData) => previousData, // Mantiene la data anterior mientras carga la nueva página
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visor de Facturas</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Consulta y filtra el histórico de facturación importada en el sistema.
        </p>
      </div>

      {/* Tarjeta Principal Unificada */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col min-h-[600px]">
        
        {/* Barra de Filtros Minimalista */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar por No. Factura..."
              value={filtroFactura}
              onChange={(e) => { setFiltroFactura(e.target.value); setPage(0); }}
              className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300"
            />
          </div>
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar por Código Dataease..."
              value={filtroDataease}
              onChange={(e) => { setFiltroDataease(e.target.value); setPage(0); }}
              className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-300"
            />
          </div>
        </div>

        {/* Tabla de Datos */}
        <div className="flex-1 overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-gray-100 rounded-tl-xl">Factura</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Dataease</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Usuario</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Uso</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Estado</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100 text-right rounded-tr-xl">Valor Facturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">Cargando registros...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-red-500">
                    Error al cargar los datos.
                  </td>
                </tr>
              ) : data?.content?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="bg-gray-50 p-4 rounded-full inline-block mb-4">
                      <FileText className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">No se encontraron facturas</p>
                    <p className="text-sm font-medium text-gray-400 mt-1">Intenta ajustando los parámetros de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                data?.content?.map((factura: any) => (
                  <tr key={factura.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {factura.factura}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {factura.codigoDataease}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {factura.usuario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {factura.uso}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg ${
                        factura.estado.toLowerCase() === 'activo' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {factura.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">
                      ${factura.vlrFactu?.toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador Limpio */}
        {data?.totalPages > 0 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-6">
            <p className="text-sm text-gray-400 font-medium">
              Mostrando <span className="font-bold text-gray-900">{(page * size) + 1}</span> a <span className="font-bold text-gray-900">{Math.min((page + 1) * size, data.totalElements)}</span> de <span className="font-bold text-gray-900">{data.totalElements}</span> registros
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => (!data.last ? p + 1 : p))}
                disabled={data?.last}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}