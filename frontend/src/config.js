// Dynamic API URL falling back to local port 5000 in development
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
