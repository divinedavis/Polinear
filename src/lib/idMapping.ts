import { getCached, setCache } from './cache';

interface LegislatorMapping {
  bioguideId: string;
  name: string;
  firstName: string;
  lastName: string;
  birthday: string;
  birthState: string;
  party: string;
}

let legislators: LegislatorMapping[] | null = null;

async function loadLegislators(): Promise<LegislatorMapping[]> {
  if (legislators) return legislators;

  const cached = getCached<LegislatorMapping[]>('legislators');
  if (cached) {
    legislators = cached;
    return cached;
  }

  try {
    const res = await fetch(
      'https://theunitedstates.io/congress-legislators/legislators-current.json'
    );
    const data = await res.json();

    legislators = data.map((l: { id: { bioguide: string }; name: { first: string; last: string; official_full: string }; bio: { birthday: string; gender: string }; terms: { party: string; state: string }[] }) => ({
      bioguideId: l.id.bioguide,
      name: l.name.official_full || `${l.name.first} ${l.name.last}`,
      firstName: l.name.first,
      lastName: l.name.last,
      birthday: l.bio?.birthday || '',
      birthState: l.terms?.[0]?.state || '',
      party: l.terms?.[l.terms.length - 1]?.party || '',
    }));

    setCache('legislators', legislators, 86400 * 30);
    return legislators!;
  } catch (err) {
    console.error('Failed to load legislators:', err);
    return [];
  }
}

export async function findBioguideId(name: string): Promise<string | null> {
  const all = await loadLegislators();
  const normalized = name.toLowerCase().replace(/[^a-z ]/g, '');

  const match = all.find(l => {
    const fullName = l.name.toLowerCase().replace(/[^a-z ]/g, '');
    const simpleName = `${l.firstName} ${l.lastName}`.toLowerCase();
    return fullName === normalized || simpleName === normalized || fullName.includes(normalized) || normalized.includes(simpleName);
  });

  return match?.bioguideId || null;
}

export async function getLegislatorInfo(name: string): Promise<{ bioguideId: string; birthday: string; birthState: string } | null> {
  const all = await loadLegislators();
  const normalized = name.toLowerCase().replace(/[^a-z ]/g, '');

  const match = all.find(l => {
    const fullName = l.name.toLowerCase().replace(/[^a-z ]/g, '');
    const simpleName = `${l.firstName} ${l.lastName}`.toLowerCase();
    return fullName === normalized || simpleName === normalized || fullName.includes(normalized) || normalized.includes(simpleName);
  });

  if (!match) return null;

  return {
    bioguideId: match.bioguideId,
    birthday: match.birthday,
    birthState: match.birthState,
  };
}
