import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { query, collection, deleteDoc, where, getDocs } from 'firebase/firestore';

export async function POST() {
    const thresholdMinutes = 5;
    const currentTime = Math.floor(Date.now() / 1000);
    const thresholdTime = currentTime - thresholdMinutes * 60;
  
    const q = query(collection(db, 'games'), where('createdAt', '<', thresholdTime));
    const querySnapshot = await getDocs(q);
  
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    return NextResponse.json({
        message: 'Clean successful.'
    }, {
        status: 200
    });
}