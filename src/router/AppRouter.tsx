import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Importar from '../pages/Importar';
import VisorFacturas from '../pages/VisorFacturas'; // <--- Importamos la nueva vista
import MainLayout from '../layouts/MainLayout';

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
    // Estas rutas hijas se renderizarán dentro del <Outlet /> del MainLayout
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
        path: 'visor', // <--- Nuestra nueva ruta
        element: <VisorFacturas />,
      }
    ]
  }
]);