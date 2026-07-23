import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Loader2, ShieldCheck } from 'lucide-react';
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
    // Fondo general ligeramente gris para que la tarjeta blanca resalte
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4 font-sans">
      
      {/* Tarjeta principal unificada */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-8 sm:p-10">
        
        {/* Encabezado dentro de la tarjeta */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gray-900 p-3 rounded-2xl mb-4 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Acceso al Sistema
          </h2>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Ingresa tus credenciales para administrar los datos
          </p>
        </div>

        {/* Formulario */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Input Usuario */}
          <div className="space-y-1.5">
            <label htmlFor="login" className="block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 sm:text-sm"
                placeholder="ej. jperez"
              />
            </div>
          </div>

          {/* Input Contraseña */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Botón */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center rounded-xl bg-gray-900 py-3 px-4 text-sm font-semibold text-white shadow-md hover:bg-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Validando credenciales...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}