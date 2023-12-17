import firebase_app from '../config';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const db = getFirestore(firebase_app);

export const getData = async (collectionName, id) => {
    let docRef = doc(db, collectionName, id);

    try {
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? snapshot.data() : null;
    } catch (error) {
        console.error('Error fetching document:', error);
        return null;
    }
}

export default getData;