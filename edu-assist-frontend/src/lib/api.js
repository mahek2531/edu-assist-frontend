const rawApiBase = import.meta.env.VITE_API_BASE?.trim() || 'http://localhost:8080';

export const API_BASE = rawApiBase.replace(/\/+$/, '');
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';

export const buildApiUrl = (path = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

export const buildAssetUrl = (fileName = '') => {
  if (!fileName || !String(fileName).trim()) {
    return 'https://via.placeholder.com/100';
  }

  const value = String(fileName).trim();

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const cleanFileName = value
    .replace(/^\/+/, '')
    .replace(/^images\/+/, '');

  return `${API_BASE}/images/${cleanFileName}`;
};
