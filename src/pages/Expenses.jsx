import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useApp } from '../context/AppContext';
import { getExpenses, updateExpense, deleteExpense } from '../utils/api';
import { validateAmount, validateRequired } from '../utils/validation';

const Expenses = () => {
    const { refresh } = useApp();
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadExpenses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [expenses, searchTerm, categoryFilter, startDate, endDate]);

    const loadExpenses = async () => {
        try {
            const response = await getExpenses();
            setExpenses(response.data);

            // Extract unique categories
            const uniqueCategories = [...new Set(response.data.map(e => e.category))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Failed to load expenses:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...expenses];

        // Search by description
        if (searchTerm) {
            filtered = filtered.filter(e =>
                e.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by category
        if (categoryFilter) {
            filtered = filtered.filter(e => e.category === categoryFilter);
        }

        // Filter by date range
        if (startDate) {
            filtered = filtered.filter(e => e.date >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(e => e.date <= endDate);
        }

        setFilteredExpenses(filtered);
    };

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setEditForm({ ...expense });
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
        setError('');
    };

    const handleSaveEdit = async () => {
        setError('');

        const amountError = validateAmount(editForm.amount);
        const categoryError = validateRequired(editForm.category, 'Category');

        if (amountError || categoryError) {
            setError(amountError || categoryError);
            return;
        }

        setLoading(true);

        try {
            await updateExpense(editingId, editForm);
            setEditingId(null);
            setEditForm({});
            refresh();
            loadExpenses();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update expense');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            await deleteExpense(id);
            refresh();
            loadExpenses();
        } catch (error) {
            alert('Failed to delete expense');
        }
    };

    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

    return (
        <div className="app">
            <Navigation />

            <div className="main-content">
                <h1>Expenses</h1>

                {/* Filters */}
                <div className="filters-section" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Search Description</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search expenses..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        className="btn-secondary"
                        onClick={() => {
                            setSearchTerm('');
                            setCategoryFilter('');
                            setStartDate('');
                            setEndDate('');
                        }}
                        style={{ marginTop: '1rem' }}
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Expenses List */}
                <div className="recent-expenses">
                    <h2>All Expenses ({filteredExpenses.length})</h2>

                    {error && <div className="error-message">{error}</div>}

                    {filteredExpenses.length === 0 ? (
                        <p className="empty-state">No expenses found</p>
                    ) : (
                        <div className="expense-list">
                            {filteredExpenses.map((expense) => (
                                <div key={expense.id} className="expense-item">
                                    {editingId === expense.id ? (
                                        <div style={{ width: '100%' }}>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <input
                                                        type="number"
                                                        value={editForm.amount}
                                                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                                        placeholder="Amount"
                                                        min="0"
                                                        max="10000"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <select
                                                        value={editForm.type}
                                                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="online">Online</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <input
                                                        type="text"
                                                        value={editForm.category}
                                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                        placeholder="Category"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    placeholder="Description"
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                <button onClick={handleSaveEdit} className="btn-primary" disabled={loading}>
                                                    {loading ? 'Saving...' : 'Save'}
                                                </button>
                                                <button onClick={handleCancelEdit} className="btn-secondary">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
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
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <button onClick={() => handleEdit(expense)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(expense.id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--error)' }}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expenses;
