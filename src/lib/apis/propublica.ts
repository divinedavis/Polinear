import { getCached, setCache } from '../cache';
import { BillVote } from '../types';

export async function getMemberVotes(bioguideId: string): Promise<BillVote[]> {
  const cacheKey = `votes:${bioguideId}`;
  const cached = getCached<BillVote[]>(cacheKey);
  if (cached) return cached;

  try {
    const apiKey = process.env.CONGRESS_GOV_API_KEY || '';

    const res = await fetch(
      `https://api.congress.gov/v3/member/${bioguideId}/sponsored-legislation?limit=10&api_key=${apiKey}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const legislation = data?.sponsoredLegislation || [];
    const currentYear = new Date().getFullYear().toString();

    const bills: BillVote[] = legislation
      .filter((bill: { introducedDate?: string }) => bill.introducedDate?.startsWith(currentYear))
      .slice(0, 5)
      .map((bill: { number?: string; title?: string; introducedDate?: string; latestAction?: { text?: string } }) => ({
        billId: bill.number || '',
        title: bill.title || 'Untitled Bill',
        vote: 'Sponsored' as BillVote['vote'],
        date: bill.introducedDate || '',
        description: bill.latestAction?.text || '',
      }));

    setCache(cacheKey, bills, 86400);
    return bills;
  } catch (err) {
    console.error('Congress.gov API error:', err);
    return [];
  }
}
