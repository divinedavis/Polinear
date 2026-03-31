import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const db = new Database(DB_PATH);

const insertPosition = db.prepare('INSERT INTO positions (politician_id, topic, stance, citation, source_url) VALUES (?, ?, ?, ?, ?)');
const clearPositions = db.prepare('DELETE FROM positions WHERE politician_id = ?');

function getIdByName(name: string): number | null {
  const row = db.prepare("SELECT id FROM politicians WHERE name LIKE ?").get('%' + name + '%') as { id: number } | undefined;
  return row?.id || null;
}

// Schumer
const schumerId = getIdByName('Schumer');
if (schumerId) {
  clearPositions.run(schumerId);
  insertPosition.run(schumerId, 'Israel', 'Self-described "guardian of Israel" in the Senate. Has supported billions in military aid. In 2024, called for new elections in Israel, breaking with Netanyahu while maintaining support for the state.', 'Senate.gov', 'https://www.schumer.senate.gov/');
  insertPosition.run(schumerId, 'Taxes', 'Supports raising taxes on corporations and the wealthy. Led passage of Inflation Reduction Act with corporate minimum tax. Opposes extending Trump tax cuts for high earners.', 'Senate.gov', 'https://www.schumer.senate.gov/');
  insertPosition.run(schumerId, 'Abortion', 'Led effort to codify Roe v. Wade in federal law. Brought Women\'s Health Protection Act to Senate floor. Calls abortion access a fundamental right.', 'Senate.gov', 'https://www.schumer.senate.gov/');
  insertPosition.run(schumerId, 'Religion', 'Jewish. Has spoken extensively about combating antisemitism. Supported legislation to protect religious communities from hate crimes.', 'Senate.gov', 'https://www.schumer.senate.gov/');
  insertPosition.run(schumerId, 'Affordable Housing', 'Supports federal affordable housing tax credits. Has pushed for NYCHA federal funding. Advocates for expanding Section 8 vouchers and rental assistance.', 'Senate.gov', 'https://www.schumer.senate.gov/');
  console.log('Schumer: 5 positions');
}

// Velazquez
const velazquezId = getIdByName('quez');
if (velazquezId) {
  clearPositions.run(velazquezId);
  insertPosition.run(velazquezId, 'Israel', 'Has voted for Iron Dome funding. Supports a two-state solution. Called for humanitarian aid to Palestinian civilians while supporting Israel\'s security.', 'Congress.gov', 'https://www.congress.gov/');
  insertPosition.run(velazquezId, 'Taxes', 'Supports progressive taxation and expanding small business tax credits. As chair of Small Business Committee, pushed for tax relief for minority-owned businesses.', 'Congress.gov', 'https://www.congress.gov/');
  insertPosition.run(velazquezId, 'Abortion', 'Pro-choice. Co-sponsored Women\'s Health Protection Act. Voted against all abortion restrictions. Supports federal funding for reproductive healthcare.', 'Congress.gov', 'https://www.congress.gov/');
  insertPosition.run(velazquezId, 'Religion', 'Catholic. Supports separation of church and state. Advocates for protecting all religious communities from discrimination.', 'Congress.gov', 'https://www.congress.gov/');
  insertPosition.run(velazquezId, 'Affordable Housing', 'Introduced bills to expand public housing and Section 8. Strong advocate for NYCHA funding. Opposes policies that would displace low-income communities in Brooklyn.', 'Congress.gov', 'https://www.congress.gov/');
  console.log('Velazquez: 5 positions');
}

console.log('Done!');
db.close();
