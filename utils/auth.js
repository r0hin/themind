import { auth } from '@/firebase/config';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export const subscribeToAuthChanges = (onUserChanged) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) { 
            signInAnonymously(auth);
        } else {
            onUserChanged(user);
        }
    });

    return unsubscribe;
};