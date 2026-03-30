import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const db = new Database(DB_PATH);

const update = db.prepare('UPDATE politicians SET term_end = ?, next_election = ? WHERE bioguide_id = ?');

// ---- Congress members from legislators file ----
const legislators = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'legislators-current.json'), 'utf-8'));

for (const leg of legislators) {
  const latestTerm = leg.terms[leg.terms.length - 1];
  const bioguideId = leg.id.bioguide;
  const termEnd = latestTerm.end; // e.g., "2027-01-03"

  // Determine next election date
  // Senators: election is in November of the year before term ends
  // House: election every 2 years in November of even years
  const termEndYear = parseInt(termEnd.split('-')[0]);
  const electionYear = latestTerm.type === 'sen' ? termEndYear - 1 : termEndYear - 1;
  const nextElection = `${electionYear}-11-03`;

  update.run(termEnd, nextElection, bioguideId);
}

console.log(`Updated ${legislators.length} Congress members`);

// ---- President & VP ----
update.run('2029-01-20', '2028-11-03', 'POTUS');
update.run('2029-01-20', '2028-11-03', 'VPOTUS');

// ---- Governors (term end dates vary by state) ----
const governorTerms: Record<string, { termEnd: string; nextElection: string }> = {
  // 2026 elections (term ends Jan 2027)
  'AL': { termEnd: '2027-01-18', nextElection: '2026-11-03' },
  'AK': { termEnd: '2026-12-07', nextElection: '2026-11-03' },
  'AZ': { termEnd: '2027-01-02', nextElection: '2026-11-03' },
  'AR': { termEnd: '2027-01-14', nextElection: '2026-11-03' },
  'CA': { termEnd: '2027-01-04', nextElection: '2026-11-03' },
  'CO': { termEnd: '2027-01-14', nextElection: '2026-11-03' },
  'CT': { termEnd: '2027-01-04', nextElection: '2026-11-03' },
  'FL': { termEnd: '2027-01-03', nextElection: '2026-11-03' },
  'GA': { termEnd: '2027-01-11', nextElection: '2026-11-03' },
  'HI': { termEnd: '2026-12-07', nextElection: '2026-11-03' },
  'ID': { termEnd: '2027-01-04', nextElection: '2026-11-03' },
  'IL': { termEnd: '2027-01-13', nextElection: '2026-11-03' },
  'IA': { termEnd: '2027-01-15', nextElection: '2026-11-03' },
  'ME': { termEnd: '2027-01-06', nextElection: '2026-11-03' },
  'MD': { termEnd: '2027-01-15', nextElection: '2026-11-03' },
  'MA': { termEnd: '2027-01-08', nextElection: '2026-11-03' },
  'MI': { termEnd: '2027-01-01', nextElection: '2026-11-03' },
  'MN': { termEnd: '2027-01-04', nextElection: '2026-11-03' },
  'NE': { termEnd: '2027-01-09', nextElection: '2026-11-03' },
  'NV': { termEnd: '2027-01-03', nextElection: '2026-11-03' },
  'NH': { termEnd: '2027-01-06', nextElection: '2026-11-03' },
  'NM': { termEnd: '2027-01-01', nextElection: '2026-11-03' },
  'NY': { termEnd: '2027-01-01', nextElection: '2026-11-03' },
  'OH': { termEnd: '2027-01-11', nextElection: '2026-11-03' },
  'OK': { termEnd: '2027-01-10', nextElection: '2026-11-03' },
  'OR': { termEnd: '2027-01-13', nextElection: '2026-11-03' },
  'PA': { termEnd: '2027-01-17', nextElection: '2026-11-03' },
  'RI': { termEnd: '2027-01-05', nextElection: '2026-11-03' },
  'SC': { termEnd: '2027-01-13', nextElection: '2026-11-03' },
  'SD': { termEnd: '2027-01-10', nextElection: '2026-11-03' },
  'TN': { termEnd: '2027-01-16', nextElection: '2026-11-03' },
  'TX': { termEnd: '2027-01-19', nextElection: '2026-11-03' },
  'VT': { termEnd: '2027-01-09', nextElection: '2026-11-03' },
  'WI': { termEnd: '2027-01-04', nextElection: '2026-11-03' },
  'WY': { termEnd: '2027-01-02', nextElection: '2026-11-03' },
  // 2028 elections (term ends Jan 2029)
  'DE': { termEnd: '2029-01-16', nextElection: '2028-11-07' },
  'IN': { termEnd: '2029-01-13', nextElection: '2028-11-07' },
  'KY': { termEnd: '2027-12-12', nextElection: '2027-11-02' },
  'LA': { termEnd: '2028-01-08', nextElection: '2027-11-02' },
  'MS': { termEnd: '2028-01-09', nextElection: '2027-11-07' },
  'MO': { termEnd: '2029-01-08', nextElection: '2028-11-07' },
  'MT': { termEnd: '2029-01-06', nextElection: '2028-11-07' },
  'NJ': { termEnd: '2030-01-21', nextElection: '2029-11-06' },
  'NC': { termEnd: '2029-01-08', nextElection: '2028-11-07' },
  'ND': { termEnd: '2028-12-15', nextElection: '2028-11-07' },
  'UT': { termEnd: '2029-01-01', nextElection: '2028-11-07' },
  'VA': { termEnd: '2030-01-11', nextElection: '2029-11-06' },
  'WA': { termEnd: '2029-01-15', nextElection: '2028-11-07' },
  'WV': { termEnd: '2029-01-13', nextElection: '2028-11-07' },
  'KS': { termEnd: '2027-01-13', nextElection: '2026-11-03' },
};

for (const [state, term] of Object.entries(governorTerms)) {
  update.run(term.termEnd, term.nextElection, `GOV-${state}`);
}
console.log('Updated governor terms');

// ---- NY Statewide officers (same cycle as governor) ----
update.run('2027-01-01', '2026-11-03', 'NY-LTGOV');
update.run('2027-01-01', '2026-11-03', 'NY-AG');
update.run('2027-01-01', '2026-11-03', 'NY-COMP');

// ---- NY State Legislators (2-year terms, next election Nov 2026) ----
const nyStateSenateDistricts = db.prepare("SELECT bioguide_id FROM politicians WHERE bioguide_id LIKE 'NYSEN-%'").all() as { bioguide_id: string }[];
for (const s of nyStateSenateDistricts) {
  update.run('2027-01-01', '2026-11-03', s.bioguide_id);
}
const nyAssemblyDistricts = db.prepare("SELECT bioguide_id FROM politicians WHERE bioguide_id LIKE 'NYASM-%'").all() as { bioguide_id: string }[];
for (const a of nyAssemblyDistricts) {
  update.run('2027-01-01', '2026-11-03', a.bioguide_id);
}
console.log('Updated NY state legislator terms');

// ---- NYC Officials (4-year terms, elected 2025, term ends Dec 2029) ----
const nycIds = db.prepare("SELECT bioguide_id FROM politicians WHERE bioguide_id LIKE 'NYC-%'").all() as { bioguide_id: string }[];
for (const n of nycIds) {
  update.run('2029-12-31', '2029-11-04', n.bioguide_id);
}
console.log('Updated NYC official terms');

// Other state officers
update.run('2027-01-01', '2026-11-03', 'CA-LTGOV');
update.run('2027-01-01', '2026-11-03', 'CA-AG');
update.run('2027-01-19', '2026-11-03', 'TX-LTGOV');
update.run('2027-01-19', '2026-11-03', 'TX-AG');
update.run('2027-01-03', '2026-11-03', 'FL-LTGOV');
update.run('2027-01-03', '2026-11-03', 'FL-AG');

console.log('Done! All term dates updated.');
db.close();
