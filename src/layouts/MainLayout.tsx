import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const secciones = [
  {
    titulo: 'Datos',
    items: [
      { path: '/', label: 'Panel general' },
      { path: '/importar', label: 'Importaciones' },
      { path: '/visor', label: 'Visor de facturas' },
    ],
  },
  {
    titulo: 'Parametrización',
    items: [
      { path: '/aprovechadores', label: 'Aprovechadores' },
      { path: '/tarifas', label: 'Gestión de tarifas' },
      { path: '/tasas-interes', label: 'Tasas de interés' },
    ],
  },
  {
    titulo: 'Cálculo',
    items: [
      { path: '/reliquidacion', label: 'Reliquidación' },
      { path: '/consolidados', label: 'Consolidados' },
    ],
  },
  {
    titulo: 'Reportes',
    items: [
      { path: '/reportes', label: 'Reportes' },
    ],
  },
];

const titulos: Record<string, string> = Object.fromEntries(
  secciones.flatMap((s) => s.items.map((i) => [i.path, i.label]))
);

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-fondo flex text-slate-800">
      {/* Barra lateral */}
      <aside className="w-64 shrink-0 bg-petroleo-900 text-petroleo-100 flex flex-col justify-between">
        <div>
          <div className="px-7 pt-8 pb-7 border-b border-white/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-verde-300">Reliquidación de</p>
            <p className="text-lg font-bold text-white leading-tight">Devoluciones</p>
            <div className="mt-3 h-1 w-10 rounded-full bg-verde-400" />
          </div>

          <nav className="px-4 py-6 space-y-6">
            {secciones.map((seccion) => (
              <div key={seccion.titulo}>
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-petroleo-300/70">
                  {seccion.titulo}
                </p>
                <div className="space-y-1">
                  {seccion.items.map((item) => {
                    const activo = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block rounded-lg px-3 py-2.5 text-sm transition-colors border-l-[3px] ${
                          activo
                            ? 'bg-white/10 text-white font-semibold border-verde-400'
                            : 'border-transparent text-petroleo-200 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-petroleo-200 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 shrink-0 bg-white border-b border-borde flex items-center justify-between px-10">
          <p className="text-sm font-semibold text-petroleo-800">{titulos[location.pathname] ?? ''}</p>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-petroleo-900">Administrador</p>
              <p className="text-xs text-slate-400">Operaciones</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-petroleo-700 text-white text-xs font-bold flex items-center justify-center">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-10 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
