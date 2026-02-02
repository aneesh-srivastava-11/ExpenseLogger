import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { profile } = useApp();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-logo">
                    💰 Expense Logger
                </div>

                <div className="nav-links">
                    <Link
                        to="/dashboard"
                        className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/expenses"
                        className={`nav-link ${isActive('/expenses') ? 'active' : ''}`}
                    >
                        Expenses
                    </Link>
                    <Link
                        to="/analytics"
                        className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
                    >
                        Analytics
                    </Link>
                </div>

                <div className="nav-profile">
                    <button
                        className="profile-button"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <span className="profile-icon">👤</span>
                        <span className="profile-name">{profile.name || 'User'}</span>
                        <span className="dropdown-icon">▼</span>
                    </button>

                    {showMenu && (
                        <div className="profile-menu">
                            <Link to="/profile" onClick={() => setShowMenu(false)}>
                                Profile Settings
                            </Link>
                            <button onClick={handleLogout} className="logout-btn">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
