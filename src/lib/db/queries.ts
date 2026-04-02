import { getDb } from './schema';
import { getCached, setCache } from './redis';
import { Politician, BillVote } from '../types';

interface LocationInfo {
  state: string;
  congressionalDistrict: string | null;
  stateSenateDistrict: string | null;
  stateAssemblyDistrict: string | null;
  cityCouncilDistrict: string | null;
  borough: string | null;
  city: string | null;
  isNYC: boolean;
}

export async function getPoliticiansByLocation(loc: LocationInfo): Promise<Politician[]> {
  const cacheKey = `reps:${loc.state}:${loc.congressionalDistrict}:${loc.stateSenateDistrict}:${loc.stateAssemblyDistrict}:${loc.cityCouncilDistrict}:${loc.borough}:${loc.isNYC}`;
  const cached = await getCached<Politician[]>(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const rows: PoliticianRow[] = [];

  // Federal: President + VP
  rows.push(...db.prepare(`SELECT * FROM politicians WHERE state = 'US'`).all() as PoliticianRow[]);

  // Federal: Senators
  rows.push(...db.prepare(`SELECT * FROM politicians WHERE state = ? AND office LIKE '%Senator%' AND level = 'federal'`).all(loc.state) as PoliticianRow[]);

  // Federal: House Rep
  if (loc.congressionalDistrict) {
    rows.push(...db.prepare(`SELECT * FROM politicians WHERE state = ? AND district = ? AND office LIKE '%Representative%' AND level = 'federal'`).all(loc.state, loc.congressionalDistrict) as PoliticianRow[]);
  }

  // State: Governor
  rows.push(...db.prepare(`SELECT * FROM politicians WHERE bioguide_id = ?`).all(`GOV-${loc.state}`) as PoliticianRow[]);

  // State: Statewide officers for THIS state only
  rows.push(...db.prepare(`SELECT * FROM politicians WHERE state = ? AND level = 'state' AND (bioguide_id = ? OR bioguide_id = ? OR bioguide_id = ?)`).all(loc.state, `${loc.state}-LTGOV`, `${loc.state}-AG`, `${loc.state}-COMP`) as PoliticianRow[]);

  // State: State Senator
  if (loc.stateSenateDistrict) {
    rows.push(...db.prepare(`SELECT * FROM politicians WHERE state = ? AND state_senate_district = ? AND level = 'state'`).all(loc.state, loc.stateSenateDistrict) as PoliticianRow[]);
  }

  // State: State Assembly
  if (loc.stateAssemblyDistrict) {
    rows.push(...db.prepare(`SELECT * FROM politicians WHERE state = ? AND state_assembly_district = ? AND level = 'state'`).all(loc.state, loc.stateAssemblyDistrict) as PoliticianRow[]);
  }

  // Local: Only show NYC officials if the user is actually in NYC
  if (loc.isNYC) {
    // Citywide: Mayor, Public Advocate, Comptroller
    rows.push(...db.prepare(`SELECT * FROM politicians WHERE level = 'local' AND city = 'New York City' AND council_district IS NULL AND office NOT LIKE '%Borough%' AND office NOT LIKE '%District Attorney%'`).all() as PoliticianRow[]);

    // Borough President
    if (loc.borough) {
      rows.push(...db.prepare(`SELECT * FROM politicians WHERE level = 'local' AND city = ? AND office LIKE '%Borough President%'`).all(loc.borough) as PoliticianRow[]);
    }

    // District Attorney
    if (loc.borough) {
      rows.push(...db.prepare(`SELECT * FROM politicians WHERE level = 'local' AND city = ? AND office LIKE '%District Attorney%'`).all(loc.borough) as PoliticianRow[]);
    }

    // City Council
    if (loc.cityCouncilDistrict) {
      rows.push(...db.prepare(`SELECT * FROM politicians WHERE level = 'local' AND council_district = ? AND state = ?`).all(loc.cityCouncilDistrict, loc.state) as PoliticianRow[]);
    }
  }

  // Deduplicate
  const seen = new Set<number>();
  const uniqueRows = rows.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });

  const politicians: Politician[] = uniqueRows.map(row => {
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
      termEnd: row.term_end || null,
      nextElection: row.next_election || null,
      bills: bills.map(b => ({ billId: b.bill_id, title: b.title, vote: (b.vote || 'Sponsored') as BillVote['vote'], date: b.date || '', description: b.description || '' })),
      pacs: pacs.map(p => ({ pacName: p.pac_name, amount: p.amount || 0, cycle: p.cycle || '' })),
      positions: positions.map(p => ({ topic: p.topic, stance: p.stance, citation: p.citation || '', sourceUrl: p.source_url || '' })),
      netWorth2010: row.net_worth_2010 || null,
      netWorth2025: row.net_worth_2025 || null,
    };
  });

  await setCache(cacheKey, politicians, 3600);
  return politicians;
}

interface PoliticianRow { id: number; bioguide_id: string; name: string; office: string; level: string; party: string; state: string; district: string | null; photo_url: string | null; birthplace: string | null; birthday: string | null; term_end: string | null; next_election: string | null; net_worth_2010: number | null; net_worth_2025: number | null; }
interface BillRow { bill_id: string; title: string; vote: string; date: string; description: string; }
interface PacRow { pac_name: string; amount: number; cycle: string; }
interface PositionRow { topic: string; stance: string; citation: string; source_url: string; }
