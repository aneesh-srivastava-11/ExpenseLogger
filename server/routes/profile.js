import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

// Get user profile
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            // Return default profile instead of 404 to avoid errors
            return res.json({ name: '', email: '' });
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

        const trimmedName = name ? String(name).trim() : '';
        const trimmedEmail = email ? String(email).trim() : '';

        if (!trimmedName) {
            return res.status(400).json({ error: 'Name is required' });
        }
        if (trimmedName.length > 100) {
            return res.status(400).json({ error: 'Name cannot exceed 100 characters' });
        }

        if (!trimmedEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (trimmedEmail.length > 150) {
            return res.status(400).json({ error: 'Email cannot exceed 150 characters' });
        }

        const profileData = {
            name: trimmedName,
            email: trimmedEmail,
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
