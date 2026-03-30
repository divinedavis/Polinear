import Database from 'better-sqlite3';
import path from 'path';
import Redis from 'ioredis';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const db = new Database(DB_PATH);
const redis = new Redis();

const insertPosition = db.prepare('INSERT INTO positions (politician_id, topic, stance, citation, source_url) VALUES (?, ?, ?, ?, ?)');
const clearPositions = db.prepare('DELETE FROM positions WHERE politician_id = ?');

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const TOPICS: Record<string, string[]> = {
  'Israel': ['israel', 'gaza', 'palestinian', 'hamas'],
  'Taxes': ['tax', 'taxation', 'irs', 'tax cut'],
  'Abortion': ['abort', 'pro-life', 'pro-choice', 'reproductive'],
  'Religion': ['religio', 'faith', 'church', 'prayer'],
  'Affordable Housing': ['housing', 'rent', 'homeless', 'affordable hous'],
};

async function main() {
  const cheerio = await import('cheerio');

  // Only scrape Congress members (skip POTUS/VP which are manually curated)
  const politicians = db.prepare(
    "SELECT id, first_name, last_name, name FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%' AND bioguide_id NOT LIKE 'NY%' AND bioguide_id NOT LIKE 'CA%' AND bioguide_id NOT LIKE 'TX%' AND bioguide_id NOT LIKE 'FL%' AND bioguide_id NOT LIKE 'NYC%'"
  ).all() as { id: number; first_name: string; last_name: string; name: string }[];

  console.log(`[${new Date().toISOString()}] Refreshing positions for ${politicians.length} Congress members...`);
  let updated = 0;

  for (const pol of politicians) {
    try {
      const urlName = pol.first_name + '_' + pol.last_name;
      const res = await fetch('https://www.ontheissues.org/' + urlName + '.htm', {
        headers: { 'User-Agent': 'Polinear/1.0' },
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      const bodyText = $('body').text().replace(/\s+/g, ' ');
      const sentences = bodyText.split(/[.!?]+/);
      let found = 0;

      clearPositions.run(pol.id);
      for (const [topic, keywords] of Object.entries(TOPICS)) {
        for (const sentence of sentences) {
          const lower = sentence.toLowerCase();
          if (keywords.some(kw => lower.includes(kw))) {
            const trimmed = sentence.trim();
            if (trimmed.length > 20 && trimmed.length < 300) {
              insertPosition.run(pol.id, topic, trimmed + '.', 'OnTheIssues.org', 'https://www.ontheissues.org/' + urlName + '.htm');
              found++;
              break;
            }
          }
        }
      }

      if (found > 0) updated++;
      if (updated % 30 === 0 && updated > 0) {
        console.log(`  Progress: ${updated}`);
        await sleep(1000);
      }
    } catch { /* skip */ }
  }

  await redis.flushall();
  console.log(`Done! Updated positions for ${updated} politicians. Cache flushed.`);
  redis.disconnect();
  db.close();
}

main().catch(console.error);
