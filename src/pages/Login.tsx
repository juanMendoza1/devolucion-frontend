import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../api/axios';
import type { LoginCredentials, AuthResponse } from '../types/auth';

export default function Login() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('jwt_token', data.token);
      toast.success(data.message || 'Bienvenido al sistema');
      navigate('/');
    },
    onError: () => {
      toast.error('Credenciales incorrectas');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      toast.error('Por favor completa los campos');
      return;
    }
    loginMutation.mutate({ login, password });
  };

  return (
    <div className="min-h-screen flex bg-fondo">
      {/* Panel de marca */}
      <div className="hidden lg:flex w-[44%] max-w-xl bg-petroleo-900 text-petroleo-100 flex-col justify-between p-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-verde-300">Reliquidación de</p>
          <p className="text-3xl font-bold text-white leading-tight">Devoluciones</p>
          <div className="mt-4 h-1 w-14 rounded-full bg-verde-400" />
        </div>

        <div className="space-y-4 max-w-sm">
          <p className="text-xl font-semibold text-white leading-snug">
            Reliquidación de facturas y devoluciones del servicio de aseo.
          </p>
          <p className="text-sm text-petroleo-200 leading-relaxed">
            Importe datos, parametrice tarifas y tasas, y calcule consolidados desde un solo lugar.
          </p>
        </div>

        <p className="text-xs text-petroleo-300/70">Acceso restringido a personal autorizado.</p>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-verde-600">Reliquidación de</p>
            <p className="text-2xl font-bold text-petroleo-900">Devoluciones</p>
          </div>

          <div className="card shadow-elevada">
            <div className="card-body p-8 sm:p-10">
              <p className="page-kicker">Acceso</p>
              <h1 className="page-title">Iniciar sesión</h1>
              <p className="page-subtitle">Ingrese sus credenciales para administrar los datos.</p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="login" className="label">Usuario</label>
                  <input
                    id="login"
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="input"
                    placeholder="ej. jperez"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={loginMutation.isPending} className="btn-primary w-full py-3">
                    {loginMutation.isPending ? (
                      <>
                        <span className="spinner" />
                        Validando credenciales...
                      </>
                    ) : (
                      'Iniciar sesión'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
