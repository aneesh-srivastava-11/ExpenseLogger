import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { getStats, getBudgets } from '../utils/api';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [budgets, setBudgets] = useState([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [statsRes, budgetsRes] = await Promise.all([
                getStats(),
                getBudgets(),
            ]);

            setStats(statsRes.data);
            setBudgets(budgetsRes.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    };

    if (!stats) {
        return (
            <div className="app">
                <Navigation />
                <div className="main-content">
                    <div className="loading-container" style={{ minHeight: '400px' }}>
                        <div className="spinner"></div>
                        <p>Loading analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    const categoryData = Object.entries(stats.byCategory).map(([name, value]) => ({
        name,
        value,
    }));

    const typeData = [
        { name: 'Cash', value: stats.byType.cash },
        { name: 'Online', value: stats.byType.online },
    ];

    const COLORS = ['#10a37f', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

    return (
        <div className="app">
            <Navigation />

            <div className="main-content">
                <h1>Analytics</h1>

                {/* Summary Stats */}
                <div className="stats-cards">
                    <div className="stat-card">
                        <div className="stat-label">Avg Daily Spending</div>
                        <div className="stat-value">{formatCurrency(stats.prediction.avgDaily)}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Predicted Next Month</div>
                        <div className="stat-value">{formatCurrency(stats.prediction.nextMonth)}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Total Categories</div>
                        <div className="stat-value">{Object.keys(stats.byCategory).length}</div>
                    </div>
                </div>

                {/* Spending Trends */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h2>Spending Trends (Last 30 Days)</h2>
                    {stats.trends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="amount" stroke="#10a37f" strokeWidth={2} name="Spending" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="empty-state">No trend data available</p>
                    )}
                </div>

                {/* Category Breakdown */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h2>Spending by Category</h2>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="empty-state">No category data available</p>
                    )}
                </div>

                {/* Cash vs Online */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h2>Cash vs Online Spending</h2>
                    {typeData.some(d => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    <Cell fill="#10a37f" />
                                    <Cell fill="#60a5fa" />
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="empty-state">No payment type data available</p>
                    )}
                </div>

                {/* Budget Progress */}
                {budgets.length > 0 && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                        <h2>Budget Progress</h2>
                        {budgets.map((budget) => {
                            const spent = stats.byCategory[budget.category] || 0;
                            const percentage = Math.min((spent / budget.limitAmount) * 100, 100);

                            return (
                                <div key={budget.id} style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {budget.category} ({budget.period})
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {formatCurrency(spent)} / {formatCurrency(budget.limitAmount)}
                                        </span>
                                    </div>
                                    <div style={{ background: 'var(--bg-tertiary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                background: percentage >= 100 ? 'var(--error)' : percentage >= 90 ? 'var(--warning)' : 'var(--accent)',
                                                transition: 'width 0.3s ease'
                                            }}
                                        />
                                    </div>
                                    <div style={{ textAlign: 'right', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {percentage.toFixed(1)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
