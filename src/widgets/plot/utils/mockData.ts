import {author, FetchedDataPoint} from "./types.d.ts";

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const encodeTime = (timestamp: number, length = 10): string => {
    let remaining = timestamp;
    let encoded = "";
    for (let i = 0; i < length; i++) {
        encoded = ULID_ALPHABET[remaining % 32] + encoded;
        remaining = Math.floor(remaining / 32);
    }
    return encoded;
};

const encodeRandom = (length = 16): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, byte => ULID_ALPHABET[byte % 32]).join("");
};

const generateUlid = (timestamp: number = Date.now()): string => encodeTime(timestamp) + encodeRandom();

const randomInt = (min: number, max: number): number => min + Math.floor(Math.random() * (max - min + 1));

const createAuthor = (name: string): author => ({
    id: generateUlid(),
    name,
    login: name.toLowerCase().trim(),
});


const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Generates `amountOfWorklogs` mock worklog items (FetchedDataPoint[]) spread randomly
 * across the days from startDate to endDate (inclusive).
 * Each author name maps to exactly one author object, reused across all generated items.
 */
export const mockData = (startDate: Date, endDate: Date, authorNames: string[], amountOfWorklogs: number): FetchedDataPoint[] => {
    const authors: author[] = authorNames.map(createAuthor);
    if (authors.length === 0 || amountOfWorklogs <= 0) {return [];}

    const firstDay = new Date(startDate);
    firstDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(endDate);
    lastDay.setHours(0, 0, 0, 0);
    const dayCount = Math.max(1, Math.round((lastDay.getTime() - firstDay.getTime()) / MS_PER_DAY) + 1);

    const fetchedDatapoints: FetchedDataPoint[] = Array(amountOfWorklogs).fill(null).map(() => {
        const authorObject = authors[randomInt(0, authors.length - 1)];

        const date = new Date(firstDay);
        date.setDate(firstDay.getDate() + randomInt(0, dayCount - 1));
        date.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);

        return{
            author: authorObject,
            date: date.getTime(),
            duration: {minutes: randomInt(1, 16)},
        };
    })

    return fetchedDatapoints;
};
