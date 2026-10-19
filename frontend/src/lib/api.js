const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body, token, adminToken } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (adminToken) headers['x-admin-token'] = adminToken;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respons tanpa isi */
  }
  if (!res.ok) {
    throw new ApiError(data?.pesan || 'Terjadi kesalahan. Silakan coba lagi.', res.status, data);
  }
  return data;
}
