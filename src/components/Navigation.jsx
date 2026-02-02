import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const Navigation = () => {
    const { currentUser, logout } = useAuth();
    const { profile } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/expenses', label: 'Expenses' },
        { path: '/analytics', label: 'Analytics' },
        { path: '/profile', label: 'Profile' },
    ];

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <span className="logo">💰</span>
                <span className="brand-name">Expense Logger</span>
            </div>

            {/* Desktop Navigation */}
            <div className="nav-links desktop-nav">
                {navLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={isActive(link.path) ? 'active' : ''}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* Mobile Hamburger */}
            <button
                className="mobile-menu-btn"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
                <div className="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </button>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
                    <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <span className="logo">💰</span>
                            <span>Menu</span>
                            <button className="close-btn" onClick={() => setShowMobileMenu(false)}>✕</button>
                        </div>
                        <div className="mobile-nav-links">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={isActive(link.path) ? 'active' : ''}
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <button className="logout-btn-mobile" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Menu */}
            <div className="nav-profile">
                <button
                    className="profile-btn"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                    <div className="profile-avatar">
                        {profile?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </button>

                {showProfileMenu && (
                    <div className="profile-dropdown">
                        <div className="profile-info">
                            <div className="profile-name">{profile?.name || 'User'}</div>
                            <div className="profile-email">{currentUser?.email}</div>
                        </div>
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-item" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
