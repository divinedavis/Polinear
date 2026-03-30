import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const CONGRESS_API_KEY = process.env.CONGRESS_GOV_API_KEY || '';
const FEC_API_KEY = process.env.FEC_API_KEY || '';

fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  DROP TABLE IF EXISTS positions;
  DROP TABLE IF EXISTS pacs;
  DROP TABLE IF EXISTS bills;
  DROP TABLE IF EXISTS politicians;

  CREATE TABLE politicians (
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
    city TEXT,
    council_district TEXT,
    state_senate_district TEXT,
    state_assembly_district TEXT,
    photo_url TEXT,
    birthplace TEXT,
    birthday TEXT,
    website TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    politician_id INTEGER NOT NULL,
    bill_id TEXT,
    title TEXT NOT NULL,
    vote TEXT,
    date TEXT,
    description TEXT,
    FOREIGN KEY (politician_id) REFERENCES politicians(id)
  );

  CREATE TABLE pacs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    politician_id INTEGER NOT NULL,
    pac_name TEXT NOT NULL,
    amount REAL,
    cycle TEXT,
    FOREIGN KEY (politician_id) REFERENCES politicians(id)
  );

  CREATE TABLE positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    politician_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    stance TEXT NOT NULL,
    citation TEXT,
    source_url TEXT,
    FOREIGN KEY (politician_id) REFERENCES politicians(id)
  );

  CREATE INDEX idx_politicians_state ON politicians(state);
  CREATE INDEX idx_politicians_district ON politicians(state, district);
  CREATE INDEX idx_politicians_level ON politicians(level);
  CREATE INDEX idx_politicians_city ON politicians(city);
  CREATE INDEX idx_politicians_council ON politicians(state, council_district);
  CREATE INDEX idx_politicians_state_senate ON politicians(state, state_senate_district);
  CREATE INDEX idx_politicians_state_assembly ON politicians(state, state_assembly_district);
  CREATE INDEX idx_bills_politician ON bills(politician_id);
  CREATE INDEX idx_pacs_politician ON pacs(politician_id);
  CREATE INDEX idx_positions_politician ON positions(politician_id);
`);

const insertPolitician = db.prepare(`
  INSERT OR REPLACE INTO politicians (bioguide_id, name, first_name, last_name, office, level, party, state, district, city, council_district, state_senate_district, state_assembly_district, photo_url, birthplace, birthday, website, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const insertBill = db.prepare(`INSERT INTO bills (politician_id, bill_id, title, vote, date, description) VALUES (?, ?, ?, ?, ?, ?)`);
const insertPac = db.prepare(`INSERT INTO pacs (politician_id, pac_name, amount, cycle) VALUES (?, ?, ?, ?)`);
const insertPosition = db.prepare(`INSERT INTO positions (politician_id, topic, stance, citation, source_url) VALUES (?, ?, ?, ?, ?)`);

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ---- FEDERAL: Congress members ----
function loadLegislators() {
  console.log('Loading Congress members...');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'legislators-current.json'), 'utf-8'));
  console.log(`Found ${data.length} legislators`);

  for (const leg of data) {
    const latestTerm = leg.terms[leg.terms.length - 1];
    const bioguideId = leg.id.bioguide;
    const name = leg.name.official_full || `${leg.name.first} ${leg.name.last}`;
    const party = latestTerm.party;
    const state = latestTerm.state;
    const district = latestTerm.type === 'rep' ? String(latestTerm.district) : null;
    const office = latestTerm.type === 'sen' ? `U.S. Senator - ${state}` : `U.S. Representative - ${state} District ${district}`;
    const photoUrl = `https://theunitedstates.io/images/congress/450x550/${bioguideId}.jpg`;

    insertPolitician.run(bioguideId, name, leg.name.first, leg.name.last, office, 'federal', party, state, district, null, null, null, null, photoUrl, latestTerm.state, leg.bio?.birthday || null, latestTerm.url || null);
  }
}

// ---- FEDERAL: President + VP ----
function loadExecutive() {
  console.log('Adding President and VP...');
  insertPolitician.run('POTUS', 'Donald J. Trump', 'Donald', 'Trump', 'President of the United States', 'federal', 'Republican', 'US', null, null, null, null, null, null, 'Queens, New York', '1946-06-14', null);
  insertPolitician.run('VPOTUS', 'J.D. Vance', 'J.D.', 'Vance', 'Vice President of the United States', 'federal', 'Republican', 'US', null, null, null, null, null, null, 'Middletown, Ohio', '1984-08-02', null);
}

// ---- STATE: Governors ----
function loadGovernors() {
  console.log('Loading governors...');
  const governors = [
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
    { name: 'Kelly Ayotte', state: 'NH', party: 'Republican', born: 'Nashua, New Hampshire' },
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
    { name: 'Derek Kawakami', state: 'KS', party: 'Republican', born: 'Kansas' },
  ];

  for (const gov of governors) {
    insertPolitician.run(`GOV-${gov.state}`, gov.name, gov.name.split(' ')[0], gov.name.split(' ').pop(), `Governor of ${getStateName(gov.state)}`, 'state', gov.party, gov.state, null, null, null, null, null, null, gov.born, null, null);
  }
}

// ---- STATE: Statewide officers (AG, Comptroller, Lt Gov for all states) ----
function loadStatewideOfficers() {
  console.log('Loading statewide officers...');
  // NY statewide officers (we can expand this to all states later)
  const nyOfficers = [
    { id: 'NY-LTGOV', name: 'Antonio Delgado', office: 'Lieutenant Governor of New York', party: 'Democrat', born: 'Schenectady, New York' },
    { id: 'NY-AG', name: 'Letitia James', office: 'Attorney General of New York', party: 'Democrat', born: 'Brooklyn, New York' },
    { id: 'NY-COMP', name: 'Thomas DiNapoli', office: 'Comptroller of New York', party: 'Democrat', born: 'Mineola, New York' },
  ];

  for (const officer of nyOfficers) {
    insertPolitician.run(officer.id, officer.name, officer.name.split(' ')[0], officer.name.split(' ').pop(), officer.office, 'state', officer.party, 'NY', null, null, null, null, null, null, officer.born, null, null);
  }

  // Add other major states' statewide officers
  const caOfficers = [
    { id: 'CA-LTGOV', name: 'Eleni Kounalakis', office: 'Lieutenant Governor of California', party: 'Democrat', born: 'Sacramento, California' },
    { id: 'CA-AG', name: 'Rob Bonta', office: 'Attorney General of California', party: 'Democrat', born: 'Alameda, California' },
  ];
  const txOfficers = [
    { id: 'TX-LTGOV', name: 'Dan Patrick', office: 'Lieutenant Governor of Texas', party: 'Republican', born: 'Baltimore, Maryland' },
    { id: 'TX-AG', name: 'Ken Paxton', office: 'Attorney General of Texas', party: 'Republican', born: 'Wichita Falls, Texas' },
  ];
  const flOfficers = [
    { id: 'FL-LTGOV', name: 'Jeanette Nunez', office: 'Lieutenant Governor of Florida', party: 'Republican', born: 'Miami, Florida' },
    { id: 'FL-AG', name: 'Ashley Moody', office: 'Attorney General of Florida', party: 'Republican', born: 'Plant City, Florida' },
  ];

  for (const officers of [caOfficers, txOfficers, flOfficers]) {
    for (const o of officers) {
      const state = o.id.split('-')[0];
      insertPolitician.run(o.id, o.name, o.name.split(' ')[0], o.name.split(' ').pop(), o.office, 'state', o.party, state, null, null, null, null, null, null, o.born, null, null);
    }
  }
}

// ---- STATE: NY State Legislators (Senate + Assembly) ----
function loadNYStateLegislators() {
  console.log('Loading NY state legislators...');

  // NY State Senators (key districts for NYC)
  const nyStateSenators = [
    { district: '17', name: 'Iwen Chu', party: 'Democrat' },
    { district: '18', name: 'Julia Salazar', party: 'Democrat' },
    { district: '19', name: 'Roxanne J. Persaud', party: 'Democrat' },
    { district: '20', name: 'Zellnor Myrie', party: 'Democrat' },
    { district: '21', name: 'Kevin Parker', party: 'Democrat' },
    { district: '22', name: 'Simcha Felder', party: 'Democrat' },
    { district: '23', name: 'Jessica Scarcella-Spanton', party: 'Democrat' },
    { district: '24', name: 'Cordell Cleare', party: 'Democrat' },
    { district: '25', name: 'Jabari Brisport', party: 'Democrat' },
    { district: '26', name: 'Andrew Gounardes', party: 'Democrat' },
    { district: '27', name: 'Brian Kavanagh', party: 'Democrat' },
    { district: '28', name: 'Liz Krueger', party: 'Democrat' },
    { district: '29', name: 'Jose M. Serrano', party: 'Democrat' },
    { district: '30', name: 'Nathalia Fernandez', party: 'Democrat' },
    { district: '31', name: 'Robert Jackson', party: 'Democrat' },
    { district: '32', name: 'Luis R. Sepulveda', party: 'Democrat' },
    { district: '33', name: 'Gustavo Rivera', party: 'Democrat' },
    { district: '34', name: 'Nathalia Fernandez', party: 'Democrat' },
  ];

  for (const sen of nyStateSenators) {
    insertPolitician.run(`NYSEN-${sen.district}`, sen.name, sen.name.split(' ')[0], sen.name.split(' ').pop(),
      `NY State Senator - District ${sen.district}`, 'state', sen.party, 'NY', null, null, null, sen.district, null, null, null, null, null);
  }

  // NY State Assembly (key NYC districts)
  const nyAssembly = [
    { district: '50', name: 'Emily Gallagher', party: 'Democrat' },
    { district: '51', name: 'Marcela Mitaynes', party: 'Democrat' },
    { district: '52', name: 'Jo Anne Simon', party: 'Democrat' },
    { district: '53', name: 'Maritza Davila', party: 'Democrat' },
    { district: '54', name: 'Erik Martin Dilan', party: 'Democrat' },
    { district: '55', name: 'Latrice Walker', party: 'Democrat' },
    { district: '56', name: 'Stefani Zinerman', party: 'Democrat' },
    { district: '57', name: 'Phara Souffrant Forrest', party: 'Democrat' },
    { district: '58', name: 'Monique Chandler-Waterman', party: 'Democrat' },
    { district: '59', name: 'Jaime R. Williams', party: 'Democrat' },
    { district: '60', name: 'Nikki Lucas', party: 'Democrat' },
    { district: '65', name: 'Grace Lee', party: 'Democrat' },
    { district: '66', name: 'Deborah J. Glick', party: 'Democrat' },
    { district: '67', name: 'Linda B. Rosenthal', party: 'Democrat' },
    { district: '68', name: 'Eddie Gibbs', party: 'Democrat' },
    { district: '69', name: 'Daniel J. O\'Donnell', party: 'Democrat' },
    { district: '70', name: 'Manny De Los Santos', party: 'Democrat' },
    { district: '71', name: 'Al Taylor', party: 'Democrat' },
  ];

  for (const asm of nyAssembly) {
    insertPolitician.run(`NYASM-${asm.district}`, asm.name, asm.name.split(' ')[0], asm.name.split(' ').pop(),
      `NY State Assembly Member - District ${asm.district}`, 'state', asm.party, 'NY', null, null, null, null, asm.district, null, null, null, null);
  }
}

// ---- CITY: NYC Officials ----
function loadNYCOfficials() {
  console.log('Loading NYC officials...');

  // Citywide
  insertPolitician.run('NYC-MAYOR', 'Zohran Mamdani', 'Zohran', 'Mamdani', 'Mayor of New York City', 'local', 'Democrat', 'NY', null, 'New York City', null, null, null, null, 'Queens, New York', null, null);
  insertPolitician.run('NYC-PUBADV', 'Jumaane Williams', 'Jumaane', 'Williams', 'NYC Public Advocate', 'local', 'Democrat', 'NY', null, 'New York City', null, null, null, null, 'Brooklyn, New York', null, null);
  insertPolitician.run('NYC-COMP', 'Mark Levine', 'Mark', 'Levine', 'NYC Comptroller', 'local', 'Democrat', 'NY', null, 'New York City', null, null, null, null, 'New York', null, null);

  // Borough Presidents
  insertPolitician.run('NYC-BP-BK', 'Antonio Reynoso', 'Antonio', 'Reynoso', 'Brooklyn Borough President', 'local', 'Democrat', 'NY', null, 'Brooklyn', null, null, null, null, 'Brooklyn, New York', null, null);
  insertPolitician.run('NYC-BP-MN', 'Mark Levine', 'Mark', 'Levine', 'Manhattan Borough President', 'local', 'Democrat', 'NY', null, 'Manhattan', null, null, null, null, 'New York', null, null);
  insertPolitician.run('NYC-BP-QN', 'Donovan Richards', 'Donovan', 'Richards', 'Queens Borough President', 'local', 'Democrat', 'NY', null, 'Queens', null, null, null, null, 'Queens, New York', null, null);
  insertPolitician.run('NYC-BP-BX', 'Vanessa Gibson', 'Vanessa', 'Gibson', 'Bronx Borough President', 'local', 'Democrat', 'NY', null, 'Bronx', null, null, null, null, 'Bronx, New York', null, null);
  insertPolitician.run('NYC-BP-SI', 'Vito Fossella', 'Vito', 'Fossella', 'Staten Island Borough President', 'local', 'Republican', 'NY', null, 'Staten Island', null, null, null, null, 'Staten Island, New York', null, null);

  // Brooklyn District Attorney
  insertPolitician.run('NYC-DA-BK', 'Eric Gonzalez', 'Eric', 'Gonzalez', 'Brooklyn District Attorney', 'local', 'Democrat', 'NY', null, 'Brooklyn', null, null, null, null, 'Brooklyn, New York', null, null);

  // NYC City Council - Brooklyn districts
  const brooklynCouncil = [
    { district: '33', name: 'Lincoln Restler', party: 'Democrat' },
    { district: '34', name: 'Jennifer Gutierrez', party: 'Democrat' },
    { district: '35', name: 'Crystal Hudson', party: 'Democrat' },
    { district: '36', name: 'Chi Osse', party: 'Democrat' },
    { district: '37', name: 'Sandy Nurse', party: 'Democrat' },
    { district: '38', name: 'Alexa Aviles', party: 'Democrat' },
    { district: '39', name: 'Shahana Hanif', party: 'Democrat' },
    { district: '40', name: 'Rita Joseph', party: 'Democrat' },
    { district: '41', name: 'Darlene Mealy', party: 'Democrat' },
    { district: '42', name: 'Charles Barron', party: 'Democrat' },
    { district: '43', name: 'Susan Zhuang', party: 'Democrat' },
    { district: '44', name: 'Kalman Yeger', party: 'Democrat' },
    { district: '45', name: 'Farah Louis', party: 'Democrat' },
    { district: '46', name: 'Mercedes Narcisse', party: 'Democrat' },
    { district: '47', name: 'Ari Kagan', party: 'Republican' },
    { district: '48', name: 'Inna Vernikov', party: 'Republican' },
  ];

  for (const cm of brooklynCouncil) {
    insertPolitician.run(`NYC-CC-${cm.district}`, cm.name, cm.name.split(' ')[0], cm.name.split(' ').pop(),
      `NYC City Council Member - District ${cm.district}`, 'local', cm.party, 'NY', null, 'Brooklyn', cm.district, null, null, null, null, null, null);
  }

  // Manhattan council members
  const manhattanCouncil = [
    { district: '1', name: 'Christopher Marte', party: 'Democrat' },
    { district: '2', name: 'Carlina Rivera', party: 'Democrat' },
    { district: '3', name: 'Erik Bottcher', party: 'Democrat' },
    { district: '4', name: 'Keith Powers', party: 'Democrat' },
    { district: '5', name: 'Julie Menin', party: 'Democrat' },
    { district: '6', name: 'Gale Brewer', party: 'Democrat' },
    { district: '7', name: 'Shaun Abreu', party: 'Democrat' },
    { district: '9', name: 'Yusef Salaam', party: 'Democrat' },
    { district: '10', name: 'Carmen De La Rosa', party: 'Democrat' },
  ];

  for (const cm of manhattanCouncil) {
    insertPolitician.run(`NYC-CC-${cm.district}`, cm.name, cm.name.split(' ')[0], cm.name.split(' ').pop(),
      `NYC City Council Member - District ${cm.district}`, 'local', cm.party, 'NY', null, 'Manhattan', cm.district, null, null, null, null, null, null);
  }
}

// ---- ENRICHMENT: Bills from Congress.gov ----
async function loadBills() {
  console.log('Fetching sponsored bills...');
  if (!CONGRESS_API_KEY) { console.log('  Skipping - no API key'); return; }

  const politicians = db.prepare(`SELECT id, bioguide_id FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%' AND bioguide_id NOT LIKE 'NY%' AND bioguide_id NOT LIKE 'CA%' AND bioguide_id NOT LIKE 'TX%' AND bioguide_id NOT LIKE 'FL%' AND bioguide_id NOT LIKE 'NYC%'`).all() as { id: number; bioguide_id: string }[];

  let count = 0;
  for (const pol of politicians) {
    try {
      const res = await fetch(
        `https://api.congress.gov/v3/member/${pol.bioguide_id}/sponsored-legislation?limit=5&api_key=${CONGRESS_API_KEY}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const currentYear = new Date().getFullYear().toString();

      for (const bill of (data?.sponsoredLegislation || []).filter((b: { introducedDate?: string }) => b.introducedDate?.startsWith(currentYear)).slice(0, 5)) {
        insertBill.run(pol.id, bill.number || '', bill.title || 'Untitled', 'Sponsored', bill.introducedDate || '', bill.latestAction?.text || '');
      }

      count++;
      if (count % 50 === 0) { console.log(`  Bills: ${count}/${politicians.length}`); await sleep(1000); }
    } catch { /* skip */ }
  }
  console.log(`Bills loaded for ${count} politicians`);
}

// ---- ENRICHMENT: PAC contributions from FEC ----
async function loadPacs() {
  console.log('Fetching PAC contributions...');
  if (!FEC_API_KEY) { console.log('  Skipping - no API key'); return; }

  const politicians = db.prepare(`SELECT id, name, first_name, last_name FROM politicians WHERE level = 'federal' AND bioguide_id NOT IN ('POTUS', 'VPOTUS') AND bioguide_id NOT LIKE 'GOV-%'`).all() as { id: number; name: string; first_name: string; last_name: string }[];

  let count = 0;
  const cycle = new Date().getFullYear();
  const adjustedCycle = cycle % 2 === 0 ? cycle : cycle - 1;

  for (const pol of politicians) {
    try {
      // Search by last name for better match
      const searchRes = await fetch(
        `https://api.open.fec.gov/v1/candidates/search/?q=${encodeURIComponent(pol.last_name)}&state=&sort=receipts&per_page=5&api_key=${FEC_API_KEY}`
      );
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();

      // Find best match by name
      const candidate = searchData?.results?.find((c: { name: string }) =>
        c.name.toLowerCase().includes(pol.last_name.toLowerCase()) &&
        c.name.toLowerCase().includes(pol.first_name.toLowerCase().charAt(0))
      );
      if (!candidate) continue;

      const contribRes = await fetch(
        `https://api.open.fec.gov/v1/schedules/schedule-a/?candidate_id=${candidate.candidate_id}&cycle=${adjustedCycle}&sort=-contribution_receipt_amount&per_page=5&is_individual=false&api_key=${FEC_API_KEY}`
      );
      if (!contribRes.ok) continue;
      const contribData = await contribRes.json();

      for (const contrib of contribData?.results || []) {
        insertPac.run(pol.id, contrib.contributor_name, contrib.contribution_receipt_amount, String(adjustedCycle));
      }

      count++;
      if (count % 20 === 0) { console.log(`  PACs: ${count}/${politicians.length}`); await sleep(3000); }
      await sleep(500); // FEC rate limit
    } catch { /* skip */ }
  }
  console.log(`PACs loaded for ${count} politicians`);
}

// ---- ENRICHMENT: Positions from OnTheIssues ----
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
      const res = await fetch(`https://www.ontheissues.org/${urlName}.htm`, { headers: { 'User-Agent': 'Polinear/1.0' } });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);
      const bodyText = $('body').text().replace(/\s+/g, ' ');
      const sentences = bodyText.split(/[.!?]+/);

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
      if (count % 30 === 0) { console.log(`  Positions: ${count}/${politicians.length}`); await sleep(1000); }
    } catch { /* skip */ }
  }
  console.log(`Positions loaded for ${count} politicians`);
}

function getStateName(abbr: string): string {
  const names: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  };
  return names[abbr] || abbr;
}

async function main() {
  console.log('Starting full data ingestion...');
  console.log('================================');

  loadLegislators();
  loadExecutive();
  loadGovernors();
  loadStatewideOfficers();
  loadNYStateLegislators();
  loadNYCOfficials();

  const total = (db.prepare('SELECT COUNT(*) as count FROM politicians').get() as { count: number }).count;
  console.log(`\nLoaded ${total} politicians into database`);

  console.log('\nLoading enrichment data...');
  await loadBills();
  await loadPacs();
  await loadPositions();

  const billCount = (db.prepare('SELECT COUNT(*) as count FROM bills').get() as { count: number }).count;
  const pacCount = (db.prepare('SELECT COUNT(*) as count FROM pacs').get() as { count: number }).count;
  const posCount = (db.prepare('SELECT COUNT(*) as count FROM positions').get() as { count: number }).count;
  console.log(`\nFinal counts: ${total} politicians, ${billCount} bills, ${pacCount} PACs, ${posCount} positions`);

  db.close();
}

main().catch(console.error);
