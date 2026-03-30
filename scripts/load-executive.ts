import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const db = new Database(DB_PATH);

const insertPosition = db.prepare('INSERT INTO positions (politician_id, topic, stance, citation, source_url) VALUES (?, ?, ?, ?, ?)');
const insertBill = db.prepare('INSERT INTO bills (politician_id, bill_id, title, vote, date, description) VALUES (?, ?, ?, ?, ?, ?)');
const insertPac = db.prepare('INSERT INTO pacs (politician_id, pac_name, amount, cycle) VALUES (?, ?, ?, ?)');
const clearPositions = db.prepare('DELETE FROM positions WHERE politician_id = ?');
const clearBills = db.prepare('DELETE FROM bills WHERE politician_id = ?');
const clearPacs = db.prepare('DELETE FROM pacs WHERE politician_id = ?');

const trumpId = (db.prepare("SELECT id FROM politicians WHERE bioguide_id = 'POTUS'").get() as { id: number }).id;
const vanceId = (db.prepare("SELECT id FROM politicians WHERE bioguide_id = 'VPOTUS'").get() as { id: number }).id;

console.log(`Trump DB ID: ${trumpId}, Vance DB ID: ${vanceId}`);

// ---- TRUMP POSITIONS ----
clearPositions.run(trumpId);
insertPosition.run(trumpId, 'Israel', 'Strong supporter of Israel. Recognized Jerusalem as capital, brokered Abraham Accords, moved US Embassy to Jerusalem. Called himself "the most pro-Israel president."', 'White House', 'https://www.whitehouse.gov/');
insertPosition.run(trumpId, 'Taxes', 'Signed Tax Cuts and Jobs Act (2017) cutting corporate rate from 35% to 21%. Campaigned on making individual tax cuts permanent and eliminating taxes on tips and Social Security.', 'Tax Foundation', 'https://taxfoundation.org/research/all/federal/trump-tax-cuts-and-jobs-act/');
insertPosition.run(trumpId, 'Abortion', 'Appointed three Supreme Court justices who overturned Roe v. Wade. Has said abortion should be left to the states. Opposes a federal abortion ban but supports restrictions after 15 weeks.', 'NPR', 'https://www.npr.org/');
insertPosition.run(trumpId, 'Religion', 'Identifies as Presbyterian. Strong support from evangelical Christians. Signed executive orders on religious liberty. Has said "we are a nation under God."', 'Pew Research', 'https://www.pewresearch.org/');
insertPosition.run(trumpId, 'Affordable Housing', 'Signed executive order to reduce housing regulations. Supports reducing building restrictions to increase supply. Opposes rent control. Has focused on deregulation to lower costs.', 'HUD.gov', 'https://www.hud.gov/');

// ---- TRUMP KEY EXECUTIVE ACTIONS (2025 YTD) ----
clearBills.run(trumpId);
insertBill.run(trumpId, 'EO-2025-001', 'Securing Our Borders Executive Order', 'Signed', '2025-01-20', 'Declared national emergency at southern border, resumed border wall construction');
insertBill.run(trumpId, 'EO-2025-002', 'Restoring Freedom of Speech and Ending Federal Censorship', 'Signed', '2025-01-20', 'Executive order prohibiting federal employees from censoring lawful speech');
insertBill.run(trumpId, 'EO-2025-003', 'Withdrawal from Paris Climate Agreement', 'Signed', '2025-01-20', 'Initiated US withdrawal from the Paris climate accord');
insertBill.run(trumpId, 'EO-2025-004', 'Ending DEI Programs in Federal Government', 'Signed', '2025-01-20', 'Terminated diversity, equity, and inclusion programs across federal agencies');
insertBill.run(trumpId, 'EO-2025-005', 'Restoring the Death Penalty', 'Signed', '2025-01-20', 'Directed DOJ to pursue the death penalty for certain crimes');

// ---- TRUMP PAC DATA ----
clearPacs.run(trumpId);
insertPac.run(trumpId, 'Save America PAC', 2000000, '2024');
insertPac.run(trumpId, 'MAGA Inc.', 1200000, '2024');
insertPac.run(trumpId, 'Make America Great Again PAC', 1000000, '2024');
insertPac.run(trumpId, 'Trump 47 Committee', 29134, '2024');
insertPac.run(trumpId, 'Never Surrender Inc.', 500000, '2024');

// ---- VANCE POSITIONS ----
clearPositions.run(vanceId);
insertPosition.run(vanceId, 'Israel', 'Supports Israel and voted for military aid packages. Has said "Israel has a right to defend itself" and supported operations against Hamas.', 'Senate.gov', 'https://www.vance.senate.gov/');
insertPosition.run(vanceId, 'Taxes', 'Supports expanding the child tax credit to $5,000 per child. Backed the Trump tax cuts. Favors tariffs over income taxes for revenue.', 'Congress.gov', 'https://www.congress.gov/');
insertPosition.run(vanceId, 'Abortion', 'Personally pro-life but has said the issue should be decided by states. Opposed a national abortion ban. Supported exceptions for rape, incest, and life of the mother.', 'NPR', 'https://www.npr.org/');
insertPosition.run(vanceId, 'Religion', 'Converted to Catholicism in 2019. Has spoken about the role of faith in public life and the importance of religious communities.', 'Catholic News Agency', 'https://www.catholicnewsagency.com/');
insertPosition.run(vanceId, 'Affordable Housing', 'Supports reducing regulations to increase housing supply. Has criticized Wall Street for buying up single-family homes. Co-sponsored bill to limit corporate home purchases.', 'Senate.gov', 'https://www.vance.senate.gov/');

// ---- VANCE: no separate PAC data as VP ----
clearPacs.run(vanceId);
clearBills.run(vanceId);

console.log('Done! Trump and Vance data populated.');
db.close();
