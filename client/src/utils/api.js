class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(method, url, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(url, config);
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
