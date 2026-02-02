import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticate } from './middleware/auth.js';
import profileRoutes from './routes/profile.js';
import balanceRoutes from './routes/balance.js';
import expensesRoutes from './routes/expenses.js';
import analyticsRoutes from './routes/analytics.js';
import budgetsRoutes from './routes/budgets.js';
import recurringRoutes from './routes/recurring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static files (for production)
app.use(express.static('dist'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Expense Logger API is running' });
});

// Protected routes
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/balance', authenticate, balanceRoutes);
app.use('/api/expense', authenticate, expensesRoutes);
app.use('/api/expenses', authenticate, expensesRoutes);
app.use('/api/stats', authenticate, analyticsRoutes);
app.use('/api/budgets', authenticate, budgetsRoutes);
app.use('/api/recurring', authenticate, recurringRoutes);

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        code: '500',
        message: 'A server error has occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'dist' });
});

// Only start server if not in Vercel (local development)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
export default app;
