import { auth } from '../config/firebase.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
