class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(method, url, body = null) {
  const token = localStorage.getItem('accessToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(url, config);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          headers['Authorization'] = `Bearer ${tokens.accessToken}`;
          const retryConfig = { method, headers };
          if (body) retryConfig.body = JSON.stringify(body);
          const retryResponse = await fetch(url, retryConfig);
          if (!retryResponse.ok) {
            const data = await retryResponse.json().catch(() => ({}));
            throw new ApiError(data.error || 'Request failed', retryResponse.status, data);
          }
          return retryResponse.json();
        }
      } catch (e) {
        if (e instanceof ApiError) throw e;
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new ApiError('Session expired', 401);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status, data);
  }
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  delete: (url) => request('DELETE', url)
};

export { ApiError };
