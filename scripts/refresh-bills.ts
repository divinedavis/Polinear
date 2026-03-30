import Database from 'better-sqlite3';
import path from 'path';
import Redis from 'ioredis';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const CONGRESS_API_KEY = process.env.CONGRESS_GOV_API_KEY || '';
const db = new Database(DB_PATH);
const redis = new Redis();

const insertBill = db.prepare('INSERT INTO bills (politician_id, bill_id, title, vote, date, description) VALUES (?, ?, ?, ?, ?, ?)');
const clearBills = db.prepare('DELETE FROM bills WHERE politician_id = ?');

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (!CONGRESS_API_KEY) { console.error('No CONGRESS_GOV_API_KEY set'); process.exit(1); }

  const politicians = db.prepare(
    "SELECT id, bioguide_id, name FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%' AND bioguide_id NOT LIKE 'NY%' AND bioguide_id NOT LIKE 'CA%' AND bioguide_id NOT LIKE 'TX%' AND bioguide_id NOT LIKE 'FL%' AND bioguide_id NOT LIKE 'NYC%'"
  ).all() as { id: number; bioguide_id: string; name: string }[];

  console.log(`[${new Date().toISOString()}] Refreshing bills for ${politicians.length} Congress members...`);
  const currentYear = new Date().getFullYear().toString();
  let updated = 0;

  for (const pol of politicians) {
    try {
      const res = await fetch(
        `https://api.congress.gov/v3/member/${pol.bioguide_id}/sponsored-legislation?limit=5&api_key=${CONGRESS_API_KEY}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const bills = (data?.sponsoredLegislation || [])
        .filter((b: { introducedDate?: string }) => b.introducedDate?.startsWith(currentYear))
        .slice(0, 5);

      if (bills.length > 0) {
        clearBills.run(pol.id);
        for (const bill of bills) {
          insertBill.run(pol.id, bill.number || '', bill.title || 'Untitled', 'Sponsored', bill.introducedDate || '', bill.latestAction?.text || '');
        }
        updated++;
      }

      if (updated % 50 === 0 && updated > 0) {
        console.log(`  Progress: ${updated}/${politicians.length}`);
        await sleep(1000);
      }
    } catch { /* skip */ }
  }

  // Flush Redis cache
  await redis.flushall();
  console.log(`Done! Updated bills for ${updated} politicians. Cache flushed.`);
  redis.disconnect();
  db.close();
}

main().catch(console.error);
