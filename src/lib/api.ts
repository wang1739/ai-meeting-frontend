import { useAuthStore } from '@/stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  return useAuthStore.getState().token;
}

function handleUnauthorized(): void {
  useAuthStore.getState().logout();
  // 避免在登录页自身触发 401 时重复跳转
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

interface ApiFetchOptions extends RequestInit {
  /** 不自动 JSON.stringify body */
  rawBody?: boolean;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { rawBody, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 非 GET 请求且未设置 rawBody 时，自动 JSON 序列化 body
  if (
    fetchOptions.body !== undefined &&
    !rawBody &&
    typeof fetchOptions.body === 'object'
  ) {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  console.log(`[API] ${fetchOptions.method || 'GET'} ${BASE_URL}${path}`);
  if (token) {
    console.log('[API] Authorization: Bearer <token>');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // 401 → 自动退出
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('登录已过期，请重新登录');
  }

  // 解析响应体
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = data?.message || `请求失败 (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
