import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCloud, FileText, CheckCircle2, Info, Loader2, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImportacionCSV } from '../api/facturas';
import { useWebSocketProgress } from '../hooks/useWebSocketProgress';

const IMPORT_CONFIGS = {
  FACTURAS_ORIGINALES: {
    label: 'Facturas Originales',
    description: 'Carga de facturas maestras extraídas del sistema externo.',
    columns: [
      'codigo_dataease', 'esp', 'usuario', 'factura', 'uso', 
      'estrato', 'desocupa', 'descto_pap', 'medicion_aforo', 
      'estado', 'porcentaje', 'pagada', 'fecha_pago', 'vlr_factu', 
      'vlr_pagado', 'mes', 'ano', 'toneladas'
    ]
  },
  BASE_TARIFAS: {
    label: 'Base Tarifas (Ajustes)',
    description: 'Actualización de parámetros, liquidaciones y ajustes tarifarios.',
    columns: [
      'mes', 'anio', 'estrato', 'concepto', 'aplicado', 
      'ajustado', 'devolucion', 'porsubcon', 'subcon', 
      'devolucion_aplicar', 'liquidacion', 'esp'
    ]
  }
};

type ImportTypeKey = keyof typeof IMPORT_CONFIGS;

export default function Importar() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportTypeKey>('FACTURAS_ORIGINALES');
  const [novedad, setNovedad] = useState('');
  const [version, setVersion] = useState('');
  
  // Estado para decirle al WebSocket a dónde conectarse (solo se llena cuando inicia la mutación)
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // MAGIA AQUI ✨ -> Usamos nuestro nuevo Custom Hook
  const { progreso, setProgreso } = useWebSocketProgress({
    topic: activeTopic,
    onComplete: () => {
      toast.success('Archivo cargado y procesado exitosamente');
      setTimeout(() => {
        setSelectedFile(null);
        setProgreso({ porcentaje: 0, mensaje: '' });
        setActiveTopic(null); // Desconecta el socket
        setNovedad('');
        setVersion('');
      }, 2500);
    },
    onError: (msg) => {
      toast.error(msg, { duration: 6000 });
      setProgreso({ porcentaje: 0, mensaje: '' });
      setActiveTopic(null); // Desconecta el socket
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgreso({ porcentaje: 0, mensaje: 'Enviando archivo al servidor...' });
      const data = await uploadImportacionCSV(file, importType, novedad, version);
      return data.jobId; 
    },
    onSuccess: (jobId) => {
      // Al tener éxito el Post HTTP, le decimos al hook que se suscriba al topic
      setActiveTopic(`/topic/import-progress/${jobId}`);
    },
    onError: () => {
      toast.error('Ocurrió un error al contactar al servidor');
      setProgreso({ porcentaje: 0, mensaje: '' });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setProgreso({ porcentaje: 0, mensaje: '' });
      } else {
        toast.error('Por favor, selecciona un archivo CSV válido');
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    if (importType === 'BASE_TARIFAS' && (!novedad.trim() || !version.trim())) {
      toast.error('Por favor ingresa el Nombre de la Novedad y la Versión');
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  const currentConfig = IMPORT_CONFIGS[importType];
  const isBusy = uploadMutation.isPending || activeTopic !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Importar Datos</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Carga archivos CSV para alimentar las diferentes bases de datos del sistema.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
        
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            ¿Qué tipo de información deseas cargar?
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Database className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <select
              value={importType}
              onChange={(e) => {
                setImportType(e.target.value as ImportTypeKey);
                setSelectedFile(null);
                setNovedad('');
                setVersion('');
              }}
              disabled={isBusy}
              className="block w-full pl-12 pr-10 py-3.5 bg-[#F8F9FA] border border-gray-100 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 appearance-none cursor-pointer transition-all disabled:opacity-50"
            >
              {Object.entries(IMPORT_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            {/* SVG caret (omitido para brevedad, mantenlo de tu código original) */}
          </div>
          <p className="text-sm text-gray-500 font-medium mt-2 ml-1">
            {currentConfig.description}
          </p>

          {importType === 'BASE_TARIFAS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Novedad <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: Ajuste IPC 2026"
                  value={novedad}
                  onChange={(e) => setNovedad(e.target.value)}
                  disabled={isBusy}
                  className="block w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-gray-900 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Versión <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: V.1.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={isBusy}
                  className="block w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-gray-900 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mb-10 bg-[#F8F9FA] rounded-2xl p-6 border border-gray-100 transition-all">
          <div className="flex items-center mb-3">
            <div className="bg-white p-2 rounded-xl shadow-sm mr-3">
              <Info className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Columnas Requeridas</h3>
          </div>
          <p className="text-sm text-gray-500 font-medium mb-5 leading-relaxed">
            El archivo CSV debe contener exactamente estas columnas en la primera fila.
          </p>
          <div className="flex flex-wrap gap-2">
            {currentConfig.columns.map((col, index) => (
              <span key={index} className="px-3 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-100 font-mono shadow-sm">
                {col}
              </span>
            ))}
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-white hover:bg-gray-50/50 transition-colors group">
          <div className="bg-[#F8F9FA] p-4 rounded-full shadow-sm mb-5 group-hover:scale-105 transition-transform duration-300">
            <UploadCloud className="h-10 w-10 text-gray-400" />
          </div>
          <label className="cursor-pointer text-center">
            <span className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-md">
              Examinar archivo CSV
            </span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange}
              disabled={isBusy}
            />
          </label>
        </div>

        {selectedFile && (
          <div className="mt-6 bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-xl shadow-sm mr-4">
                  <FileText className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs font-medium text-gray-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={isBusy}
                className="flex items-center px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md"
              >
                {isBusy ? (
                  <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Procesando...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar</>
                )}
              </button>
            </div>

            {isBusy && (
              <div className="space-y-2 mt-4 animate-in fade-in duration-300">
                <div className="flex justify-between text-xs font-bold text-gray-900">
                  <span>{progreso.mensaje || 'Conectando con el servidor...'}</span>
                  <span>{progreso.porcentaje}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progreso.porcentaje}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}