import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Custom hook for authentication state
 * @returns {Object} { user, loading }
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                setUser(user);
                setLoading(false);
            },
            (error) => {
                console.error('Auth state change error:', error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    return { user, loading };
};

export default useAuth;
