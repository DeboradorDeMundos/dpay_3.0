/**
 * Cliente API para D-PAY
 *
 * Metro / debug (__DEV__): todo en proqa (login + Hub deben ser el mismo entorno).
 * Release APK: producción (pro.dtemite.cl).
 */
export const API_BASE_URL = __DEV__
  ? 'https://proqa.dtemite.cl/api'
  : 'https://pro.dtemite.cl/api';
export const PAYMENT_HUB_API_BASE_URL = API_BASE_URL;

/** Hub / APIs de integración en entorno QA (activo solo con proqa/prodev/sandbox) */
export const IS_QA_API =
  PAYMENT_HUB_API_BASE_URL.includes('proqa') ||
  PAYMENT_HUB_API_BASE_URL.includes('prodev') ||
  PAYMENT_HUB_API_BASE_URL.includes('sandbox');

/**
 * App TUU/Haulmer en el POS: siempre producción (com.haulmer.paymentapp).
 * Metro sigue en proqa; solo el cobro con tarjeta usa TUU prod (no .dev).
 */
export const IS_TUU_DEV = false;

const API_DEBUG = false;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

interface ApiOptions extends RequestInit {
  requiresAuth?: boolean;
  baseUrl?: string;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const { requiresAuth = true, baseUrl = API_BASE_URL, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (requiresAuth && authToken) {
    headers['Authorization'] = `bearer ${authToken}`;
    headers['X-DPay-Token'] = authToken;
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
  };

  const url = `${baseUrl}${endpoint}`;
  if (API_DEBUG) {
    console.log('[API] Request:', {
      url,
      method: config.method || 'GET',
      body: config.body,
      headers: { ...headers, Authorization: headers.Authorization ? '***' : undefined },
    });
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response;
  } catch (error) {
    if (API_DEBUG) {
      console.log('[API] Error:', error);
    }
    throw error;
  }
};
