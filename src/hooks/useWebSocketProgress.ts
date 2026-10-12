import { useState, useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL } from '../config';

interface ProgressData {
  porcentaje: number;
  mensaje: string;
}

interface UseWebSocketOptions {
  topic: string | null; // Si es null, el socket no se conecta (útil para activarlo bajo demanda)
  onMessage?: (data: ProgressData) => void;
  onComplete?: () => void;
  onError?: (mensajeError: string) => void;
}

export function useWebSocketProgress({ topic, onMessage, onComplete, onError }: UseWebSocketOptions) {
  const [progreso, setProgreso] = useState<ProgressData>({ porcentaje: 0, mensaje: '' });
  const clientRef = useRef<Client | null>(null);

  // Guardamos las referencias de los callbacks para evitar reconexiones si las funciones cambian
  const callbacksRef = useRef({ onMessage, onComplete, onError });
  
  useEffect(() => {
    callbacksRef.current = { onMessage, onComplete, onError };
  }, [onMessage, onComplete, onError]);

  useEffect(() => {
    // Si no hay un topic definido, no iniciamos la conexión
    if (!topic) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`📡 Conectado y suscrito a: ${topic}`);
        
        client.subscribe(topic, (message: IMessage) => {
          const data: ProgressData = JSON.parse(message.body);

          // 1. Actualizar el estado interno del hook
          if (data.porcentaje !== -1) {
            setProgreso(data);
          } else {
            // Si el backend envía -1, significa que no actualizamos la barra, solo el mensaje
            setProgreso((prev) => ({ ...prev, mensaje: data.mensaje }));
          }

          // 2. Ejecutar callbacks opcionales
          if (callbacksRef.current.onMessage) {
            callbacksRef.current.onMessage(data);
          }

          if (data.porcentaje === 100) {
            if (callbacksRef.current.onComplete) callbacksRef.current.onComplete();
          } 
          // Detectar errores enviados desde el backend (por convención les pusiste 'ERROR' o 'ERROR CRÍTICO')
          else if (data.porcentaje === 0 && data.mensaje.includes('ERROR')) {
            const cleanError = data.mensaje.replace('ERROR CRÍTICO: ', '').replace('ERROR: ', '');
            if (callbacksRef.current.onError) callbacksRef.current.onError(cleanError);
          }
        });
      },
      onStompError: (frame) => {
        console.error('❌ Error STOMP:', frame.headers['message']);
      }
    });

    client.activate();
    clientRef.current = client;

    // Cleanup: Desconectar al desmontar o al cambiar de topic
    return () => {
      client.deactivate();
      console.log(`🔌 Desconectado de: ${topic}`);
    };
  }, [topic]); // El hook solo se re-ejecuta si el topic (URL) cambia

  return { progreso, setProgreso };
}