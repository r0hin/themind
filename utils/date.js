import { DateTime } from 'luxon';

export function getTimestamp() {
    // Get the current time in the 'America/New_York' timezone
    const newYorkTime = DateTime.now().setZone('America/New_York');

    // Convert the DateTime object to Unix timestamp (seconds)
    const unixTimestamp = Math.floor(newYorkTime.toSeconds());

    return unixTimestamp;
}