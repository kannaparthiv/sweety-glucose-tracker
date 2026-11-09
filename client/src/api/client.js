const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sweety_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Readings
  getReadings: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    return request(`/readings${queryString ? `?${queryString}` : ''}`);
  },
  createReading: (payload) => request('/readings', { method: 'POST', body: JSON.stringify(payload) }),
  updateReading: (id, payload) => request(`/readings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReading: (id) => request(`/readings/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (date) => {
    const param = date ? `?date=${encodeURIComponent(date)}` : '';
    return request(`/reports${param}`);
  },
};
