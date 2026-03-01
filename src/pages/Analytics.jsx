import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { getStats, getBudgets, getExpenses } from '../utils/api';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [budgets, setBudgets] = useState([]);

    // Monthly Report State
    const [showReport, setShowReport] = useState(false);
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [reportData, setReportData] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);

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

    const generateReport = async () => {
        setGeneratingReport(true);
        try {
            const res = await getExpenses();
            const allExpenses = res.data;

            // Filter by selected month
            const [year, month] = reportMonth.split('-');
            const filtered = allExpenses.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
            });

            // Calculate aggregations
            const total = filtered.reduce((sum, e) => sum + e.amount, 0);
            const byCategory = {};
            const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };

            filtered.forEach(e => {
                // Category
                byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;

                // Time of Day
                const hour = new Date(e.date).getHours();
                if (hour >= 5 && hour < 12) timeOfDay.Morning += e.amount;
                else if (hour >= 12 && hour < 17) timeOfDay.Afternoon += e.amount;
                else if (hour >= 17 && hour < 21) timeOfDay.Evening += e.amount;
                else timeOfDay.Night += e.amount;
            });

            setReportData({
                total,
                count: filtered.length,
                byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
                timeOfDay: Object.entries(timeOfDay).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1])
            });
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report');
        } finally {
            setGeneratingReport(false);
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
                <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h1>Analytics</h1>
                    <button className="btn-primary" onClick={() => setShowReport(true)}>
                        📄 Generate Monthly Report
                    </button>
                </div>

                {/* Monthly Report Modal */}
                {showReport && (
                    <div className="mobile-menu-overlay" onClick={() => setShowReport(false)} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2>Monthly Spending Report</h2>
                                <button className="close-btn" onClick={() => setShowReport(false)}>✕</button>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Select Month</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="month"
                                        value={reportMonth}
                                        onChange={e => setReportMonth(e.target.value)}
                                        max={new Date().toISOString().slice(0, 7)}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="btn-primary" onClick={generateReport} disabled={generatingReport}>
                                        {generatingReport ? 'Generating...' : 'Run'}
                                    </button>
                                </div>
                            </div>

                            {reportData && (
                                <div className="report-results" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Spent in {new Date(reportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(reportData.total)}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Across {reportData.count} transactions</div>
                                    </div>

                                    {reportData.count > 0 ? (
                                        <>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Category Breakdown</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {reportData.byCategory.map(([cat, amt]) => (
                                                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
                                                        <span>{cat}</span>
                                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(amt)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: '1.5rem' }}>When Do You Spend? (Time of Day)</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {reportData.timeOfDay.map(([time, amt]) => (
                                                    <div key={time} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem' }}>
                                                        <span>
                                                            {time === 'Morning' && '🌅 Morning (5AM - 12PM)'}
                                                            {time === 'Afternoon' && '☀️ Afternoon (12PM - 5PM)'}
                                                            {time === 'Evening' && '🌆 Evening (5PM - 9PM)'}
                                                            {time === 'Night' && '🌙 Night (9PM - 5AM)'}
                                                        </span>
                                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(amt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No expenses found for this month.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
