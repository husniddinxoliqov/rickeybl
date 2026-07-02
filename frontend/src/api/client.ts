import { getRequestLanguage, translateAppMessage } from '../i18n/config';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'samdu_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'samdu_refresh_token';

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const buildUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const buildHeaders = (headers?: HeadersInit) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return {
    'Content-Type': 'application/json',
    'Accept-Language': getRequestLanguage(),
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(headers ?? {}),
  };
};

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(buildUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': getRequestLanguage(),
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    return false;
  }

  const payload = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  localStorage.setItem(TOKEN_STORAGE_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, payload.refreshToken);
  return true;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response = await fetch(buildUrl(path), {
    ...init,
    headers: buildHeaders(init.headers),
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await fetch(buildUrl(path), {
        ...init,
        headers: buildHeaders(init.headers),
      });
      const retriedJson = response.headers.get('content-type')?.includes('application/json');
      const retriedPayload = retriedJson ? await response.json() : null;
      if (response.ok) {
        return retriedPayload as T;
      }
      const retriedMessage = retriedPayload?.message
        ? Array.isArray(retriedPayload.message)
          ? retriedPayload.message.join(', ')
          : retriedPayload.message
        : translateAppMessage(getRequestLanguage(), 'api.requestFailed', {
            status: response.status,
          });
      throw new ApiError(retriedMessage, response.status, retriedPayload);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
    const message = payload?.message
      ? Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message
      : translateAppMessage(getRequestLanguage(), 'api.requestFailed', {
          status: response.status,
        });
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
};

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  },
};
