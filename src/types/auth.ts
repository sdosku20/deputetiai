// User type from backend
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'superadmin';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Token response from backend
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: User;
}

// Registration form data
export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  tenant_name?: string;
}

// Login form data
export interface LoginData {
  email: string;
  password: string;
}

// Auth context state
export interface AuthState {
  user: User | null | undefined;  // undefined = still checking auth, null = not authenticated
  loading: boolean;
  error: string | null;
}

// Auth context methods
export interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

// API Error response
export interface ApiError {
  detail: string;
}
