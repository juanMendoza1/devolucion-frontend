import axios from 'axios';

// 1. Creamos la instancia base
export const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Asegúrate de que coincida con tu Spring Boot
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor de Peticiones (Request)
api.interceptors.request.use(
  (config) => {
    // Buscamos el token antes de que la petición salga
    const token = localStorage.getItem('jwt_token');
    
    // Si existe, lo adjuntamos a los headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Interceptor de Respuestas (Response)
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, la dejamos pasar normal
    return response;
  },
  (error) => {
    // Si el backend nos responde con un 401 (Unauthorized)
    if (error.response?.status === 401) {
      console.warn('Sesión expirada o token inválido. Redirigiendo al login...');
      
      // Limpiamos el token inválido
      localStorage.removeItem('jwt_token');
      
      // Redirigimos forzosamente al login
      // Usamos window.location para evitar problemas de contexto con React Router aquí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);