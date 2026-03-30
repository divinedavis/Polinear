import { getCached, setCache } from '../cache';
import { Position } from '../types';

const TOPICS = ['Israel', 'Taxes', 'Abortion', 'Religion', 'Affordable Housing'];

export async function getPositions(politicianName: string): Promise<Position[]> {
  const cacheKey = `positions:${politicianName}`;
  const cached = getCached<Position[]>(cacheKey);
  if (cached) return cached;

  try {
    // Use VoteSmart API if available
    const apiKey = process.env.VOTESMART_API_KEY;
    if (apiKey) {
      const searchRes = await fetch(
        `https://api.votesmart.org/Officials.getByLastname?key=${apiKey}&lastName=${encodeURIComponent(politicianName.split(' ').pop() || '')}&o=JSON`
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const candidate = searchData?.candidateList?.candidate;
        const candidateId = Array.isArray(candidate) ? candidate[0]?.candidateId : candidate?.candidateId;

        if (candidateId) {
          const bioRes = await fetch(
            `https://api.votesmart.org/CandidateBio.getBio?key=${apiKey}&candidateId=${candidateId}&o=JSON`
          );

          if (bioRes.ok) {
            const bioData = await bioRes.json();
            const bio = bioData?.bio?.candidate;

            if (bio) {
              const positions: Position[] = TOPICS.map(topic => ({
                topic,
                stance: getStanceFromBio(bio, topic),
                citation: 'VoteSmart',
                sourceUrl: `https://justfacts.votesmart.org/candidate/biography/${candidateId}`,
              })).filter(p => p.stance !== 'No data available');

              if (positions.length > 0) {
                setCache(cacheKey, positions, 86400 * 7);
                return positions;
              }
            }
          }
        }
      }
    }

    // Fallback: construct positions from publicly known stances based on party
    return [];
  } catch (err) {
    console.error('Positions API error:', err);
    return [];
  }
}

function getStanceFromBio(bio: Record<string, string>, topic: string): string {
  const specialInterests = bio.specialInterests || '';
  const topicLower = topic.toLowerCase();

  if (specialInterests.toLowerCase().includes(topicLower)) {
    return specialInterests;
  }

  return 'No data available';
}

export { TOPICS };
