export async function getTimestamp() {
    const response = await fetch('/api/timestamp');
    const data = await response.json();
    return data.timestamp;
}