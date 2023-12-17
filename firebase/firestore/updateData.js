import firebase_app from '../config';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const db = getFirestore(firebase_app);

export const updateData = async (collectionName, id, data) => {
    let docRef = doc(db, collectionName, id);

    try {
        await updateDoc(docRef, data);
        return true;
    } catch (error) {
        console.error('Error updating document:', error);
        return false;
    }
}

export default updateData;