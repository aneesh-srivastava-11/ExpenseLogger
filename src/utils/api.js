import axios from 'axios';
import { auth } from '../config/firebase.js';

const api = axios.create({
    baseURL: '/api',
});

// Add token to all requests
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.post('/profile', data);

// Balance
export const getBalance = () => api.get('/balance');
export const updateBalance = (data) => api.post('/balance', data);

// Expenses
export const addExpense = (data) => api.post('/expense', data);
export const getExpenses = (params) => api.get('/expenses', { params });
export const updateExpense = (id, data) => api.put(`/expense/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expense/${id}`);

// Analytics
export const getStats = () => api.get('/stats');
export const checkBudgets = () => api.get('/stats/budget/check');

// Budgets
export const getBudgets = () => api.get('/budgets');
export const saveBudget = (data) => api.post('/budgets', data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

// Recurring
export const getRecurring = () => api.get('/recurring');
export const createRecurring = (data) => api.post('/recurring', data);
export const deleteRecurring = (id) => api.delete(`/recurring/${id}`);
export const applyRecurring = () => api.post('/recurring/apply');

export default api;
