import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import Redis from 'ioredis';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const FEC_API_KEY = process.env.FEC_API_KEY || '';
const db = new Database(DB_PATH);
const redis = new Redis();

const legislators = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'legislators-current.json'), 'utf-8'));
const fecMap = new Map<string, string[]>();
for (const leg of legislators) {
  fecMap.set(leg.id.bioguide, leg.id.fec || []);
}

const insertPac = db.prepare('INSERT INTO pacs (politician_id, pac_name, amount, cycle) VALUES (?, ?, ?, ?)');
const clearPacs = db.prepare('DELETE FROM pacs WHERE politician_id = ?');

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (!FEC_API_KEY) { console.error('No FEC_API_KEY set'); process.exit(1); }

  const politicians = db.prepare(
    "SELECT id, bioguide_id, name FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%' AND bioguide_id NOT LIKE 'NY%' AND bioguide_id NOT LIKE 'CA%' AND bioguide_id NOT LIKE 'TX%' AND bioguide_id NOT LIKE 'FL%' AND bioguide_id NOT LIKE 'NYC%'"
  ).all() as { id: number; bioguide_id: string; name: string }[];

  console.log(`[${new Date().toISOString()}] Refreshing PACs for ${politicians.length} Congress members...`);
  let loaded = 0;

  for (const pol of politicians) {
    const fecIds = fecMap.get(pol.bioguide_id);
    if (!fecIds || fecIds.length === 0) continue;

    for (const fecId of [...fecIds].reverse()) {
      try {
        const comRes = await fetch(`https://api.open.fec.gov/v1/candidate/${fecId}/committees/?api_key=${FEC_API_KEY}`);
        if (!comRes.ok) continue;
        const comData = await comRes.json();
        const principal = comData?.results?.find((c: { designation_full: string }) => c.designation_full === 'Principal campaign committee');
        const committee = principal || comData?.results?.[0];
        if (!committee) continue;

        await sleep(500);

        let results: { contributor_name: string; contribution_receipt_amount: number }[] = [];
        for (const cycle of [2026, 2024]) {
          const contribRes = await fetch(
            `https://api.open.fec.gov/v1/schedules/schedule_a/?committee_id=${committee.committee_id}&two_year_transaction_period=${cycle}&sort=-contribution_receipt_amount&per_page=5&is_individual=false&api_key=${FEC_API_KEY}`
          );
          if (contribRes.ok) {
            const contribData = await contribRes.json();
            results = contribData?.results || [];
            if (results.length > 0) {
              clearPacs.run(pol.id);
              for (const r of results) {
                insertPac.run(pol.id, r.contributor_name || 'Unknown', r.contribution_receipt_amount, String(cycle));
              }
              loaded++;
              break;
            }
          }
          await sleep(500);
        }
        break;
      } catch { /* skip */ }
      await sleep(500);
    }

    if (loaded % 20 === 0 && loaded > 0) {
      console.log(`  Progress: ${loaded}/${politicians.length}`);
    }
    await sleep(500);
  }

  await redis.flushall();
  console.log(`Done! Updated PACs for ${loaded} politicians. Cache flushed.`);
  redis.disconnect();
  db.close();
}

main().catch(console.error);
