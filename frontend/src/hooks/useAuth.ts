import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { apiClient, authStorage, ApiError } from '../api/client';
import { getRequestLanguage, translateAppMessage } from '../i18n/config';
import { AuthResponse, StudentStatus, User } from '../types';

interface UseAuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginWithTelegram: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  studentStatus?: StudentStatus;
}

export function useAuth(): UseAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const telegramTriedRef = useRef(false);

  const refreshProfile = useCallback(async () => {
    const profile = await apiClient.get<User>('/api/auth/me');
    setUser(profile);
    setToken(authStorage.getToken());
  }, []);

  const authenticateWithTelegram = useCallback(async () => {
    const initData = WebApp.initData || window.Telegram?.WebApp?.initData || '';
    if (!initData) {
      throw new Error(
        translateAppMessage(getRequestLanguage(), 'auth.telegramUnavailable'),
      );
    }

    const response = await apiClient.post<AuthResponse>('/api/auth/telegram', { initData });
    authStorage.setToken(response.accessToken);
    authStorage.setRefreshToken(response.refreshToken);
    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/credential-login', {
      email,
      password,
    });
    authStorage.setToken(response.accessToken);
    authStorage.setRefreshToken(response.refreshToken);
    setToken(response.accessToken);
    setUser(response.user);
    setError(null);
  }, []);

  const loginWithTelegram = useCallback(async () => {
    try {
      await authenticateWithTelegram();
      setError(null);
    } catch (cause) {
      if (cause instanceof ApiError || cause instanceof Error) {
        setError(cause.message);
      } else {
        setError(translateAppMessage(getRequestLanguage(), 'auth.unavailable'));
      }
    }
  }, [authenticateWithTelegram]);

  const logout = useCallback(() => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      void apiClient.post('/api/auth/logout', { refreshToken }).catch(() => undefined);
    }
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
        } else if (!telegramTriedRef.current && (WebApp.initData || window.Telegram?.WebApp?.initData)) {
          await authenticateWithTelegram();
          telegramTriedRef.current = true;
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (cause) {
        authStorage.clear();
        setUser(null);
        setToken(null);
        if (cause instanceof ApiError || cause instanceof Error) {
          setError(cause.message);
        } else {
          setError(translateAppMessage(getRequestLanguage(), 'auth.unavailable'));
        }
      } finally {
        telegramTriedRef.current = true;
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
      loginWithCredentials,
      loginWithTelegram,
      logout,
      isAuthenticated: Boolean(user && token),
      studentStatus: user?.studentProfile?.status,
    }),
    [error, isLoading, loginWithCredentials, loginWithTelegram, logout, refreshProfile, token, user],
  );
}
