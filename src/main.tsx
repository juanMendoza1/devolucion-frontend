import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router/AppRouter';
import './index.css'; // Asegúrate de tener Tailwind configurado aquí

// Cliente para manejar el estado y caché de las peticiones al backend
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* Toaster muestra las notificaciones de éxito/error en la esquina */}
      <Toaster position="top-right" /> 
    </QueryClientProvider>
  </StrictMode>
);