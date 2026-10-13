import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Importar from '../pages/Importar';
import VisorFacturas from '../pages/VisorFacturas';
import MainLayout from '../layouts/MainLayout';
import ModuloTarifas from '../pages/Tarifas/ModuloTarifas';
import { ModuloReliquidacion } from '../pages/Reliquidacion/ModuloReliquidacion';
import ModuloConsolidados from '../pages/Consolidados/ModuloConsolidados';
import ModuloTasas from '../pages/Tasas/ModuloTasas';
import ModuloAprovechadores from '../pages/Aprovechadores/ModuloAprovechadores';
import ModuloReportes from '../pages/Reportes/ModuloReportes';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),    
    children: [
      {
        index: true, 
        element: <Dashboard />,
      },
      {
        path: 'importar', 
        element: <Importar />,
      },
      {
        path: 'visor', 
        element: <VisorFacturas />,
      },
      {
        path: 'tarifas', 
        element: <ModuloTarifas />,
      },
      {
        path: 'reliquidacion', 
        element: <ModuloReliquidacion />,
      },
      {
        path :'consolidados',
        element: <ModuloConsolidados /> 
      },
      {
        path: 'tasas-interes', 
        element: <ModuloTasas />,
      },
      {
        path: 'aprovechadores',
        element: <ModuloAprovechadores />,
      },
      {
        path: 'reportes',
        element: <ModuloReportes />,
      }
    ]
  }
]);