// pages/api/auth/session.js
import { auth } from '@/lib/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface SessionResponse {
    user?: User;
    error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SessionResponse>) {
    if (req.method === 'GET') {
        try {
            const user = auth.currentUser as User | null;
            if (user) {
                return res.status(200).json({ user });
            } else {
                return res.status(404).json({ error: 'No active session' });
            }
        } catch (error) {
            return res.status(500).json({ error: 'Failed to get session' });
        }
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
}
