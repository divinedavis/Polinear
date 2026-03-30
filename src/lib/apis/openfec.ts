import { getCached, setCache } from '../cache';
import { PACContribution } from '../types';

const API_KEY = process.env.FEC_API_KEY || '';

export async function getTopPACs(candidateName: string): Promise<PACContribution[]> {
  const cacheKey = `pacs:${candidateName}`;
  const cached = getCached<PACContribution[]>(cacheKey);
  if (cached) return cached;

  try {
    // First find the candidate
    const searchRes = await fetch(
      `https://api.open.fec.gov/v1/candidates/search/?q=${encodeURIComponent(candidateName)}&sort=receipts&api_key=${API_KEY}`
    );

    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const candidate = searchData?.results?.[0];
    if (!candidate) return [];

    const candidateId = candidate.candidate_id;
    const cycle = new Date().getFullYear();
    const adjustedCycle = cycle % 2 === 0 ? cycle : cycle - 1;

    // Get committee contributions to this candidate
    const contribRes = await fetch(
      `https://api.open.fec.gov/v1/schedules/schedule-a/?candidate_id=${candidateId}&cycle=${adjustedCycle}&sort=-contribution_receipt_amount&per_page=5&is_individual=false&api_key=${API_KEY}`
    );

    if (!contribRes.ok) return [];

    const contribData = await contribRes.json();
    const results = contribData?.results || [];

    const pacs: PACContribution[] = results.map((r: { contributor_name: string; contribution_receipt_amount: number }) => ({
      pacName: r.contributor_name,
      amount: r.contribution_receipt_amount,
      cycle: adjustedCycle.toString(),
    }));

    setCache(cacheKey, pacs, 86400 * 7); // 7 days
    return pacs;
  } catch (err) {
    console.error('FEC API error:', err);
    return [];
  }
}
