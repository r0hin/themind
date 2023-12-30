import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { getDocs, collection, deleteDoc } from 'firebase/firestore';

export async function GET() {
    const timestamp = Math.floor(Date.now() / 1000);

    const querySnapshot = await getDocs(collection(db, 'games'));
    querySnapshot.forEach(async (doc) => {
        const data = doc.data();
        if (data.lastUpdate !== 0 && timestamp - data.lastUpdate > 60) await deleteDoc(doc.ref);
    });

    return NextResponse.json({
        message: 'Clean successful.'
    });
}

export const revalidate = 0;