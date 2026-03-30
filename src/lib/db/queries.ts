import { getDb } from './schema';
import { getCached, setCache } from './redis';
import { Politician, BillVote } from '../types';

export async function getPoliticiansByLocation(state: string, district: string | null): Promise<Politician[]> {
  const cacheKey = `reps:${state}:${district || 'all'}`;
  const cached = await getCached<Politician[]>(cacheKey);
  if (cached) return cached;

  const db = getDb();

  // Get president + VP
  const executives = db.prepare(
    `SELECT * FROM politicians WHERE state = 'US' AND level = 'federal'`
  ).all() as PoliticianRow[];

  // Get senators for this state
  const senators = db.prepare(
    `SELECT * FROM politicians WHERE state = ? AND district IS NULL AND level = 'federal' AND office LIKE '%Senator%'`
  ).all(state) as PoliticianRow[];

  // Get house rep for this district
  let reps: PoliticianRow[] = [];
  if (district) {
    reps = db.prepare(
      `SELECT * FROM politicians WHERE state = ? AND district = ? AND level = 'federal' AND office LIKE '%Representative%'`
    ).all(state, district) as PoliticianRow[];
  }

  // Get governor
  const governor = db.prepare(
    `SELECT * FROM politicians WHERE state = ? AND level = 'state'`
  ).all(state) as PoliticianRow[];

  const allRows = [...executives, ...senators, ...reps, ...governor];

  const politicians: Politician[] = allRows.map(row => {
    const bills = db.prepare('SELECT * FROM bills WHERE politician_id = ? LIMIT 5').all(row.id) as BillRow[];
    const pacs = db.prepare('SELECT * FROM pacs WHERE politician_id = ? ORDER BY amount DESC LIMIT 5').all(row.id) as PacRow[];
    const positions = db.prepare('SELECT * FROM positions WHERE politician_id = ? LIMIT 5').all(row.id) as PositionRow[];

    return {
      name: row.name,
      office: row.office,
      level: row.level as Politician['level'],
      party: row.party || 'Unknown',
      photoUrl: row.photo_url,
      birthplace: row.birthplace ? `${row.birthplace}${row.birthday ? ` (born ${row.birthday})` : ''}` : null,
      bioguideId: row.bioguide_id,
      bills: bills.map(b => ({
        billId: b.bill_id,
        title: b.title,
        vote: (b.vote || 'Sponsored') as BillVote['vote'],
        date: b.date || '',
        description: b.description || '',
      })),
      pacs: pacs.map(p => ({
        pacName: p.pac_name,
        amount: p.amount || 0,
        cycle: p.cycle || '',
      })),
      positions: positions.map(p => ({
        topic: p.topic,
        stance: p.stance,
        citation: p.citation || '',
        sourceUrl: p.source_url || '',
      })),
    };
  });

  // Cache for 1 hour
  await setCache(cacheKey, politicians, 3600);
  return politicians;
}

interface PoliticianRow {
  id: number;
  bioguide_id: string;
  name: string;
  office: string;
  level: string;
  party: string;
  state: string;
  district: string | null;
  photo_url: string | null;
  birthplace: string | null;
  birthday: string | null;
}

interface BillRow {
  bill_id: string;
  title: string;
  vote: string;
  date: string;
  description: string;
}

interface PacRow {
  pac_name: string;
  amount: number;
  cycle: string;
}

interface PositionRow {
  topic: string;
  stance: string;
  citation: string;
  source_url: string;
}
