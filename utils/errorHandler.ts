import Toast from 'react-native-toast-message';

export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const handleApiError = (error: any, customMessage?: string, suppressToast: boolean = false) => {
  let message = 'Ocorreu um erro inesperado';

  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
      case 403:
        message = 'Sessão expirada. Faça login novamente';
        break;
      case 500:
        message = 'Erro interno. Tente novamente mais tarde';
        break;
      default:
        message = error.message || message;
    }
  } else if (error.message && (error.message.includes('Network') || error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))) {
    message = 'Sem conexão com a internet';
  } else if (error.message) {
    message = error.message;
  }

  if (customMessage) {
    message = customMessage;
  }

  console.error('[API Error]:', error);

  if (!suppressToast) {
    Toast.show({
      type: 'error',
      text1: 'Algo deu errado!',
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
    });
  }

  return message;
};
