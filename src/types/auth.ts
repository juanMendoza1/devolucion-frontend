export interface LoginCredentials {
  login: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  message: string;
}