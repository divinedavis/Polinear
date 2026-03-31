import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const db = new Database(DB_PATH);

const insertBill = db.prepare('INSERT INTO bills (politician_id, bill_id, title, vote, date, description) VALUES (?, ?, ?, ?, ?, ?)');
const clearBills = db.prepare('DELETE FROM bills WHERE politician_id = ?');

function getId(bioguideId: string): number | null {
  const row = db.prepare("SELECT id FROM politicians WHERE bioguide_id = ?").get(bioguideId) as { id: number } | undefined;
  return row?.id || null;
}

function addBills(bioguideId: string, bills: { id: string; title: string; vote: string; date: string; desc: string }[]) {
  const politicianId = getId(bioguideId);
  if (!politicianId) { console.log('  SKIP ' + bioguideId); return; }
  clearBills.run(politicianId);
  for (const b of bills) {
    insertBill.run(politicianId, b.id, b.title, b.vote, b.date, b.desc);
  }
  console.log('  ' + bioguideId + ': ' + bills.length + ' bills');
}

console.log('Loading state & local bills...\n');

// ---- HOCHUL ----
addBills('GOV-NY', [
  { id: 'S4007C', title: 'NY FY2026 Budget - $252 Billion State Budget', vote: 'Signed', date: '2025-04-01', desc: 'Includes education funding increase, healthcare expansion, and housing investments' },
  { id: 'S1893', title: 'Good Cause Eviction Protection Act', vote: 'Signed', date: '2024-04-20', desc: 'Protects tenants from unreasonable rent increases and arbitrary evictions statewide' },
  { id: 'PROP1', title: 'NY Equal Rights Amendment (Prop 1)', vote: 'Supported', date: '2024-11-05', desc: 'Constitutional amendment protecting abortion rights, passed by voters' },
  { id: 'S3505', title: 'Affordable Housing Compact', vote: 'Proposed', date: '2025-01-15', desc: 'Requires localities to permit new housing construction to meet growth targets' },
  { id: 'S2024-GUNS', title: 'Concealed Carry Improvement Act', vote: 'Signed', date: '2024-06-30', desc: 'Strengthened gun regulations after Supreme Court\'s Bruen decision' },
]);

// ---- JAMES ----
addBills('NY-AG', [
  { id: 'AG-2024-TRUMP', title: 'Trump Organization Civil Fraud Case', vote: 'Filed', date: '2024-02-16', desc: 'Won $464M judgment against Trump Organization for fraudulent financial statements' },
  { id: 'AG-2024-CRYPTO', title: 'Crypto Fraud Enforcement Actions', vote: 'Filed', date: '2025-01-10', desc: 'Filed suits against cryptocurrency platforms defrauding NY investors' },
  { id: 'AG-2024-TENANT', title: 'Tenant Protection Enforcement', vote: 'Filed', date: '2025-03-01', desc: 'Sued landlords for illegal rent overcharges and tenant harassment across NYC' },
  { id: 'AG-2024-REPRO', title: 'Reproductive Rights Legal Defense', vote: 'Filed', date: '2025-02-15', desc: 'Filed amicus brief defending access to mifepristone nationwide' },
  { id: 'AG-2024-GUNS', title: 'NRA Dissolution Lawsuit', vote: 'Filed', date: '2024-03-01', desc: 'Continued legal action against NRA for financial misconduct and corruption' },
]);

// ---- DELGADO ----
addBills('NY-LTGOV', [
  { id: 'LG-2025-RURAL', title: 'Rural Economic Development Initiative', vote: 'Championed', date: '2025-02-01', desc: 'Program to expand broadband, healthcare access, and job training in upstate NY' },
  { id: 'LG-2025-SMALL', title: 'Small Business Recovery Program', vote: 'Championed', date: '2025-01-15', desc: 'Grants and technical assistance for small businesses in underserved communities' },
  { id: 'LG-2024-VOTE', title: 'Voter Access Expansion', vote: 'Supported', date: '2024-06-01', desc: 'Efforts to expand early voting locations and voter registration across NY' },
  { id: 'LG-2024-MENTAL', title: 'Mental Health Services Expansion', vote: 'Championed', date: '2024-09-15', desc: 'Expanded community mental health centers and crisis intervention programs' },
  { id: 'LG-2025-HOUSING', title: 'Housing Opportunity Fund', vote: 'Championed', date: '2025-03-01', desc: 'State funding for affordable housing development in suburban and rural areas' },
]);

// ---- DINAPOLI ----
addBills('NY-COMP', [
  { id: 'COMP-2025-AUDIT', title: 'NYCHA Mismanagement Audit', vote: 'Published', date: '2025-02-01', desc: 'Found $1.2B in deferred maintenance and mismanaged federal funds at NYCHA' },
  { id: 'COMP-2025-ESG', title: 'Climate Investment Framework for Pension Fund', vote: 'Implemented', date: '2025-01-10', desc: 'New ESG criteria for $268B Common Retirement Fund investments' },
  { id: 'COMP-2024-FRAUD', title: 'Medicaid Fraud Recovery', vote: 'Published', date: '2024-12-01', desc: 'Recovered $725M in Medicaid fraud through audits and investigations' },
  { id: 'COMP-2024-SCHOOL', title: 'School District Financial Oversight', vote: 'Published', date: '2024-10-15', desc: 'Audit found fiscal stress in 47 school districts across NY' },
  { id: 'COMP-2025-PENSION', title: 'Pension Fund Annual Report', vote: 'Published', date: '2025-03-15', desc: 'Reported 8.5% return on $268B pension fund for state employees' },
]);

// ---- BRISPORT ----
addBills('NYSEN-25', [
  { id: 'S2025-GCE', title: 'Good Cause Eviction Expansion', vote: 'Sponsored', date: '2025-01-15', desc: 'Bill to expand tenant protections to all rental units statewide' },
  { id: 'S2025-TAX', title: 'Billionaires Tax Act', vote: 'Co-Sponsored', date: '2025-02-01', desc: 'Tax on unrealized capital gains for billionaire NY residents' },
  { id: 'S2025-CLIMATE', title: 'Build Public Renewables Act Implementation', vote: 'Yes', date: '2025-03-01', desc: 'Oversight of NYPA renewable energy generation expansion' },
  { id: 'S2025-POLICE', title: 'Police Transparency and Accountability Act', vote: 'Sponsored', date: '2025-01-20', desc: 'Requires public access to police disciplinary records' },
  { id: 'S2024-HOUSING', title: 'Social Housing Development Authority', vote: 'Sponsored', date: '2024-06-15', desc: 'Create state authority to develop publicly-owned affordable housing' },
]);

// ---- SOUFFRANT FORREST ----
addBills('NYASM-57', [
  { id: 'A2025-RENT', title: 'Universal Rent Control Act', vote: 'Sponsored', date: '2025-02-01', desc: 'Expand rent stabilization to all rental apartments in NY' },
  { id: 'A2025-EVICT', title: 'Right to Counsel in Evictions', vote: 'Co-Sponsored', date: '2025-01-15', desc: 'Guarantee legal representation for all tenants facing eviction' },
  { id: 'A2025-NYCHA', title: 'NYCHA Preservation Trust Oversight', vote: 'Yes', date: '2025-03-01', desc: 'Accountability measures for NYCHA public housing repair program' },
  { id: 'A2024-HEALTH', title: 'NY Health Act (Single Payer)', vote: 'Co-Sponsored', date: '2024-03-15', desc: 'Universal single-payer healthcare system for all New Yorkers' },
  { id: 'A2025-WORKER', title: 'Warehouse Worker Protection Act', vote: 'Sponsored', date: '2025-02-20', desc: 'Safety standards and quota transparency for warehouse workers' },
]);

// ---- MAMDANI ----
addBills('NYC-MAYOR', [
  { id: 'NYC-2025-HOUSING', title: 'Universal Housing Voucher Program', vote: 'Proposed', date: '2025-03-01', desc: 'City-funded rental vouchers for all New Yorkers spending over 30% on rent' },
  { id: 'NYC-2025-TRANSIT', title: 'Free Bus Service Initiative', vote: 'Proposed', date: '2025-02-15', desc: 'Make all NYC buses free to ride to improve transit equity' },
  { id: 'NYC-2025-BUDGET', title: 'FY2026 NYC Budget Proposal', vote: 'Proposed', date: '2025-03-15', desc: '$112B city budget with increased social services and housing funding' },
  { id: 'NYC-2025-POLICE', title: 'Community Safety Reinvestment Plan', vote: 'Proposed', date: '2025-02-01', desc: 'Shift funding toward community-based violence prevention programs' },
  { id: 'NYC-2025-CLIMATE', title: 'Green New Deal for NYC', vote: 'Proposed', date: '2025-01-25', desc: 'Accelerate building electrification and renewable energy for city operations' },
]);

// ---- WILLIAMS ----
addBills('NYC-PUBADV', [
  { id: 'PA-2025-TENANT', title: 'Tenant Bill of Rights', vote: 'Introduced', date: '2025-02-01', desc: 'Comprehensive tenant protections including right to organize and repair' },
  { id: 'PA-2025-MENTAL', title: 'Mental Health First Responder Act', vote: 'Introduced', date: '2025-01-15', desc: 'Send mental health professionals instead of police for crisis calls' },
  { id: 'PA-2025-FOOD', title: 'Food Security Initiative', vote: 'Introduced', date: '2025-03-01', desc: 'Expand community fridges and food assistance programs citywide' },
  { id: 'PA-2024-HOUSING', title: 'NYCHA Oversight Report', vote: 'Published', date: '2024-11-01', desc: 'Investigation into NYCHA repair delays and management failures' },
  { id: 'PA-2025-IMMIG', title: 'Immigrant Protection Protocol', vote: 'Introduced', date: '2025-02-20', desc: 'Strengthen NYC sanctuary city protections and immigrant legal services' },
]);

// ---- LEVINE (Comptroller) ----
addBills('NYC-COMP', [
  { id: 'NYCCOMP-2025-AUDIT', title: 'DOE School Safety Audit', vote: 'Published', date: '2025-02-15', desc: 'Audit of school safety infrastructure finding $500M in needed repairs' },
  { id: 'NYCCOMP-2025-PENSION', title: 'NYC Pension Fund Climate Review', vote: 'Published', date: '2025-01-20', desc: 'Analysis of fossil fuel exposure in $250B+ city pension portfolio' },
  { id: 'NYCCOMP-2025-WAGE', title: 'Prevailing Wage Enforcement Report', vote: 'Published', date: '2025-03-01', desc: 'Found $45M in wage theft on city-contracted construction projects' },
  { id: 'NYCCOMP-2024-AFFORD', title: 'Affordability Index Report', vote: 'Published', date: '2024-10-01', desc: 'Annual report showing cost of living crisis in all five boroughs' },
  { id: 'NYCCOMP-2025-TECH', title: 'City Technology Spending Audit', vote: 'Published', date: '2025-02-01', desc: 'Audit of $3B+ annual city tech spending finding inefficiencies and waste' },
]);

// ---- REYNOSO ----
addBills('NYC-BP-BK', [
  { id: 'BP-2025-GOWANUS', title: 'Gowanus Rezoning Community Benefits', vote: 'Negotiated', date: '2025-01-15', desc: 'Secured affordable housing requirements and infrastructure in Gowanus development' },
  { id: 'BP-2025-PARKS', title: 'Brooklyn Parks Equity Plan', vote: 'Proposed', date: '2025-02-01', desc: '$100M investment in underserved Brooklyn parks and playgrounds' },
  { id: 'BP-2025-SMALL', title: 'Brooklyn Small Business Support Fund', vote: 'Launched', date: '2025-03-01', desc: 'Grants and rent assistance for immigrant-owned small businesses' },
  { id: 'BP-2024-NYCHA', title: 'Brooklyn NYCHA Improvement Oversight', vote: 'Published', date: '2024-09-01', desc: 'Report on conditions and repair progress at Brooklyn public housing' },
  { id: 'BP-2025-BIKE', title: 'Brooklyn Bike Lane Expansion', vote: 'Supported', date: '2025-02-15', desc: 'Protected bike lane network connecting Brooklyn neighborhoods safely' },
]);

// ---- GONZALEZ ----
addBills('NYC-DA-BK', [
  { id: 'DA-2025-DIVERT', title: 'Pre-Trial Diversion Expansion', vote: 'Implemented', date: '2025-01-15', desc: 'Expanded alternatives to incarceration for non-violent offenses' },
  { id: 'DA-2025-GUN', title: 'Ghost Gun Prosecution Initiative', vote: 'Launched', date: '2025-02-01', desc: 'Dedicated unit to prosecute illegal ghost gun manufacturing and sales' },
  { id: 'DA-2025-HATE', title: 'Hate Crimes Task Force Expansion', vote: 'Launched', date: '2025-01-20', desc: 'Expanded hate crimes bureau with dedicated investigators for each community' },
  { id: 'DA-2024-CONVICT', title: 'Conviction Review Unit Results', vote: 'Published', date: '2024-12-01', desc: 'Overturned 15 wrongful convictions through post-conviction review' },
  { id: 'DA-2025-TENANT', title: 'Landlord Fraud Prosecutions', vote: 'Filed', date: '2025-03-01', desc: 'Criminal charges against landlords for tenant harassment and rent fraud' },
]);

console.log('\nDone!');
db.close();
