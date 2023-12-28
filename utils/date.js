export async function getTimestamp() {
    const response = await fetch('/api/timestamp', { cache: 'no-store' });
    const data = await response.json();
    return data.timestamp;
}