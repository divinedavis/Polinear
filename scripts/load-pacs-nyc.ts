import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const FEC_API_KEY = process.env.FEC_API_KEY || '';
const db = new Database(DB_PATH);

const legislators = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'legislators-current.json'), 'utf-8'));
const fecMap = new Map<string, string[]>();
for (const leg of legislators) {
  fecMap.set(leg.id.bioguide, leg.id.fec || []);
}

const insertPac = db.prepare('INSERT INTO pacs (politician_id, pac_name, amount, cycle) VALUES (?, ?, ?, ?)');
const clearPacs = db.prepare('DELETE FROM pacs WHERE politician_id = ?');

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPacsForCommittee(committeeId: string, cycle: number): Promise<{ contributor_name: string; contribution_receipt_amount: number }[]> {
  const res = await fetch(
    `https://api.open.fec.gov/v1/schedules/schedule_a/?committee_id=${committeeId}&two_year_transaction_period=${cycle}&sort=-contribution_receipt_amount&per_page=5&is_individual=false&api_key=${FEC_API_KEY}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data?.results || [];
}

async function main() {
  const nyPols = db.prepare(
    "SELECT id, bioguide_id, name FROM politicians WHERE state = 'NY' AND level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS')"
  ).all() as { id: number; bioguide_id: string; name: string }[];

  console.log(`Processing ${nyPols.length} NY federal politicians...\n`);
  let loaded = 0;

  for (const pol of nyPols) {
    const fecIds = fecMap.get(pol.bioguide_id);
    if (!fecIds || fecIds.length === 0) { console.log(`  SKIP ${pol.name} - no FEC ID`); continue; }

    let found = false;
    for (const fecId of [...fecIds].reverse()) {
      if (found) break;
      try {
        // Get committees, find principal campaign committee
        const comRes = await fetch(`https://api.open.fec.gov/v1/candidate/${fecId}/committees/?api_key=${FEC_API_KEY}`);
        if (!comRes.ok) continue;
        const comData = await comRes.json();

        const principal = comData?.results?.find((c: { designation_full: string }) => c.designation_full === 'Principal campaign committee');
        const committee = principal || comData?.results?.[0];
        if (!committee) continue;

        await sleep(400);

        // Try 2026 cycle first, then 2024
        let results = await fetchPacsForCommittee(committee.committee_id, 2026);
        let usedCycle = '2026';
        if (results.length === 0) {
          await sleep(400);
          results = await fetchPacsForCommittee(committee.committee_id, 2024);
          usedCycle = '2024';
        }

        if (results.length > 0) {
          clearPacs.run(pol.id);
          for (const r of results) {
            insertPac.run(pol.id, r.contributor_name || 'Unknown', r.contribution_receipt_amount, usedCycle);
          }
          loaded++;
          found = true;
          console.log(`  ${pol.name} (${usedCycle}): ${results.length} PACs`);
        } else {
          console.log(`  ${pol.name}: no PAC data`);
        }
      } catch (e) {
        console.error(`  Error ${pol.name}:`, e);
      }
      await sleep(400);
    }
  }

  console.log(`\nFederal: ${loaded}/${nyPols.length} loaded`);

  // Verify Brooklyn-specific results
  console.log('\n--- Verifying 251 DeKalb Ave politicians ---');
  const brooklynPols = db.prepare(`
    SELECT p.name, p.office, COUNT(pac.id) as pac_count
    FROM politicians p
    LEFT JOIN pacs pac ON pac.politician_id = p.id
    WHERE (p.state = 'US' OR p.state = 'NY')
      AND (p.bioguide_id IN ('POTUS','VPOTUS')
        OR p.office LIKE '%Senator - NY%'
        OR p.bioguide_id = 'V000081'
        OR p.bioguide_id LIKE 'GOV-NY'
        OR p.bioguide_id IN ('NY-LTGOV','NY-AG','NY-COMP')
        OR p.bioguide_id = 'NYSEN-25'
        OR p.bioguide_id = 'NYASM-57'
        OR p.bioguide_id LIKE 'NYC-%')
    GROUP BY p.id
    ORDER BY p.level, pac_count DESC
  `).all() as { name: string; office: string; pac_count: number }[];

  for (const p of brooklynPols) {
    const status = p.pac_count > 0 ? `${p.pac_count} PACs` : 'NO PACs';
    console.log(`  ${status.padEnd(10)} ${p.name.padEnd(30)} ${p.office}`);
  }

  db.close();
}

main().catch(console.error);
