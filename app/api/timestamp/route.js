import { NextResponse } from 'next/server';

export async function GET() {
    const timestamp = Math.floor(Date.now() / 1000);

    const headers = {
        'Cache-Control': 'no-store', // or 'max-age=0' to indicate no caching
    };

    return NextResponse.json({
        timestamp,
        headers
    });
}