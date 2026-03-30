import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const CONGRESS_API_KEY = process.env.CONGRESS_GOV_API_KEY || '';
const FEC_API_KEY = process.env.FEC_API_KEY || '';

// Ensure data dir exists
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS politicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bioguide_id TEXT UNIQUE,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    office TEXT NOT NULL,
    level TEXT NOT NULL,
    party TEXT,
    state TEXT,
    district TEXT,
    photo_url TEXT,
    birthplace TEXT,
    birthday TEXT,
    website TEXT,
    phone TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    politician_id INTEGER NOT NULL,
    bill_id TEXT,
    title TEXT NOT NULL,
    vote TEXT,
    date TEXT,
    description TEXT,
    FOREIGN KEY (politician_id) REFERENCES politicians(id)
  );
  CREATE TABLE IF NOT EXISTS pacs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    politician_id INTEGER NOT NULL,
    pac_name TEXT NOT NULL,
    amount REAL,
    cycle TEXT,
    FOREIGN KEY (politician_id) REFERENCES politicians(id)
  );
  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    politician_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    stance TEXT NOT NULL,
    citation TEXT,
    source_url TEXT,
    FOREIGN KEY (politician_id) REFERENCES politicians(id)
  );
  CREATE INDEX IF NOT EXISTS idx_politicians_state ON politicians(state);
  CREATE INDEX IF NOT EXISTS idx_politicians_district ON politicians(state, district);
  CREATE INDEX IF NOT EXISTS idx_politicians_level ON politicians(level);
  CREATE INDEX IF NOT EXISTS idx_bills_politician ON bills(politician_id);
  CREATE INDEX IF NOT EXISTS idx_pacs_politician ON pacs(politician_id);
  CREATE INDEX IF NOT EXISTS idx_positions_politician ON positions(politician_id);
`);

const insertPolitician = db.prepare(`
  INSERT OR REPLACE INTO politicians (bioguide_id, name, first_name, last_name, office, level, party, state, district, photo_url, birthplace, birthday, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const insertBill = db.prepare(`INSERT INTO bills (politician_id, bill_id, title, vote, date, description) VALUES (?, ?, ?, ?, ?, ?)`);
const insertPac = db.prepare(`INSERT INTO pacs (politician_id, pac_name, amount, cycle) VALUES (?, ?, ?, ?)`);
const insertPosition = db.prepare(`INSERT INTO positions (politician_id, topic, stance, citation, source_url) VALUES (?, ?, ?, ?, ?)`);
const clearBills = db.prepare(`DELETE FROM bills WHERE politician_id = ?`);
const clearPacs = db.prepare(`DELETE FROM pacs WHERE politician_id = ?`);
const clearPositions = db.prepare(`DELETE FROM positions WHERE politician_id = ?`);

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// ---- STEP 1: Load all current Congress members from unitedstates project ----
async function loadLegislators() {
  console.log('Fetching current legislators...');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'legislators-current.json'), 'utf-8'));
  console.log(`Found ${data.length} current legislators`);

  for (const leg of data) {
    const latestTerm = leg.terms[leg.terms.length - 1];
    const bioguideId = leg.id.bioguide;
    const name = leg.name.official_full || `${leg.name.first} ${leg.name.last}`;
    const firstName = leg.name.first;
    const lastName = leg.name.last;
    const party = latestTerm.party === 'Democrat' ? 'Democrat' : latestTerm.party === 'Republican' ? 'Republican' : latestTerm.party;
    const state = latestTerm.state;
    const district = latestTerm.type === 'rep' ? String(latestTerm.district) : null;
    const office = latestTerm.type === 'sen' ? `U.S. Senator - ${state}` : `U.S. Representative - ${state} District ${district}`;
    const photoUrl = `https://theunitedstates.io/images/congress/450x550/${bioguideId}.jpg`;
    const birthday = leg.bio?.birthday || null;
    const birthState = latestTerm.state || null;

    insertPolitician.run(bioguideId, name, firstName, lastName, office, 'federal', party, state, district, photoUrl, birthState, birthday);
  }
  console.log('Legislators loaded into DB');
}

// ---- STEP 2: Add President and VP ----
function loadExecutive() {
  console.log('Adding President and VP...');
  insertPolitician.run('POTUS', 'Donald J. Trump', 'Donald', 'Trump', 'President of the United States', 'federal', 'Republican', 'US', null,
    'https://www.whitehouse.gov/wp-content/uploads/2025/01/P20250120AS-0282-scaled.jpg', 'Queens, New York', '1946-06-14');
  insertPolitician.run('VPOTUS', 'J.D. Vance', 'J.D.', 'Vance', 'Vice President of the United States', 'federal', 'Republican', 'US', null,
    'https://www.whitehouse.gov/wp-content/uploads/2025/01/P20250120AS-1539-scaled.jpg', 'Middletown, Ohio', '1984-08-02');
}

// ---- STEP 3: Load governors ----
async function loadGovernors() {
  console.log('Fetching governors...');
  // Governors loaded from static list below

  // This file has presidents. For governors we use a static list since there's no free API
  const governors: { name: string; state: string; party: string; born: string }[] = [
    { name: 'Kay Ivey', state: 'AL', party: 'Republican', born: 'Camden, Alabama' },
    { name: 'Mike Dunleavy', state: 'AK', party: 'Republican', born: 'Scranton, Pennsylvania' },
    { name: 'Katie Hobbs', state: 'AZ', party: 'Democrat', born: 'Tempe, Arizona' },
    { name: 'Sarah Huckabee Sanders', state: 'AR', party: 'Republican', born: 'Hope, Arkansas' },
    { name: 'Gavin Newsom', state: 'CA', party: 'Democrat', born: 'San Francisco, California' },
    { name: 'Jared Polis', state: 'CO', party: 'Democrat', born: 'Boulder, Colorado' },
    { name: 'Ned Lamont', state: 'CT', party: 'Democrat', born: 'Washington, D.C.' },
    { name: 'Matt Meyer', state: 'DE', party: 'Democrat', born: 'Wilmington, Delaware' },
    { name: 'Ron DeSantis', state: 'FL', party: 'Republican', born: 'Jacksonville, Florida' },
    { name: 'Brian Kemp', state: 'GA', party: 'Republican', born: 'Athens, Georgia' },
    { name: 'Josh Green', state: 'HI', party: 'Democrat', born: 'Scranton, Pennsylvania' },
    { name: 'Brad Little', state: 'ID', party: 'Republican', born: 'Emmett, Idaho' },
    { name: 'JB Pritzker', state: 'IL', party: 'Democrat', born: 'Atherton, California' },
    { name: 'Eric Holcomb', state: 'IN', party: 'Republican', born: 'Indianapolis, Indiana' },
    { name: 'Kim Reynolds', state: 'IA', party: 'Republican', born: 'St. Charles, Iowa' },
    { name: 'Kelly Ayotte', state: 'KS', party: 'Republican', born: 'Nashua, New Hampshire' },
    { name: 'Andy Beshear', state: 'KY', party: 'Democrat', born: 'Louisville, Kentucky' },
    { name: 'Jeff Landry', state: 'LA', party: 'Republican', born: 'Carencro, Louisiana' },
    { name: 'Janet Mills', state: 'ME', party: 'Democrat', born: 'Farmington, Maine' },
    { name: 'Wes Moore', state: 'MD', party: 'Democrat', born: 'Takoma Park, Maryland' },
    { name: 'Maura Healey', state: 'MA', party: 'Democrat', born: 'Manchester, New Hampshire' },
    { name: 'Gretchen Whitmer', state: 'MI', party: 'Democrat', born: 'Lansing, Michigan' },
    { name: 'Tim Walz', state: 'MN', party: 'Democrat', born: 'West Point, Nebraska' },
    { name: 'Tate Reeves', state: 'MS', party: 'Republican', born: 'Florence, Mississippi' },
    { name: 'Mike Kehoe', state: 'MO', party: 'Republican', born: 'Jefferson City, Missouri' },
    { name: 'Greg Gianforte', state: 'MT', party: 'Republican', born: 'San Diego, California' },
    { name: 'Jim Pillen', state: 'NE', party: 'Republican', born: 'Columbus, Nebraska' },
    { name: 'Joe Lombardo', state: 'NV', party: 'Republican', born: 'Paterson, New Jersey' },
    { name: 'Kelly Ayotte', state: 'NH', party: 'Republican', born: 'Nashua, New Hampshire' },
    { name: 'Phil Murphy', state: 'NJ', party: 'Democrat', born: 'Needham, Massachusetts' },
    { name: 'Michelle Lujan Grisham', state: 'NM', party: 'Democrat', born: 'Los Alamos, New Mexico' },
    { name: 'Kathy Hochul', state: 'NY', party: 'Democrat', born: 'Buffalo, New York' },
    { name: 'Josh Stein', state: 'NC', party: 'Democrat', born: 'Chapel Hill, North Carolina' },
    { name: 'Kelly Armstrong', state: 'ND', party: 'Republican', born: 'Dickinson, North Dakota' },
    { name: 'Mike DeWine', state: 'OH', party: 'Republican', born: 'Springfield, Ohio' },
    { name: 'Kevin Stitt', state: 'OK', party: 'Republican', born: 'Milton, Florida' },
    { name: 'Tina Kotek', state: 'OR', party: 'Democrat', born: 'Pennsylvania' },
    { name: 'Josh Shapiro', state: 'PA', party: 'Democrat', born: 'Kansas City, Missouri' },
    { name: 'Dan McKee', state: 'RI', party: 'Democrat', born: 'Cumberland, Rhode Island' },
    { name: 'Henry McMaster', state: 'SC', party: 'Republican', born: 'Columbia, South Carolina' },
    { name: 'Larry Rhoden', state: 'SD', party: 'Republican', born: 'Union Center, South Dakota' },
    { name: 'Bill Lee', state: 'TN', party: 'Republican', born: 'Franklin, Tennessee' },
    { name: 'Greg Abbott', state: 'TX', party: 'Republican', born: 'Wichita Falls, Texas' },
    { name: 'Spencer Cox', state: 'UT', party: 'Republican', born: 'Mount Pleasant, Utah' },
    { name: 'Phil Scott', state: 'VT', party: 'Republican', born: 'Barre, Vermont' },
    { name: 'Glenn Youngkin', state: 'VA', party: 'Republican', born: 'Richmond, Virginia' },
    { name: 'Bob Ferguson', state: 'WA', party: 'Democrat', born: 'Seattle, Washington' },
    { name: 'Patrick Morrisey', state: 'WV', party: 'Republican', born: 'New Jersey' },
    { name: 'Tony Evers', state: 'WI', party: 'Democrat', born: 'Plymouth, Wisconsin' },
    { name: 'Mark Gordon', state: 'WY', party: 'Republican', born: 'New York City, New York' },
  ];

  for (const gov of governors) {
    const id = `GOV-${gov.state}`;
    insertPolitician.run(id, gov.name, gov.name.split(' ')[0], gov.name.split(' ').slice(-1)[0],
      `Governor of ${gov.state}`, 'state', gov.party, gov.state, null, null, gov.born, null);
  }
  console.log(`Loaded ${governors.length} governors`);
}

// ---- STEP 4: Fetch bills for each Congress member ----
async function loadBills() {
  console.log('Fetching sponsored bills...');
  const politicians = db.prepare(`SELECT id, bioguide_id FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%'`).all() as { id: number; bioguide_id: string }[];

  let count = 0;
  for (const pol of politicians) {
    try {
      const data = await fetchJson(
        `https://api.congress.gov/v3/member/${pol.bioguide_id}/sponsored-legislation?limit=5&api_key=${CONGRESS_API_KEY}`,
        { 'Accept': 'application/json' }
      );

      clearBills.run(pol.id);
      const bills = data?.sponsoredLegislation || [];
      const currentYear = new Date().getFullYear().toString();

      for (const bill of bills.filter((b: { introducedDate?: string }) => b.introducedDate?.startsWith(currentYear)).slice(0, 5)) {
        insertBill.run(pol.id, bill.number || '', bill.title || 'Untitled', 'Sponsored', bill.introducedDate || '', bill.latestAction?.text || '');
      }

      count++;
      if (count % 50 === 0) {
        console.log(`  Bills: ${count}/${politicians.length}`);
        await sleep(1000); // Rate limit
      }
    } catch (e) {
      // Skip on error, continue with others
    }
  }
  console.log(`Bills loaded for ${count} politicians`);
}

// ---- STEP 5: Fetch PAC data ----
async function loadPacs() {
  console.log('Fetching PAC contributions...');
  const politicians = db.prepare(`SELECT id, name FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%'`).all() as { id: number; name: string }[];

  let count = 0;
  for (const pol of politicians) {
    try {
      const searchData = await fetchJson(
        `https://api.open.fec.gov/v1/candidates/search/?q=${encodeURIComponent(pol.name)}&sort=receipts&api_key=${FEC_API_KEY}`
      );

      const candidate = searchData?.results?.[0];
      if (!candidate) continue;

      const cycle = new Date().getFullYear();
      const adjustedCycle = cycle % 2 === 0 ? cycle : cycle - 1;

      const contribData = await fetchJson(
        `https://api.open.fec.gov/v1/schedules/schedule-a/?candidate_id=${candidate.candidate_id}&cycle=${adjustedCycle}&sort=-contribution_receipt_amount&per_page=5&is_individual=false&api_key=${FEC_API_KEY}`
      );

      clearPacs.run(pol.id);
      for (const contrib of contribData?.results || []) {
        insertPac.run(pol.id, contrib.contributor_name, contrib.contribution_receipt_amount, String(adjustedCycle));
      }

      count++;
      if (count % 20 === 0) {
        console.log(`  PACs: ${count}/${politicians.length}`);
        await sleep(2000); // FEC rate limit
      }
    } catch {
      // Skip
    }
  }
  console.log(`PACs loaded for ${count} politicians`);
}

// ---- STEP 6: Scrape positions from OnTheIssues ----
async function loadPositions() {
  console.log('Scraping political positions...');
  const cheerio = await import('cheerio');
  const politicians = db.prepare(`SELECT id, first_name, last_name FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%'`).all() as { id: number; first_name: string; last_name: string }[];

  const TOPICS: Record<string, string[]> = {
    'Israel': ['israel', 'gaza', 'palestinian', 'hamas'],
    'Taxes': ['tax', 'taxation', 'irs', 'tax cut'],
    'Abortion': ['abort', 'pro-life', 'pro-choice', 'reproductive'],
    'Religion': ['religio', 'faith', 'church', 'prayer'],
    'Affordable Housing': ['housing', 'rent', 'homeless', 'affordable hous'],
  };

  let count = 0;
  for (const pol of politicians) {
    try {
      const urlName = `${pol.first_name}_${pol.last_name}`;
      const res = await fetch(`https://www.ontheissues.org/${urlName}.htm`, {
        headers: { 'User-Agent': 'Polinear/1.0' },
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      const bodyText = $('body').text().replace(/\s+/g, ' ');
      const sentences = bodyText.split(/[.!?]+/);

      clearPositions.run(pol.id);

      for (const [topic, keywords] of Object.entries(TOPICS)) {
        for (const sentence of sentences) {
          const lower = sentence.toLowerCase();
          if (keywords.some(kw => lower.includes(kw))) {
            const trimmed = sentence.trim();
            if (trimmed.length > 20 && trimmed.length < 300) {
              insertPosition.run(pol.id, topic, trimmed + '.', 'OnTheIssues.org', `https://www.ontheissues.org/${urlName}.htm`);
              break;
            }
          }
        }
      }

      count++;
      if (count % 30 === 0) {
        console.log(`  Positions: ${count}/${politicians.length}`);
        await sleep(1000);
      }
    } catch {
      // Skip
    }
  }
  console.log(`Positions loaded for ${count} politicians`);
}

// ---- RUN ----
async function main() {
  console.log('Starting data ingestion...');
  console.log('=========================');

  await loadLegislators();
  loadExecutive();
  await loadGovernors();

  console.log('\nLoading enrichment data (this takes a while)...');
  await loadBills();
  await loadPacs();
  await loadPositions();

  const total = (db.prepare('SELECT COUNT(*) as count FROM politicians').get() as { count: number }).count;
  console.log(`\nDone! ${total} politicians in database.`);
  db.close();
}

main().catch(console.error);
