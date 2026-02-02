import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useApp } from '../context/AppContext';
import { updateProfile, updateBalance, getBudgets, saveBudget, deleteBudget, getRecurring, createRecurring, deleteRecurring } from '../utils/api';
import { validateRequired, validateEmail, validateAmount } from '../utils/validation';

const Profile = () => {
    const { profile, setProfile, balance, setBalance, refresh } = useApp();
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [balanceForm, setBalanceForm] = useState({ cashAmount: 0, onlineAmount: 0 });
    const [budgets, setBudgets] = useState([]);
    const [recurring, setRecurring] = useState([]);
    const [budgetForm, setBudgetForm] = useState({ category: '', limitAmount: '', period: 'monthly' });
    const [recurringForm, setRecurringForm] = useState({ amount: '', type: 'cash', category: '', description: '', frequency: 'monthly' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setProfileForm(profile);
        setBalanceForm(balance);
        loadBudgetsAndRecurring();
    }, [profile, balance]);

    const loadBudgetsAndRecurring = async () => {
        try {
            const [budgetsRes, recurringRes] = await Promise.all([
                getBudgets(),
                getRecurring(),
            ]);
            setBudgets(budgetsRes.data);
            setRecurring(recurringRes.data);
        } catch (error) {
            console.error('Failed to load:', error);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const nameError = validateRequired(profileForm.name, 'Name');
        const emailError = validateEmail(profileForm.email);

        if (nameError || emailError) {
            setError(nameError || emailError);
            return;
        }

        setLoading(true);

        try {
            await updateProfile(profileForm);
            setProfile(profileForm);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBalance = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        setLoading(true);

        try {
            await updateBalance(balanceForm);
            setBalance(balanceForm);
            setSuccess('Balance updated successfully!');
            refresh();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update balance');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        setError('');

        const categoryError = validateRequired(budgetForm.category, 'Category');
        const amountError = validateAmount(budgetForm.limitAmount);

        if (categoryError || amountError) {
            setError(categoryError || amountError);
            return;
        }

        try {
            await saveBudget(budgetForm);
            setBudgetForm({ category: '', limitAmount: '', period: 'monthly' });
            loadBudgetsAndRecurring();
            setSuccess('Budget created!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create budget');
        }
    };

    const handleDeleteBudget = async (id) => {
        if (!confirm('Delete this budget?')) return;

        try {
            await deleteBudget(id);
            loadBudgetsAndRecurring();
        } catch (error) {
            alert('Failed to delete budget');
        }
    };

    const handleAddRecurring = async (e) => {
        e.preventDefault();
        setError('');

        const categoryError = validateRequired(recurringForm.category, 'Category');
        const amountError = validateAmount(recurringForm.amount);

        if (categoryError || amountError) {
            setError(categoryError || amountError);
            return;
        }

        try {
            await createRecurring(recurringForm);
            setRecurringForm({ amount: '', type: 'cash', category: '', description: '', frequency: 'monthly' });
            loadBudgetsAndRecurring();
            setSuccess('Recurring expense created!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create recurring expense');
        }
    };

    const handleDeleteRecurring = async (id) => {
        if (!confirm('Delete this recurring expense?')) return;

        try {
            await deleteRecurring(id);
            loadBudgetsAndRecurring();
        } catch (error) {
            alert('Failed to delete recurring expense');
        }
    };

    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

    return (
        <div className="app">
            <Navigation />

            <div className="main-content">
                <h1>Profile Settings</h1>

                {error && <div className="error-message">{error}</div>}
                {success && <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 163, 127, 0.1)', border: '1px solid var(--accent)', borderRadius: '0.5rem', color: 'var(--accent)', marginBottom: '1rem' }}>{success}</div>}

                {/* Profile Section */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h2>Personal Information</h2>
                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                {/* Balance Section */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h2>Set Balances</h2>
                    <form onSubmit={handleUpdateBalance}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Cash Amount</label>
                                <input
                                    type="number"
                                    value={balanceForm.cashAmount}
                                    onChange={(e) => setBalanceForm({ ...balanceForm, cashAmount: parseFloat(e.target.value) || 0 })}
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>Online Amount</label>
                                <input
                                    type="number"
                                    value={balanceForm.onlineAmount}
                                    onChange={(e) => setBalanceForm({ ...balanceForm, onlineAmount: parseFloat(e.target.value) || 0 })}
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Balances'}
                        </button>
                    </form>
                </div>

                {/* Budgets Section */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h2>Budget Management</h2>

                    <form onSubmit={handleAddBudget}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={budgetForm.category}
                                    onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                                    placeholder="Food, Transport, etc."
                                />
                            </div>

                            <div className="form-group">
                                <label>Limit Amount</label>
                                <input
                                    type="number"
                                    value={budgetForm.limitAmount}
                                    onChange={(e) => setBudgetForm({ ...budgetForm, limitAmount: e.target.value })}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label>Period</label>
                                <select value={budgetForm.period} onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary">Add Budget</button>
                    </form>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your Budgets</h3>
                        {budgets.length === 0 ? (
                            <p className="empty-state">No budgets set</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {budgets.map((budget) => (
                                    <div key={budget.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{budget.category}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                {formatCurrency(budget.limitAmount)} / {budget.period}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteBudget(budget.id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--error)' }}>
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recurring Expenses Section */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                    <h2>Recurring Expenses</h2>

                    <form onSubmit={handleAddRecurring}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    value={recurringForm.amount}
                                    onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                                    placeholder="0.00"
                                    step="0.01"
                                    max="10000"
                                />
                            </div>

                            <div className="form-group">
                                <label>Type</label>
                                <select value={recurringForm.type} onChange={(e) => setRecurringForm({ ...recurringForm, type: e.target.value })}>
                                    <option value="cash">Cash</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={recurringForm.category}
                                    onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}
                                    placeholder="Rent, Subscription, etc."
                                />
                            </div>

                            <div className="form-group">
                                <label>Frequency</label>
                                <select value={recurringForm.frequency} onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <input
                                type="text"
                                value={recurringForm.description}
                                onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>

                        <button type="submit" className="btn-primary">Add Recurring Expense</button>
                    </form>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Active Recurring Expenses</h3>
                        {recurring.length === 0 ? (
                            <p className="empty-state">No recurring expenses</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {recurring.map((rec) => (
                                    <div key={rec.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.category}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                {formatCurrency(rec.amount)} - {rec.frequency} ({rec.type})
                                            </div>
                                            {rec.description && (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rec.description}</div>
                                            )}
                                        </div>
                                        <button onClick={() => handleDeleteRecurring(rec.id)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--error)' }}>
                                            Delete
                                        </button>
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

export default Profile;
