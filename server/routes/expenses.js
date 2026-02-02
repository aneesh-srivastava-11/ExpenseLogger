import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Add expense
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { amount, type, category, description, date } = req.body;

        // Validation
        if (!amount || !type || !category) {
            return res.status(400).json({ error: 'Amount, type, and category are required' });
        }

        const numAmount = Number(amount);

        if (numAmount < 0) {
            return res.status(400).json({ error: 'Amount cannot be negative' });
        }

        if (numAmount > 10000) {
            return res.status(400).json({ error: 'Amount cannot exceed 10,000' });
        }

        if (!['cash', 'online'].includes(type)) {
            return res.status(400).json({ error: 'Type must be cash or online' });
        }

        const expenseData = {
            amount: numAmount,
            type,
            category,
            description: description || '',
            date: date || new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection('users').doc(uid).collection('expenses').add(expenseData);

        // Update balance
        const balanceRef = db.collection('users').doc(uid).collection('balance').doc('current');
        const balanceDoc = await balanceRef.get();

        if (balanceDoc.exists) {
            const currentBalance = balanceDoc.data();
            const updateField = type === 'cash' ? 'cashAmount' : 'onlineAmount';

            await balanceRef.update({
                [updateField]: currentBalance[updateField] - numAmount,
                updatedAt: new Date().toISOString(),
            });
        }

        res.json({ message: 'Expense added', id: docRef.id, expense: expenseData });
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ error: 'Failed to add expense' });
    }
});

// Get expenses with filters
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { search, category, startDate, endDate } = req.query;

        let query = db.collection('users').doc(uid).collection('expenses');

        // Apply filters
        if (category) {
            query = query.where('category', '==', category);
        }

        if (startDate) {
            query = query.where('date', '>=', startDate);
        }

        if (endDate) {
            query = query.where('date', '<=', endDate);
        }

        const snapshot = await query.orderBy('date', 'desc').get();

        let expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Apply search filter (client-side for description)
        if (search) {
            const searchLower = search.toLowerCase();
            expenses = expenses.filter(exp =>
                exp.description.toLowerCase().includes(searchLower)
            );
        }

        res.json(expenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to get expenses' });
    }
});

// Edit expense
router.put('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const { amount, type, category, description, date } = req.body;

        // Get old expense to adjust balance
        const expenseRef = db.collection('users').doc(uid).collection('expenses').doc(id);
        const oldExpenseDoc = await expenseRef.get();

        if (!oldExpenseDoc.exists) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const oldExpense = oldExpenseDoc.data();

        // Validation
        const numAmount = Number(amount);

        if (numAmount < 0) {
            return res.status(400).json({ error: 'Amount cannot be negative' });
        }

        if (numAmount > 10000) {
            return res.status(400).json({ error: 'Amount cannot exceed 10,000' });
        }

        const updatedExpense = {
            amount: numAmount,
            type,
            category,
            description: description || '',
            date: date || oldExpense.date,
            createdAt: oldExpense.createdAt,
        };

        await expenseRef.update(updatedExpense);

        // Adjust balance (add back old, subtract new)
        const balanceRef = db.collection('users').doc(uid).collection('balance').doc('current');
        const balanceDoc = await balanceRef.get();

        if (balanceDoc.exists) {
            const currentBalance = balanceDoc.data();

            // Revert old expense
            const oldField = oldExpense.type === 'cash' ? 'cashAmount' : 'onlineAmount';
            let newCash = currentBalance.cashAmount;
            let newOnline = currentBalance.onlineAmount;

            if (oldField === 'cashAmount') {
                newCash += oldExpense.amount;
            } else {
                newOnline += oldExpense.amount;
            }

            // Apply new expense
            if (type === 'cash') {
                newCash -= numAmount;
            } else {
                newOnline -= numAmount;
            }

            await balanceRef.update({
                cashAmount: newCash,
                onlineAmount: newOnline,
                updatedAt: new Date().toISOString(),
            });
        }

        res.json({ message: 'Expense updated', expense: updatedExpense });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;

        const expenseRef = db.collection('users').doc(uid).collection('expenses').doc(id);
        const expenseDoc = await expenseRef.get();

        if (!expenseDoc.exists) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const expense = expenseDoc.data();

        // Delete expense
        await expenseRef.delete();

        // Refund balance
        const balanceRef = db.collection('users').doc(uid).collection('balance').doc('current');
        const balanceDoc = await balanceRef.get();

        if (balanceDoc.exists) {
            const currentBalance = balanceDoc.data();
            const updateField = expense.type === 'cash' ? 'cashAmount' : 'onlineAmount';

            await balanceRef.update({
                [updateField]: currentBalance[updateField] + expense.amount,
                updatedAt: new Date().toISOString(),
            });
        }

        res.json({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

export default router;
