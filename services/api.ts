import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { handleApiError, ApiError } from '../utils/errorHandler';

const API_URL = 'https://imobix-backend.onrender.com/api';

const TOKEN_KEY = '@imobix_token';

export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export async function setToken(token: string) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to set token', e);
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to remove token', e);
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit & { suppressToast?: boolean, customErrorMessage?: string } = {}) {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new ApiError('Resposta inválida do servidor', response.status);
    }

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'Ocorreu um erro na solicitação.', response.status, data);
    }

    return data.data !== undefined ? data.data : data;
  } catch (error) {
    handleApiError(error, options.customErrorMessage, options.suppressToast);
    throw error;
  }
}

export const api = {
  login: async (credentials: any, options?: { suppressToast?: boolean, customErrorMessage?: string }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      let data;
      try { data = await response.json(); } catch(e) { throw new ApiError('Resposta inválida', response.status); }
      if (!response.ok) throw new ApiError(data.error || 'Erro no login', response.status, data);
      return data.data !== undefined ? data.data : data;
    } catch (error) {
      handleApiError(error, options?.customErrorMessage, options?.suppressToast);
      throw error;
    }
  },

  register: async (userData: any, options?: { suppressToast?: boolean, customErrorMessage?: string }) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      let data;
      try { data = await response.json(); } catch(e) { throw new ApiError('Resposta inválida', response.status); }
      if (!response.ok) throw new ApiError(data.error || 'Erro no cadastro', response.status, data);
      return data.data !== undefined ? data.data : data;
    } catch (error) {
      handleApiError(error, options?.customErrorMessage, options?.suppressToast);
      throw error;
    }
  },

  getProperties: () => fetchWithAuth('/properties', { method: 'GET' }),
  getPropertyById: (id: string | number) => fetchWithAuth(`/properties/${id}`, { method: 'GET' }),
  createProperty: (propertyData: any) => fetchWithAuth('/properties', { method: 'POST', body: JSON.stringify(propertyData) }),
  updateProperty: (id: string | number, propertyData: any) => fetchWithAuth(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(propertyData) }),
  deleteProperty: (id: string | number) => fetchWithAuth(`/properties/${id}`, { method: 'DELETE' }),

  getMe: () => fetchWithAuth('/me', { method: 'GET', suppressToast: true }),

  uploadAvatar: async (fileBlob: Blob, filename: string) => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('avatar', fileBlob, filename);
    const response = await fetch(`${API_URL}/me/avatar`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao enviar avatar');
    return data.data !== undefined ? data.data : data;
  },

  createExpense: (expenseData: any) => fetchWithAuth('/expenses', { method: 'POST', body: JSON.stringify(expenseData) }),
  createIncome: (incomeData: any) => fetchWithAuth('/incomes', { method: 'POST', body: JSON.stringify(incomeData) }),
};
