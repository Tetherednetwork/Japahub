
import { getData } from 'country-list';

export const countries = getData().map(c => ({
    code: c.code,
    name: c.name
})).sort((a, b) => a.name.localeCompare(b.name));

// Function to convert country code to flag emoji
export function getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) {
        return '🌍'; // Default globe emoji
    }
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
