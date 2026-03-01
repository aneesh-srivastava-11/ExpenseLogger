import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Secure endpoint for Vercel Cron to trigger daily
router.get('/apply-recurring', async (req, res, next) => {
    try {
        // 1. Verify Vercel Cron Secret for security
        // The Authorization header should be `Bearer ${process.env.CRON_SECRET}`
        const authHeader = req.headers.authorization;
        if (
            !process.env.CRON_SECRET ||
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return res.status(401).json({ error: 'Unauthorized to trigger cron' });
        }

        const now = new Date();
        const appliedRecords = [];

        // 2. Query ALL recurring expenses across ALL users using Collection Group Query
        // Note: This requires a Firestore index on the `recurring` collection group, indexing the `active` field.
        const activeRecurringSnapshot = await db
            .collectionGroup('recurring')
            .where('active', '==', true)
            .get();

        // 3. Process each active recurring expense
        for (const doc of activeRecurringSnapshot.docs) {
            const recurring = doc.data();
            const recurringId = doc.id;

            // Extract the userId from the parent document path: users/{userId}/recurring/{recurringId}
            const userId = doc.ref.parent.parent.id;

            // Check if it's due
            if (recurring.nextDue && recurring.nextDue.toDate() <= now) {
                // Determine next due date based on frequency
                let nextDue = new Date(recurring.nextDue.toDate());
                switch (recurring.frequency) {
                    case 'daily': nextDue.setDate(nextDue.getDate() + 1); break;
                    case 'weekly': nextDue.setDate(nextDue.getDate() + 7); break;
                    case 'monthly': nextDue.setMonth(nextDue.getMonth() + 1); break;
                    case 'yearly': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
                }

                // Create the expense record for this user
                const expenseData = {
                    amount: recurring.amount,
                    type: recurring.type,
                    category: recurring.category,
                    description: recurring.description + ' (Auto-Recurring)',
                    date: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                };

                await db.collection('users').doc(userId).collection('expenses').add(expenseData);

                // Update the recurring expense's nextDue date
                await doc.ref.update({ nextDue });

                // Update the user's balance
                const balanceRef = db.collection('users').doc(userId).collection('balance').doc('current');
                const balanceDoc = await balanceRef.get();

                if (balanceDoc.exists) {
                    const currentBalance = balanceDoc.data();
                    const newBalance = { ...currentBalance, updatedAt: new Date().toISOString() };

                    if (recurring.type === 'cash') {
                        newBalance.cashAmount -= recurring.amount;
                    } else {
                        newBalance.onlineAmount -= recurring.amount;
                    }

                    await balanceRef.update(newBalance);
                }

                appliedRecords.push({ userId, recurringId, nextDue });
            }
        }

        res.json({
            message: 'Cron job executed successfully',
            processedCount: appliedRecords.length,
            details: appliedRecords
        });

    } catch (error) {
        console.error('Cron job error:', error);
        next(error);
    }
});

// Secure endpoint for Vercel Cron to trigger on the 1st of every month
router.get('/monthly-reset', async (req, res, next) => {
    try {
        // 1. Verify Vercel Cron Secret for security
        const authHeader = req.headers.authorization;
        if (
            !process.env.CRON_SECRET ||
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return res.status(401).json({ error: 'Unauthorized to trigger cron' });
        }

        // 2. Query ALL balance documents across ALL users using Collection Group Query
        const balanceSnapshot = await db.collectionGroup('balance').get();
        let resetCount = 0;

        // 3. Reset all balances to 0
        for (const doc of balanceSnapshot.docs) {
            // We only care about the 'current' balance document inside the balance collection
            if (doc.id === 'current') {
                await doc.ref.update({
                    cashAmount: 0,
                    onlineAmount: 0,
                    updatedAt: new Date().toISOString()
                });
                resetCount++;
            }
        }

        res.json({
            message: 'Monthly balance reset executed successfully',
            processedCount: resetCount
        });

    } catch (error) {
        console.error('Monthly reset error:', error);
        next(error);
    }
});

export default router;
