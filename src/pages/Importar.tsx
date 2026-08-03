import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCloud, FileText, CheckCircle2, Info, Loader2, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { uploadImportacionCSV } from '../api/facturas';

// 1. Diccionario de Tipos de Importación
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

// Tipo para el selector
type ImportTypeKey = keyof typeof IMPORT_CONFIGS;

export default function Importar() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // 2. Estados para el dinamismo y la cabecera
  const [importType, setImportType] = useState<ImportTypeKey>('FACTURAS_ORIGINALES');
  const [novedad, setNovedad] = useState('');
  const [version, setVersion] = useState('');
  
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-import'),
      reconnectDelay: 5000,
      onConnect: () => console.log('Conectado al servidor de WebSockets'),
      onStompError: (frame) => console.error('Error STOMP:', frame.headers['message']),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate(); 
    };
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(0);
      setStatusMessage('Enviando archivo al servidor...');
      // 3. Pasamos el tipo, la novedad y la versión a la API
      const data = await uploadImportacionCSV(file, importType, novedad, version);
      return data.jobId; 
    },
    onSuccess: (jobId) => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        const subscription = stompClientRef.current.subscribe(
          `/topic/import-progress/${jobId}`, 
          (message) => {
            const data = JSON.parse(message.body);
            
            if (data.porcentaje !== -1) {
              setUploadProgress(data.porcentaje);
            }
            
            setStatusMessage(data.mensaje);

            if (data.porcentaje === 100) {
              toast.success('Archivo cargado y procesado exitosamente');
              setTimeout(() => {
                setSelectedFile(null);
                setUploadProgress(0);
                setStatusMessage('');
                setNovedad('');
                setVersion('');
              }, 2500);
              subscription.unsubscribe(); 
            } 
            else if (data.porcentaje === 0 && data.mensaje.includes('ERROR')) {
              toast.error(data.mensaje.replace('ERROR: ', ''), {
                duration: 6000, 
              });
              setUploadProgress(0);
              setStatusMessage('');
              subscription.unsubscribe();
            }
          }
        );
      }
    },
    onError: () => {
      toast.error('Ocurrió un error al contactar al servidor');
      setUploadProgress(0);
      setStatusMessage('');
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setUploadProgress(0);
        setStatusMessage('');
      } else {
        toast.error('Por favor, selecciona un archivo CSV válido');
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    // Pequeña validación extra si es Tarifas para que no lo manden vacío
    if (importType === 'BASE_TARIFAS' && (!novedad.trim() || !version.trim())) {
      toast.error('Por favor ingresa el Nombre de la Novedad y la Versión');
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  // Variable de atajo para la configuración actual
  const currentConfig = IMPORT_CONFIGS[importType];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Importar Datos</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Carga archivos CSV para alimentar las diferentes bases de datos del sistema.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
        
        {/* SELECTOR MODERNO DE TIPO DE IMPORTACIÓN */}
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
                setNovedad(''); // Resetea campos al cambiar
                setVersion('');
              }}
              disabled={uploadMutation.isPending || uploadProgress > 0}
              className="block w-full pl-12 pr-10 py-3.5 bg-[#F8F9FA] border border-gray-100 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 appearance-none cursor-pointer transition-all disabled:opacity-50"
            >
              {Object.entries(IMPORT_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-2 ml-1">
            {currentConfig.description}
          </p>

          {/* CAMPOS DINÁMICOS PARA BASE DE TARIFAS */}
          {importType === 'BASE_TARIFAS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Novedad <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: Ajuste IPC 2026"
                  value={novedad}
                  onChange={(e) => setNovedad(e.target.value)}
                  disabled={uploadMutation.isPending || uploadProgress > 0}
                  className="block w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Versión <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ej: V.1.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={uploadMutation.isPending || uploadProgress > 0}
                  className="block w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Leyenda de Estructura Dinámica */}
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
              <span 
                key={index} 
                className="px-3 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-100 font-mono shadow-sm"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Dropzone */}
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
              disabled={uploadMutation.isPending || uploadProgress > 0}
            />
          </label>
          <p className="text-xs font-medium text-gray-400 mt-4 uppercase tracking-wider">
            Tamaño máximo: 50MB
          </p>
        </div>

        {/* Archivo Seleccionado y Progreso */}
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
                disabled={uploadMutation.isPending || uploadProgress > 0}
                className="flex items-center px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md"
              >
                {(uploadMutation.isPending || uploadProgress > 0) ? (
                  <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Procesando...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar</>
                )}
              </button>
            </div>

            {(uploadMutation.isPending || uploadProgress > 0) && (
              <div className="space-y-2 mt-4 animate-in fade-in duration-300">
                <div className="flex justify-between text-xs font-bold text-gray-900">
                  <span>{statusMessage || 'Conectando con el servidor...'}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${uploadProgress}%` }}
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