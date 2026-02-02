import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get user profile
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(userDoc.data());
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user profile
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, email } = req.body;

        const profileData = {
            name,
            email,
            updatedAt: new Date().toISOString(),
        };

        await db.collection('users').doc(uid).set(profileData, { merge: true });

        res.json({ message: 'Profile updated', profile: profileData });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
