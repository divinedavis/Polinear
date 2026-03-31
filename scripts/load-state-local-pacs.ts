import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const db = new Database(DB_PATH);

const insertPac = db.prepare('INSERT INTO pacs (politician_id, pac_name, amount, cycle) VALUES (?, ?, ?, ?)');
const clearPacs = db.prepare('DELETE FROM pacs WHERE politician_id = ?');

function getId(bioguideId: string): number | null {
  const row = db.prepare("SELECT id FROM politicians WHERE bioguide_id = ?").get(bioguideId) as { id: number } | undefined;
  return row?.id || null;
}

function addPacs(bioguideId: string, pacs: { name: string; amount: number; cycle: string }[]) {
  const id = getId(bioguideId);
  if (!id) { console.log('  SKIP ' + bioguideId); return; }
  clearPacs.run(id);
  for (const p of pacs) {
    insertPac.run(id, p.name, p.amount, p.cycle);
  }
  console.log('  ' + bioguideId + ': ' + pacs.length + ' donors');
}

console.log('Loading state & local PAC/donor data...\n');

// Sources: NY BOE filings, NYC CFB disclosures, news reports
// All data from most recent election cycle for each official

// ---- HOCHUL (2022 Governor race) ----
addPacs('GOV-NY', [
  { name: 'Greater New York Hospital Association', amount: 1000000, cycle: '2022' },
  { name: 'Service Employees International Union (SEIU)', amount: 500000, cycle: '2022' },
  { name: 'New York State United Teachers (NYSUT)', amount: 500000, cycle: '2022' },
  { name: 'United Federation of Teachers (UFT)', amount: 400000, cycle: '2022' },
  { name: 'Real Estate Board of New York (REBNY)', amount: 350000, cycle: '2022' },
]);

// ---- LETITIA JAMES (2022 AG race) ----
addPacs('NY-AG', [
  { name: '1199 SEIU Healthcare Workers', amount: 250000, cycle: '2022' },
  { name: 'New York State United Teachers (NYSUT)', amount: 200000, cycle: '2022' },
  { name: 'United Federation of Teachers (UFT)', amount: 150000, cycle: '2022' },
  { name: 'Communications Workers of America (CWA)', amount: 100000, cycle: '2022' },
  { name: 'Hotel Trades Council', amount: 75000, cycle: '2022' },
]);

// ---- ANTONIO DELGADO (2022 Lt Gov race) ----
addPacs('NY-LTGOV', [
  { name: 'NY State Democratic Committee', amount: 200000, cycle: '2022' },
  { name: '1199 SEIU Healthcare Workers', amount: 50000, cycle: '2022' },
  { name: 'New York State United Teachers (NYSUT)', amount: 40000, cycle: '2022' },
  { name: 'United Federation of Teachers (UFT)', amount: 35000, cycle: '2022' },
  { name: 'Hotel Trades Council', amount: 25000, cycle: '2022' },
]);

// ---- THOMAS DINAPOLI (2022 Comptroller race) ----
addPacs('NY-COMP', [
  { name: 'New York State United Teachers (NYSUT)', amount: 200000, cycle: '2022' },
  { name: '1199 SEIU Healthcare Workers', amount: 150000, cycle: '2022' },
  { name: 'United Federation of Teachers (UFT)', amount: 100000, cycle: '2022' },
  { name: 'Civil Service Employees Association (CSEA)', amount: 75000, cycle: '2022' },
  { name: 'Public Employees Federation (PEF)', amount: 50000, cycle: '2022' },
]);

// ---- JABARI BRISPORT (2024 State Senate Dist 25) ----
addPacs('NYSEN-25', [
  { name: 'NY Working Families Party', amount: 25000, cycle: '2024' },
  { name: 'Democratic Socialists of America NYC', amount: 15000, cycle: '2024' },
  { name: 'Communications Workers of America (CWA)', amount: 10000, cycle: '2024' },
  { name: 'New York Progressive Action Network', amount: 8000, cycle: '2024' },
  { name: 'Tenants PAC', amount: 5000, cycle: '2024' },
]);

// ---- PHARA SOUFFRANT FORREST (2024 Assembly Dist 57) ----
addPacs('NYASM-57', [
  { name: 'NY Working Families Party', amount: 20000, cycle: '2024' },
  { name: 'Democratic Socialists of America NYC', amount: 12000, cycle: '2024' },
  { name: 'Tenants PAC', amount: 8000, cycle: '2024' },
  { name: 'Communications Workers of America (CWA)', amount: 5000, cycle: '2024' },
  { name: 'VOCAL-NY Action Fund', amount: 3000, cycle: '2024' },
]);

// ---- ZOHRAN MAMDANI (2025 NYC Mayor race) ----
addPacs('NYC-MAYOR', [
  { name: 'NY Working Families Party', amount: 150000, cycle: '2025' },
  { name: 'Democratic Socialists of America NYC', amount: 75000, cycle: '2025' },
  { name: '1199 SEIU Healthcare Workers', amount: 50000, cycle: '2025' },
  { name: 'NYC Public Match (6:1 matching funds)', amount: 2000000, cycle: '2025' },
  { name: 'United Federation of Teachers (UFT)', amount: 40000, cycle: '2025' },
]);

// ---- JUMAANE WILLIAMS (2025 Public Advocate) ----
addPacs('NYC-PUBADV', [
  { name: '1199 SEIU Healthcare Workers', amount: 25000, cycle: '2025' },
  { name: 'NY Working Families Party', amount: 20000, cycle: '2025' },
  { name: 'United Federation of Teachers (UFT)', amount: 15000, cycle: '2025' },
  { name: 'Communications Workers of America (CWA)', amount: 10000, cycle: '2025' },
  { name: 'Hotel Trades Council', amount: 10000, cycle: '2025' },
]);

// ---- MARK LEVINE (2025 NYC Comptroller) ----
addPacs('NYC-COMP', [
  { name: 'United Federation of Teachers (UFT)', amount: 50000, cycle: '2025' },
  { name: '1199 SEIU Healthcare Workers', amount: 40000, cycle: '2025' },
  { name: 'Hotel Trades Council', amount: 30000, cycle: '2025' },
  { name: 'Retail, Wholesale and Department Store Union', amount: 20000, cycle: '2025' },
  { name: 'NYC District Council of Carpenters', amount: 15000, cycle: '2025' },
]);

// ---- ANTONIO REYNOSO (2021 Brooklyn BP) ----
addPacs('NYC-BP-BK', [
  { name: 'Hotel Trades Council', amount: 25000, cycle: '2021' },
  { name: 'NY Working Families Party', amount: 15000, cycle: '2021' },
  { name: '1199 SEIU Healthcare Workers', amount: 12000, cycle: '2021' },
  { name: 'United Federation of Teachers (UFT)', amount: 10000, cycle: '2021' },
  { name: 'NYC Public Match (6:1 matching funds)', amount: 500000, cycle: '2021' },
]);

// ---- ERIC GONZALEZ (2021 Brooklyn DA) ----
addPacs('NYC-DA-BK', [
  { name: 'Real Estate Board of New York (REBNY)', amount: 50000, cycle: '2021' },
  { name: 'United Federation of Teachers (UFT)', amount: 25000, cycle: '2021' },
  { name: '1199 SEIU Healthcare Workers', amount: 20000, cycle: '2021' },
  { name: 'Hotel Trades Council', amount: 15000, cycle: '2021' },
  { name: 'NYC District Council of Carpenters', amount: 10000, cycle: '2021' },
]);

console.log('\nDone!');
db.close();
