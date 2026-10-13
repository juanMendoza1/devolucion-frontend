import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { uploadImportacionCSV } from '../api/facturas';
import { useWebSocketProgress } from '../hooks/useWebSocketProgress';
import { resetFactoryTarifas } from '../api/tarifas';

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
  
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Función de limpieza global
  const finalizarImportacion = () => {
    setSelectedFile(null);
    setProgreso({ porcentaje: 0, mensaje: '' });
    setActiveTopic(null);
    setNovedad('');
    setVersion('');
  };

  const { progreso, setProgreso } = useWebSocketProgress({
    topic: activeTopic,
    onMessage: (data) => {
      // REFUERZO: Si llega el 100%, forzamos el éxito
      if (data.porcentaje === 100) {
        toast.success('¡Archivo procesado e importado con éxito!');
        setTimeout(finalizarImportacion, 2000);
      }
    },
    onComplete: () => {
      // Se mantiene por si el hook lo lanza nativamente
      toast.success('¡Archivo procesado e importado con éxito!');
      setTimeout(finalizarImportacion, 2000);
    },
    onError: (msg) => {
      toast.error(msg, { duration: 6000 });
      finalizarImportacion();
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgreso({ porcentaje: 0, mensaje: 'Conectando con el servidor...' });
      const data = await uploadImportacionCSV(file, importType, novedad, version);
      return data.jobId; 
    },
    onSuccess: (jobId) => {
      setActiveTopic(`/topic/import-progress/${jobId}`);
    },
    onError: () => {
      toast.error('Ocurrió un error al contactar al servidor');
      finalizarImportacion();
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
    <div className="max-w-5xl pb-12">
      <div className="page-header">
        <div>
          <p className="page-kicker">Datos</p>
          <h1 className="page-title">Importaciones</h1>
          <p className="page-subtitle">
            Cargue archivos CSV para alimentar las bases de datos del sistema.
          </p>
        </div>
      </div>

      {/* TARJETA PRINCIPAL DE IMPORTACIÓN */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-base font-semibold">Nueva importación</h2>
          {isBusy && <span className="badge-info gap-1.5"><span className="spinner h-3 w-3" /> En proceso</span>}
        </div>

        <div className="card-body space-y-8">
          <div>
            <label className="label" htmlFor="tipo-importacion">
              Tipo de información
            </label>
            <select
              id="tipo-importacion"
              value={importType}
              onChange={(e) => {
                setImportType(e.target.value as ImportTypeKey);
                setSelectedFile(null);
                setNovedad('');
                setVersion('');
              }}
              disabled={isBusy}
              className="input max-w-md cursor-pointer disabled:opacity-50"
            >
              {Object.entries(IMPORT_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-500 mt-2">
              {currentConfig.description}
            </p>

            {importType === 'BASE_TARIFAS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="label" htmlFor="novedad">Nombre de la novedad <span className="text-red-600">*</span></label>
                  <input
                    id="novedad"
                    type="text"
                    placeholder="Ej: Ajuste IPC 2026"
                    value={novedad}
                    onChange={(e) => setNovedad(e.target.value)}
                    disabled={isBusy}
                    className="input disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="version">Versión <span className="text-red-600">*</span></label>
                  <input
                    id="version"
                    type="text"
                    placeholder="Ej: V.1.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    disabled={isBusy}
                    className="input disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-petroleo-50/60 border border-petroleo-100 p-5">
            <h3 className="text-sm font-semibold text-petroleo-900">Columnas requeridas</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              El archivo CSV debe contener exactamente estas columnas en la primera fila.
            </p>
            <div className="flex flex-wrap gap-2">
              {currentConfig.columns.map((col, index) => (
                <span key={index} className="px-2.5 py-1 bg-white text-petroleo-800 text-xs font-medium rounded-md border border-borde font-mono">
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="border-2 border-dashed border-petroleo-200 rounded-xl px-6 py-10 flex flex-col items-center justify-center text-center bg-white hover:bg-petroleo-50/40 transition-colors">
            <p className="text-sm font-semibold text-petroleo-900">Seleccione el archivo a importar</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Formato admitido: CSV</p>
            <label className={`btn-primary ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Examinar archivo CSV
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
            <div className="rounded-xl border border-borde bg-fondo p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="label mb-0.5">Archivo seleccionado</p>
                  <p className="text-sm font-semibold text-petroleo-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 tabular-nums">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isBusy}
                  className="btn-success"
                >
                  {isBusy ? (
                    <><span className="spinner" /> Procesando...</>
                  ) : (
                    'Confirmar importación'
                  )}
                </button>
              </div>

              {isBusy && (
                <div className="space-y-2 mt-5">
                  <div className="flex justify-between text-xs font-semibold text-petroleo-800">
                    <span>{progreso.mensaje || 'Conectando con el servidor...'}</span>
                    <span className="tabular-nums">{progreso.porcentaje}%</span>
                  </div>
                  <div className="h-2 w-full bg-petroleo-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-verde-500 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${Math.max(progreso.porcentaje, 5)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ZONA DE PELIGRO: RESET DE FÁBRICA */}
      <div className="mt-8 card border-red-200 border-l-4 border-l-red-500">
        <div className="card-body flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Zona de peligro</p>
            <h2 className="mt-1 text-base font-semibold">Restablecer sistema (reset de fábrica)</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Esta acción eliminará todas las tarifas, versiones, asignaciones y reliquidaciones calculadas.
              <strong className="text-red-700 ml-1">Las facturas originales y los aprovechadores no se verán afectados.</strong>
            </p>
          </div>
          <button
            disabled={isBusy}
            onClick={() => {
              toast((t) => (
                <div className="flex flex-col gap-2">
                  <p className="font-semibold text-sm text-petroleo-900">¿Está absolutamente seguro?</p>
                  <p className="text-xs text-slate-500">Esto vaciará las tablas de tarifas y cálculos.</p>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={async () => {
                        toast.dismiss(t.id);
                        const loadingToast = toast.loading('Reseteando sistema...');
                        try {
                          await resetFactoryTarifas();
                          toast.success('¡Sistema reseteado como nuevo!', { id: loadingToast });
                          setTimeout(() => window.location.reload(), 1500);
                        } catch (error: any) {
                          const msg = error?.response?.status === 403
                            ? 'Solo el administrador puede resetear el sistema.'
                            : error?.response?.data?.error || 'Error al resetear el sistema';
                          toast.error(msg, { id: loadingToast });
                        }
                      }}
                      className="btn-sm inline-flex items-center rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      Sí, purgar datos
                    </button>
                    <button 
                      onClick={() => toast.dismiss(t.id)}
                      className="btn-secondary btn-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ), { duration: Infinity, position: 'bottom-right' });
            }}
            className="btn-danger shrink-0"
          >
            Resetear sistema
          </button>
        </div>
      </div>
    </div>
  );
}
