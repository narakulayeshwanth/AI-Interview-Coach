const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const api = {
  get:    <T>(url: string)                         => request<T>(url),
  post:   <T>(url: string, body: unknown)          => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown)          => request<T>(url, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: <T>(url: string)                         => request<T>(url, { method: 'DELETE' }),

  upload: async <T>(url: string, formData: FormData): Promise<T> => {
    const token = getToken();
    const res = await fetch(`${BASE}${url}`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};
