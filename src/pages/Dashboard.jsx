import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useApp } from '../context/AppContext';
import { getStats, checkBudgets, addExpense, getExpenses, applyRecurring } from '../utils/api';
import { validateAmount, validateRequired } from '../utils/validation';

const Dashboard = () => {
    const { balance, refresh } = useApp();
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        type: 'cash',
        category: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDashboardData();
        checkPendingRecurring();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsRes, alertsRes, expensesRes] = await Promise.all([
                getStats(),
                checkBudgets(),
                getExpenses(),
            ]);

            setStats(statsRes.data);
            setAlerts(alertsRes.data);
            setRecentExpenses(expensesRes.data.slice(0, 10));
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    };

    const checkPendingRecurring = async () => {
        try {
            const response = await applyRecurring();
            if (response.data.applied.length > 0) {
                refresh();
                loadDashboardData();
            }
        } catch (error) {
            console.error('Failed to apply recurring:', error);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setError('');

        const amountError = validateAmount(formData.amount);
        const categoryError = validateRequired(formData.category, 'Category');

        if (amountError || categoryError) {
            setError(amountError || categoryError);
            return;
        }

        setLoading(true);

        try {
            await addExpense({
                ...formData,
                date: new Date().toISOString(),
            });

            setFormData({ amount: '', type: 'cash', category: '', description: '' });
            setShowAddForm(false);
            refresh();
            loadDashboardData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

    const isCashNegative = balance.cashAmount < 0;
    const isOnlineNegative = balance.onlineAmount < 0;

    return (
        <div className="app">
            <Navigation />

            <div className="main-content">
                <div className="dashboard">
                    <h1>Dashboard</h1>

                    {/* Balance Cards */}
                    <div className="balance-cards">
                        <div className={`balance-card ${isCashNegative ? 'negative' : ''}`}>
                            <div className="balance-label">Cash Balance</div>
                            <div className="balance-amount">
                                {formatCurrency(balance.cashAmount)}
                            </div>
                        </div>

                        <div className={`balance-card ${isOnlineNegative ? 'negative' : ''}`}>
                            <div className="balance-label">Online Balance</div>
                            <div className="balance-amount">
                                {formatCurrency(balance.onlineAmount)}
                            </div>
                        </div>

                        <div className="balance-card">
                            <div className="balance-label">Total Balance</div>
                            <div className={`balance-amount ${(balance.cashAmount + balance.onlineAmount) < 0 ? 'negative-text' : ''}`}>
                                {formatCurrency(balance.cashAmount + balance.onlineAmount)}
                            </div>
                        </div>
                    </div>

                    {/* Budget Alerts */}
                    {alerts.length > 0 && (
                        <div className="alerts-section">
                            <h2>⚠️ Budget Alerts</h2>
                            {alerts.map((alert, index) => (
                                <div key={index} className={`alert alert-${alert.severity}`}>
                                    <strong>{alert.category}</strong> - {alert.percentage}% of {alert.period} budget used
                                    ({formatCurrency(alert.spent)} / {formatCurrency(alert.limit)})
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Stats */}
                    {stats && (
                        <div className="stats-cards">
                            <div className="stat-card">
                                <div className="stat-label">Today's Spending</div>
                                <div className="stat-value">{formatCurrency(stats.today.total)}</div>
                                <div className="stat-detail">{stats.today.count} transactions</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-label">This Week</div>
                                <div className="stat-value">{formatCurrency(stats.week.total)}</div>
                                <div className="stat-detail">{stats.week.count} transactions</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-label">This Month</div>
                                <div className="stat-value">{formatCurrency(stats.month.total)}</div>
                                <div className="stat-detail">{stats.month.count} transactions</div>
                            </div>
                        </div>
                    )}

                    {/* Quick Add Expense */}
                    <div className="quick-add-section">
                        <button
                            className="btn-primary"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            {showAddForm ? '− Cancel' : '+ Add Expense'}
                        </button>

                        {showAddForm && (
                            <form className="add-expense-form" onSubmit={handleAddExpense}>
                                {error && <div className="error-message">{error}</div>}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Amount (max 10,000)</label>
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            min="0"
                                            max="10000"
                                            step="0.01"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Category</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="Food, Transport, etc."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Description (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Add details..."
                                    />
                                </div>

                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Adding...' : 'Add Expense'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Recent Expenses */}
                    <div className="recent-expenses">
                        <h2>Recent Expenses</h2>
                        {recentExpenses.length === 0 ? (
                            <p className="empty-state">No expenses yet. Add one above!</p>
                        ) : (
                            <div className="expense-list">
                                {recentExpenses.map((expense) => (
                                    <div key={expense.id} className="expense-item">
                                        <div className="expense-info">
                                            <div className="expense-category">{expense.category}</div>
                                            <div className="expense-description">{expense.description}</div>
                                            <div className="expense-date">{formatDate(expense.date)}</div>
                                        </div>
                                        <div className="expense-right">
                                            <div className="expense-amount">-{formatCurrency(expense.amount)}</div>
                                            <div className={`expense-type type-${expense.type}`}>
                                                {expense.type}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
