import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get all recurring expenses
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await db.collection('users').doc(uid).collection('recurring').get();

        const recurring = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(recurring);
    } catch (error) {
        console.error('Get recurring error:', error);
        res.status(500).json({ error: 'Failed to get recurring expenses' });
    }
});

// Create recurring expense
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { amount, type, category, description, frequency } = req.body;

        if (!amount || !type || !category || !frequency) {
            return res.status(400).json({ error: 'Amount, type, category, and frequency are required' });
        }

        if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
            return res.status(400).json({ error: 'Invalid frequency' });
        }

        // Calculate next due date
        const now = new Date();
        const nextDue = new Date(now);

        if (frequency === 'daily') {
            nextDue.setDate(nextDue.getDate() + 1);
        } else if (frequency === 'weekly') {
            nextDue.setDate(nextDue.getDate() + 7);
        } else if (frequency === 'monthly') {
            nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (frequency === 'yearly') {
            nextDue.setFullYear(nextDue.getFullYear() + 1);
        }

        const recurringData = {
            amount: Number(amount),
            type,
            category,
            description: description || '',
            frequency,
            nextDue: nextDue.toISOString(),
            active: true,
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection('users').doc(uid).collection('recurring').add(recurringData);

        res.json({ message: 'Recurring expense created', id: docRef.id, recurring: recurringData });
    } catch (error) {
        console.error('Create recurring error:', error);
        res.status(500).json({ error: 'Failed to create recurring expense' });
    }
});

// Delete recurring expense
router.delete('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;

        await db.collection('users').doc(uid).collection('recurring').doc(id).delete();

        res.json({ message: 'Recurring expense deleted' });
    } catch (error) {
        console.error('Delete recurring error:', error);
        res.status(500).json({ error: 'Failed to delete recurring expense' });
    }
});

// Apply pending recurring expenses
router.post('/apply', async (req, res) => {
    try {
        const { uid } = req.user;
        const now = new Date().toISOString();

        // Get all active recurring expenses (removed the nextDue filter to avoid composite index)
        const snapshot = await db
            .collection('users')
            .doc(uid)
            .collection('recurring')
            .where('active', '==', true)
            .get();

        const applied = [];

        for (const doc of snapshot.docs) {
            const recurring = doc.data();

            // Filter in code instead of query to avoid Firestore index requirement
            if (recurring.nextDue && recurring.nextDue <= now) {
                // Create expense
                const expenseData = {
                    amount: recurring.amount,
                    type: recurring.type,
                    category: recurring.category,
                    description: `[Recurring] ${recurring.description}`,
                    date: now,
                    createdAt: now,
                };

                await db.collection('users').doc(uid).collection('expenses').add(expenseData);

                // Update balance
                const balanceRef = db.collection('users').doc(uid).collection('balance').doc('current');
                const balanceDoc = await balanceRef.get();

                if (balanceDoc.exists) {
                    const currentBalance = balanceDoc.data();
                    const updateField = recurring.type === 'cash' ? 'cashAmount' : 'onlineAmount';

                    await balanceRef.update({
                        [updateField]: currentBalance[updateField] - recurring.amount,
                        updatedAt: now,
                    });
                }

                // Calculate next due date
                const nextDue = new Date(recurring.nextDue);

                if (recurring.frequency === 'daily') {
                    nextDue.setDate(nextDue.getDate() + 1);
                } else if (recurring.frequency === 'weekly') {
                    nextDue.setDate(nextDue.getDate() + 7);
                } else if (recurring.frequency === 'monthly') {
                    nextDue.setMonth(nextDue.getMonth() + 1);
                } else if (recurring.frequency === 'yearly') {
                    nextDue.setFullYear(nextDue.getFullYear() + 1);
                }

                // Update recurring expense with new nextDue
                await doc.ref.update({ nextDue: nextDue.toISOString() });

                applied.push({
                    id: doc.id,
                    ...recurring,
                });
            }
        }

        res.json({ message: `Applied ${applied.length} recurring expense(s)`, applied });
    } catch (error) {
        console.error('Apply recurring error:', error);
        res.status(500).json({ error: 'Failed to apply recurring expenses' });
    }
});

export default router;
