import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';

// Componente temporal para el Dashboard
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Bienvenido al Sistema</h1>
    <p>Si ves esto, es porque tienes un Token JWT válido.</p>
    <button 
      onClick={() => { localStorage.removeItem('jwt_token'); window.location.href = '/login'; }}
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
    >
      Cerrar Sesión
    </button>
  </div>
);

// Guardián de Rutas: Verifica si hay token en el localStorage
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('jwt_token');
  
  // Si no hay token, lo mandamos al login inmediatamente
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Configuración de las rutas
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  }
]);