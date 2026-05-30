import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get current balance
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const balanceDoc = await db.collection('users').doc(uid).collection('balance').doc('current').get();

        if (!balanceDoc.exists) {
            return res.json({ cashAmount: 0, onlineAmount: 0 });
        }

        res.json(balanceDoc.data());
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to get balance' });
    }
});

// Set/Update balance
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { cashAmount, onlineAmount } = req.body;

        // Validate amounts
        if (cashAmount === undefined || onlineAmount === undefined) {
            return res.status(400).json({ error: 'Both cashAmount and onlineAmount are required' });
        }

        const numCash = Number(cashAmount);
        const numOnline = Number(onlineAmount);

        if (isNaN(numCash) || isNaN(numOnline)) {
            return res.status(400).json({ error: 'Amounts must be valid numbers' });
        }

        if (Math.abs(numCash) > 1000000 || Math.abs(numOnline) > 1000000) {
            return res.status(400).json({ error: 'Amounts cannot exceed 1,000,000' });
        }

        const balanceData = {
            cashAmount: numCash,
            onlineAmount: numOnline,
            updatedAt: new Date().toISOString(),
        };

        await db.collection('users').doc(uid).collection('balance').doc('current').set(balanceData);

        res.json({ message: 'Balance updated', balance: balanceData });
    } catch (error) {
        console.error('Update balance error:', error);
        res.status(500).json({ error: 'Failed to update balance' });
    }
});

export default router;
