import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCloud, FileText, CheckCircle2, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { uploadFacturasCSV } from '../api/facturas';

export default function Importar() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Referencia para mantener vivo el cliente WebSocket
  const stompClientRef = useRef<Client | null>(null);

  const expectedColumns = [
    'codigo_dataease', 'esp', 'usuario', 'factura', 'uso', 
    'estrato', 'desocupa', 'descto_pap', 'medicion_aforo', 
    'estado', 'porcentaje', 'pagada', 'fecha_pago', 'vlr_factu', 
    'vlr_pagado', 'mes', 'ano', 'toneladas'
  ];

  // 1. Inicializar WebSocket al cargar el componente
  useEffect(() => {
    const client = new Client({
      // Ajusta localhost:8080 a la URL de tu backend
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-import'),
      reconnectDelay: 5000,
      onConnect: () => console.log('Conectado al servidor de WebSockets'),
      onStompError: (frame) => console.error('Error STOMP:', frame.headers['message']),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate(); // Limpiamos la conexión al desmontar la vista
    };
  }, []);

  // 2. Lógica de subida y suscripción
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(0);
      setStatusMessage('Enviando archivo al servidor...');
      const data = await uploadFacturasCSV(file);
      return data.jobId; // Retornamos el jobId que nos da el backend
    },
    onSuccess: (jobId) => {
      // Si tenemos conexión, nos suscribimos al canal de este archivo específico
      if (stompClientRef.current && stompClientRef.current.connected) {
        
        const subscription = stompClientRef.current.subscribe(
          `/topic/import-progress/${jobId}`, 
          (message) => {
            const data = JSON.parse(message.body);
            
            // Actualizar porcentaje (ignorar -1 que usamos solo para mensajes de estado)
            if (data.porcentaje !== -1) {
              setUploadProgress(data.porcentaje);
            }
            
            // Actualizar el texto descriptivo
            setStatusMessage(data.mensaje);

            // Evaluar fin del proceso
            if (data.porcentaje === 100) {
              toast.success('Archivo cargado y procesado exitosamente');
              setTimeout(() => {
                setSelectedFile(null);
                setUploadProgress(0);
                setStatusMessage('');
              }, 2500);
              subscription.unsubscribe(); // Cerramos la suscripción
            } 
            // Evaluar error de validación estricta
            else if (data.porcentaje === 0 && data.mensaje.includes('ERROR')) {
              // Aquí pasamos de un texto quemado a mostrar el error detallado del backend
              toast.error(data.mensaje.replace('ERROR: ', ''), {
                duration: 6000, // Le damos un poco más de tiempo para que el usuario alcance a leer
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
    uploadMutation.mutate(selectedFile);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Importar Facturas</h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          Carga el archivo original del sistema externo para iniciar el proceso.
        </p>
      </div>

      {/* Tarjeta Principal Unificada */}
      <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
        
        {/* Leyenda de Estructura */}
        <div className="mb-10 bg-[#F8F9FA] rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center mb-3">
            <div className="bg-white p-2 rounded-xl shadow-sm mr-3">
              <Info className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Estructura Requerida</h3>
          </div>
          <p className="text-sm text-gray-500 font-medium mb-5 leading-relaxed">
            El archivo CSV debe contener la fila de encabezados exactos en el orden establecido para evitar errores de validación en el cargue masivo.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {expectedColumns.map((col, index) => (
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

            {/* Barra de estado visual REAL */}
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