import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get all budgets
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await db.collection('users').doc(uid).collection('budgets').get();

        const budgets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(budgets);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to get budgets' });
    }
});

// Create/Update budget
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { category, limitAmount, period } = req.body;

        if (!category || !limitAmount || !period) {
            return res.status(400).json({ error: 'Category, limitAmount, and period are required' });
        }

        if (!['daily', 'weekly', 'monthly'].includes(period)) {
            return res.status(400).json({ error: 'Period must be daily, weekly, or monthly' });
        }

        const budgetData = {
            category,
            limitAmount: Number(limitAmount),
            period,
            updatedAt: new Date().toISOString(),
        };

        // Check if budget exists for this category and period
        const existingSnapshot = await db
            .collection('users')
            .doc(uid)
            .collection('budgets')
            .where('category', '==', category)
            .where('period', '==', period)
            .get();

        if (!existingSnapshot.empty) {
            // Update existing
            const docId = existingSnapshot.docs[0].id;
            await db.collection('users').doc(uid).collection('budgets').doc(docId).update(budgetData);
            res.json({ message: 'Budget updated', id: docId, budget: budgetData });
        } else {
            // Create new
            const docRef = await db.collection('users').doc(uid).collection('budgets').add(budgetData);
            res.json({ message: 'Budget created', id: docRef.id, budget: budgetData });
        }
    } catch (error) {
        console.error('Create/Update budget error:', error);
        res.status(500).json({ error: 'Failed to save budget' });
    }
});

// Delete budget
router.delete('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;

        await db.collection('users').doc(uid).collection('budgets').doc(id).delete();

        res.json({ message: 'Budget deleted' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

export default router;
