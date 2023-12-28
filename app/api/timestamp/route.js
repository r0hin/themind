import { NextResponse } from 'next/server';

export async function GET() {
    const timestamp = Math.floor(Date.now() / 1000);
    return NextResponse.json({
        timestamp
    });
}

export const revalidate=0