import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpiamos el token simulando el cierre de sesión
    localStorage.removeItem('jwt_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 text-center">
        
        {/* Icono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-50 p-4 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        {/* Mensaje de bienvenida */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Ingreso Exitoso!
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          El flujo de autenticación funciona correctamente. Esta es una vista temporal para garantizar el acceso.
        </p>
        
        {/* Botón de cerrar sesión */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-xl bg-gray-100 py-3 px-4 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors duration-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}