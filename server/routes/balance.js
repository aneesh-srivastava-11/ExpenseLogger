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

        const balanceData = {
            cashAmount: Number(cashAmount),
            onlineAmount: Number(onlineAmount),
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
