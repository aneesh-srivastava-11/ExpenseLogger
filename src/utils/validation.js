export const validateAmount = (amount) => {
    const num = Number(amount);

    if (isNaN(num)) {
        return 'Amount must be a number';
    }

    if (num < 0) {
        return 'Amount cannot be negative';
    }

    if (num > 10000) {
        return 'Amount cannot exceed 10,000';
    }

    return null;
};

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return 'Email is required';
    }

    if (!emailRegex.test(email)) {
        return 'Invalid email address';
    }

    return null;
};

export const validateRequired = (value, fieldName = 'This field') => {
    if (!value || value.trim() === '') {
        return `${fieldName} is required`;
    }

    return null;
};

export const validatePassword = (password) => {
    if (!password) {
        return 'Password is required';
    }

    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }

    return null;
};
