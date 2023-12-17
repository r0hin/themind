import { collection, getDocs, query, getFirestore } from 'firebase/firestore';

const db = getFirestore();

export const searchDocuments = async (collectionName, conditions) => {
    const q = query(collection(db, collectionName), ...conditions);

    try {
        const querySnapshot = await getDocs(q);
        const documents = querySnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
        return documents;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return null;
    }
};

export default searchDocuments;