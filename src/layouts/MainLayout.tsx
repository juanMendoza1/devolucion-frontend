import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
// Agregamos el icono 'Calculator' para el nuevo módulo de Reliquidación
import { LayoutDashboard, UploadCloud, LogOut, User, Users, Command, Search, Calculator } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    navigate('/login');
  };

  // Agregamos el nuevo botón a la lista del menú
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/importar', icon: UploadCloud, label: 'Importaciones' },
    { path: '/visor', icon: Search, label: 'Visor de Facturas' },
    { path: '/tarifas', icon: Users, label: 'Gestión de Tarifas' },
    { path: '/reliquidacion', icon: Calculator, label: 'Reliquidación' }, // <--- Nuevo botón integrado
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-gray-900">
      
      {/* Sidebar Minimalista Blanco */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between z-10">
        <div>
          {/* Logo / Marca */}
          <div className="h-24 flex items-center px-8">
            <div className="bg-gray-900 p-2 rounded-xl mr-3 shadow-md">
              <Command className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-gray-900">
              Motor Reliquidación
            </span>
          </div>
          
          {/* Navegación */}
          <nav className="px-4 space-y-2 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-gray-900 border border-gray-50' 
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Acciones inferiores */}
        <div className="p-4 mb-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-3.5 text-sm font-medium text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all duration-300"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header Superior Flotante y Limpio */}
        <header className="h-24 flex items-center justify-end px-10">
          <div className="flex items-center space-x-4 cursor-pointer group">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Administrador</p>
              <p className="text-xs font-medium text-gray-400">Operaciones</p>
            </div>
            {/* Avatar Minimalista */}
            <div className="h-12 w-12 rounded-2xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.05)] flex items-center justify-center border border-gray-100 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </header>

        {/* Vistas Dinámicas */}
        <div className="flex-1 overflow-auto px-10 pb-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}