import { useCallback, useEffect, useMemo, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { apiClient, authStorage, ApiError } from '../api/client';
import { AuthResponse, StudentStatus, User } from '../types';

interface UseAuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  studentStatus?: StudentStatus;
}

export function useAuth(): UseAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const profile = await apiClient.get<User>('/api/auth/me');
    setUser(profile);
    setToken(authStorage.getToken());
  }, []);

  const authenticateWithTelegram = useCallback(async () => {
    const initData = WebApp.initData || window.Telegram?.WebApp?.initData || '';
    if (!initData) {
      throw new Error('Telegram initData is unavailable. Open the mini-app inside Telegram.');
    }

    const response = await apiClient.post<AuthResponse>('/api/auth/telegram', { initData });
    authStorage.setToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const bootstrap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (authStorage.getToken()) {
          await refreshProfile();
        } else {
          await authenticateWithTelegram();
        }
      } catch (cause) {
        authStorage.clear();
        setUser(null);
        setToken(null);
        if (cause instanceof ApiError || cause instanceof Error) {
          setError(cause.message);
        } else {
          setError('Unable to authenticate right now.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [authenticateWithTelegram, refreshProfile]);

  return useMemo(
    () => ({
      user,
      token,
      isLoading,
      error,
      refreshProfile,
      logout,
      isAuthenticated: Boolean(user && token),
      studentStatus: user?.studentProfile?.status,
    }),
    [error, isLoading, logout, refreshProfile, token, user],
  );
}
