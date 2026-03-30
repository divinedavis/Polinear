import { getCached, setCache } from '../cache';
import { BillVote } from '../types';

const API_KEY = process.env.PROPUBLICA_API_KEY || '';

interface VoteResult {
  bill?: {
    bill_id: string;
    title: string;
    short_title: string;
    latest_major_action: string;
  };
  position: string;
  date: string;
  description: string;
}

export async function getMemberVotes(bioguideId: string): Promise<BillVote[]> {
  const cacheKey = `votes:${bioguideId}`;
  const cached = getCached<BillVote[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.propublica.org/congress/v1/members/${bioguideId}/votes.json`,
      { headers: { 'X-API-Key': API_KEY } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const votes: VoteResult[] = data?.results?.[0]?.votes || [];

    const currentYear = new Date().getFullYear().toString();
    const ytdVotes = votes
      .filter((v: VoteResult) => v.date?.startsWith(currentYear) && v.bill?.title)
      .slice(0, 5)
      .map((v: VoteResult) => ({
        billId: v.bill!.bill_id,
        title: v.bill!.short_title || v.bill!.title,
        vote: v.position as BillVote['vote'],
        date: v.date,
        description: v.bill!.latest_major_action || v.description,
      }));

    setCache(cacheKey, ytdVotes, 86400); // 24 hours
    return ytdVotes;
  } catch (err) {
    console.error('ProPublica error:', err);
    return [];
  }
}
