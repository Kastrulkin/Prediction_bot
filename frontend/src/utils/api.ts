import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Events API
export const eventsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/events', { params }),
  getById: (id: number) => api.get(`/events/${id}`),
  create: (data: { title: string; description?: string; category?: string; end_date: string }) =>
    api.post('/events', data),
  resolve: (id: number, outcome: 'yes' | 'no') =>
    api.post(`/events/${id}/resolve`, { outcome }),
};

// Bets API
export const betsApi = {
  create: (data: { eventId: number; side: 'yes' | 'no'; amount: number; txHash?: string }) =>
    api.post('/bets', data),
  getUserBets: (userId: number, params?: { eventId?: number; status?: string }) =>
    api.get(`/bets/user/${userId}`, { params }),
};

