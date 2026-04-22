import { useState, useCallback } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  const login = useCallback(
    (email: string, _password: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock: qualquer email/senha válidos fazem login
          setAuthState({
            isAuthenticated: true,
            user: {
              name: email.split('@')[0],
              email,
            },
          });
          resolve(true);
        }, 1200);
      });
    },
    []
  );

  const logout = useCallback(() => {
    setAuthState({ isAuthenticated: false, user: null });
  }, []);

  return {
    ...authState,
    login,
    logout,
  };
}
