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

async function main() {
  const nyPols = db.prepare(
    "SELECT id, bioguide_id, name FROM politicians WHERE state = 'NY' AND level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS')"
  ).all() as { id: number; bioguide_id: string; name: string }[];

  console.log(`Processing ${nyPols.length} NY federal politicians...\n`);
  let loaded = 0;

  for (const pol of nyPols) {
    const fecIds = fecMap.get(pol.bioguide_id);
    if (!fecIds || fecIds.length === 0) {
      console.log(`  SKIP ${pol.name} - no FEC ID`);
      continue;
    }

    for (const fecId of [...fecIds].reverse()) {
      try {
        // Step 1: Get principal committee
        const comRes = await fetch(
          `https://api.open.fec.gov/v1/candidate/${fecId}/committees/?api_key=${FEC_API_KEY}`
        );
        if (!comRes.ok) continue;
        const comData = await comRes.json();
        const committee = comData?.results?.[0];
        if (!committee) continue;

        const committeeId = committee.committee_id;
        await sleep(500);

        // Step 2: Get top 5 non-individual contributions
        const contribRes = await fetch(
          `https://api.open.fec.gov/v1/schedules/schedule_a/?committee_id=${committeeId}&two_year_transaction_period=2024&sort=-contribution_receipt_amount&per_page=5&is_individual=false&api_key=${FEC_API_KEY}`
        );
        if (!contribRes.ok) continue;
        const contribData = await contribRes.json();
        const results = contribData?.results || [];

        if (results.length > 0) {
          clearPacs.run(pol.id);
          for (const r of results) {
            insertPac.run(pol.id, r.contributor_name || 'Unknown', r.contribution_receipt_amount, '2024');
          }
          loaded++;
          console.log(`  ${pol.name}: ${results.length} PACs`);
          for (const r of results) {
            console.log(`    $${r.contribution_receipt_amount.toLocaleString()} - ${r.contributor_name}`);
          }
        } else {
          console.log(`  ${pol.name}: no PAC data found`);
        }
        break;
      } catch (e) {
        console.error(`  Error for ${pol.name}:`, e);
      }
      await sleep(500);
    }
    await sleep(500);
  }

  console.log(`\nDone! PAC data loaded for ${loaded}/${nyPols.length} NY politicians`);
  db.close();
}

main().catch(console.error);
