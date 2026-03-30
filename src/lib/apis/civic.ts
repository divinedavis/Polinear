import { getCached, setCache } from '../cache';

const API_KEY = process.env.GOOGLE_CIVIC_API_KEY || '';

interface CivicResponse {
  normalizedInput: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  offices: {
    name: string;
    divisionId: string;
    levels?: string[];
    roles?: string[];
    officialIndices: number[];
  }[];
  officials: {
    name: string;
    party?: string;
    phones?: string[];
    urls?: string[];
    photoUrl?: string;
    channels?: { type: string; id: string }[];
    address?: { line1: string; city: string; state: string; zip: string }[];
  }[];
}

export async function getRepresentatives(address: string): Promise<CivicResponse | null> {
  const cacheKey = `civic:${address}`;
  const cached = getCached<CivicResponse>(cacheKey);
  if (cached) return cached;

  const url = `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Civic API error:', res.status, await res.text());
      return null;
    }
    const data: CivicResponse = await res.json();
    setCache(cacheKey, data, 86400 * 30); // 30 days
    return data;
  } catch (err) {
    console.error('Civic API fetch error:', err);
    return null;
  }
}
