import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getBalance, getProfile } from '../utils/api';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [balance, setBalance] = useState({ cashAmount: 0, onlineAmount: 0 });
    const [budgetAlerts, setBudgetAlerts] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        if (currentUser) {
            loadProfile();
            loadBalance();
        }
    }, [currentUser, refreshKey]);

    const loadProfile = async () => {
        try {
            const response = await getProfile();
            setProfile(response.data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const loadBalance = async () => {
        try {
            const response = await getBalance();
            setBalance(response.data);
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    };

    const value = {
        profile,
        setProfile,
        balance,
        setBalance,
        budgetAlerts,
        setBudgetAlerts,
        refresh,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
