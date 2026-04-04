import axios, { isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AppError, ProblemDetail } from '@/types/errors';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Retry interceptor: 3 retries with exponential backoff on 5xx ---

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 300;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

client.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryConfig | undefined;
  if (!config) return Promise.reject(error);

  const status = error.response?.status ?? 0;
  const retryCount = config._retryCount ?? 0;

  if (status >= 500 && retryCount < MAX_RETRIES) {
    config._retryCount = retryCount + 1;
    const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return client.request(config);
  }

  return Promise.reject(error);
});

// --- Request deduplication via AbortController ---

const inflightRequests = new Map<string, AbortController>();

function getRequestKey(config: InternalAxiosRequestConfig): string {
  return `${config.method}:${config.url}`;
}

client.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const key = getRequestKey(config);
    const existing = inflightRequests.get(key);
    if (existing) {
      existing.abort();
    }
    const controller = new AbortController();
    config.signal = controller.signal;
    inflightRequests.set(key, controller);
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    const key = getRequestKey(response.config);
    inflightRequests.delete(key);
    return response;
  },
  (error: AxiosError) => {
    if (error.config) {
      const key = getRequestKey(error.config as InternalAxiosRequestConfig);
      inflightRequests.delete(key);
    }
    return Promise.reject(error);
  },
);

// --- Error normalization ---

export function normalizeError(error: unknown): AppError {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data as ProblemDetail | undefined;
    return {
      status: error.response.status,
      title: data?.title ?? 'Error',
      detail: data?.detail ?? error.message,
      violations: data?.violations ?? [],
    };
  }
  return {
    status: 0,
    title: 'Network Error',
    detail: error instanceof Error ? error.message : 'An unexpected error occurred',
    violations: [],
  };
}

export { isAxiosError };
export default client;
