import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get spending statistics
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;

        // Get all expenses
        const expensesSnapshot = await db
            .collection('users')
            .doc(uid)
            .collection('expenses')
            .orderBy('date', 'desc')
            .get();

        const expenses = expensesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Calculate statistics
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();
        const monthStart = new Date(now.setDate(1)).toISOString();

        const todayExpenses = expenses.filter(e => e.date >= todayStart);
        const weekExpenses = expenses.filter(e => e.date >= weekStart);
        const monthExpenses = expenses.filter(e => e.date >= monthStart);

        const stats = {
            today: {
                total: todayExpenses.reduce((sum, e) => sum + e.amount, 0),
                count: todayExpenses.length,
            },
            week: {
                total: weekExpenses.reduce((sum, e) => sum + e.amount, 0),
                count: weekExpenses.length,
            },
            month: {
                total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
                count: monthExpenses.length,
            },
            byCategory: {},
            byType: { cash: 0, online: 0 },
            trends: [],
        };

        // Category breakdown
        expenses.forEach(expense => {
            if (!stats.byCategory[expense.category]) {
                stats.byCategory[expense.category] = 0;
            }
            stats.byCategory[expense.category] += expense.amount;
            stats.byType[expense.type] += expense.amount;
        });

        // Generate trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);

        const dailyTotals = {};
        recentExpenses.forEach(exp => {
            const date = exp.date.split('T')[0];
            dailyTotals[date] = (dailyTotals[date] || 0) + exp.amount;
        });

        stats.trends = Object.entries(dailyTotals).map(([date, amount]) => ({
            date,
            amount,
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Simple prediction (average daily spending * 30)
        const avgDaily = stats.month.total / 30;
        stats.prediction = {
            nextMonth: Math.round(avgDaily * 30),
            avgDaily: Math.round(avgDaily),
        };

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Check budget alerts
router.get('/budget/check', async (req, res) => {
    try {
        const { uid } = req.user;

        // Get budgets
        const budgetsSnapshot = await db
            .collection('users')
            .doc(uid)
            .collection('budgets')
            .get();

        const budgets = budgetsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Get expenses
        const expensesSnapshot = await db
            .collection('users')
            .doc(uid)
            .collection('expenses')
            .get();

        const expenses = expensesSnapshot.docs.map(doc => doc.data());

        const alerts = [];
        const now = new Date();

        budgets.forEach(budget => {
            let periodStart;

            if (budget.period === 'daily') {
                periodStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            } else if (budget.period === 'weekly') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                periodStart = weekAgo.toISOString();
            } else if (budget.period === 'monthly') {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                periodStart = monthStart.toISOString();
            }

            const categoryExpenses = expenses.filter(
                e => e.category === budget.category && e.date >= periodStart
            );

            const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
            const percentage = (totalSpent / budget.limitAmount) * 100;

            if (percentage >= 90) {
                alerts.push({
                    category: budget.category,
                    period: budget.period,
                    limit: budget.limitAmount,
                    spent: totalSpent,
                    percentage: Math.round(percentage),
                    severity: percentage >= 100 ? 'danger' : 'warning',
                });
            }
        });

        res.json(alerts);
    } catch (error) {
        console.error('Check budget error:', error);
        res.status(500).json({ error: 'Failed to check budgets' });
    }
});

export default router;
