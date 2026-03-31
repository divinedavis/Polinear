import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'polinear.db');
const db = new Database(DB_PATH);

const insertPosition = db.prepare('INSERT INTO positions (politician_id, topic, stance, citation, source_url) VALUES (?, ?, ?, ?, ?)');
const clearPositions = db.prepare('DELETE FROM positions WHERE politician_id = ?');

function getId(bioguideId: string): number | null {
  const row = db.prepare("SELECT id FROM politicians WHERE bioguide_id = ?").get(bioguideId) as { id: number } | undefined;
  return row?.id || null;
}

function addPositions(bioguideId: string, positions: { topic: string; stance: string; citation: string; url: string }[]) {
  const id = getId(bioguideId);
  if (!id) { console.log('  SKIP ' + bioguideId + ' - not found'); return; }
  clearPositions.run(id);
  for (const p of positions) {
    insertPosition.run(id, p.topic, p.stance, p.citation, p.url);
  }
  console.log('  ' + bioguideId + ': ' + positions.length + ' positions');
}

console.log('Loading state & local positions...\n');

// ---- KATHY HOCHUL (Governor) ----
addPositions('GOV-NY', [
  { topic: 'Israel', stance: 'Strong supporter of Israel. Traveled to Israel after Oct 7 attack. Signed executive order combating antisemitism and BDS movement in NY state government.', citation: 'NY Governor Office', url: 'https://www.governor.ny.gov/' },
  { topic: 'Taxes', stance: 'Proposed middle-class tax cuts in 2025 budget. Supports expanding child tax credit for NY families. Has resisted raising income taxes on high earners beyond existing surcharge.', citation: 'NY Governor Office', url: 'https://www.governor.ny.gov/' },
  { topic: 'Abortion', stance: 'Signed the Equal Rights Amendment into NY constitution protecting abortion access. Called NY a "safe harbor" for reproductive rights. Signed bill protecting out-of-state abortion seekers.', citation: 'NY Governor Office', url: 'https://www.governor.ny.gov/' },
  { topic: 'Religion', stance: 'Catholic. Has emphasized religious tolerance and interfaith dialogue. Signed legislation protecting religious institutions from hate crimes.', citation: 'NY Governor Office', url: 'https://www.governor.ny.gov/' },
  { topic: 'Affordable Housing', stance: 'Proposed NY Housing Compact requiring localities to build more housing. Supports 800,000 new homes over decade. Signed Good Cause Eviction protections for tenants.', citation: 'NY Governor Office', url: 'https://www.governor.ny.gov/' },
]);

// ---- LETITIA JAMES (AG) ----
addPositions('NY-AG', [
  { topic: 'Israel', stance: 'Has spoken against antisemitism and hate crimes targeting Jewish communities in NY. Launched investigations into antisemitic threats.', citation: 'NY AG Office', url: 'https://ag.ny.gov/' },
  { topic: 'Taxes', stance: 'Filed lawsuits against companies for tax fraud, including the Trump Organization civil fraud case. Advocates for corporate tax accountability.', citation: 'NY AG Office', url: 'https://ag.ny.gov/' },
  { topic: 'Abortion', stance: 'Launched reproductive rights helpline for New Yorkers. Filed lawsuits to block federal restrictions on mifepristone. Strong advocate for abortion access.', citation: 'NY AG Office', url: 'https://ag.ny.gov/' },
  { topic: 'Religion', stance: 'Has advocated for protecting religious communities from hate crimes and bias incidents. Launched hotline for reporting religious discrimination.', citation: 'NY AG Office', url: 'https://ag.ny.gov/' },
  { topic: 'Affordable Housing', stance: 'Filed lawsuits against landlords for tenant harassment and illegal rent overcharges. Advocates for stronger tenant protections and rent stabilization enforcement.', citation: 'NY AG Office', url: 'https://ag.ny.gov/' },
]);

// ---- ANTONIO DELGADO (Lt Gov) ----
addPositions('NY-LTGOV', [
  { topic: 'Israel', stance: 'As a former congressman, voted for Iron Dome funding for Israel. Has expressed support for Israel\'s right to self-defense.', citation: 'Congress.gov', url: 'https://www.congress.gov/' },
  { topic: 'Taxes', stance: 'Supported expanding the child tax credit as congressman. Advocates for tax relief for working families and small businesses.', citation: 'NY Lt Gov Office', url: 'https://www.governor.ny.gov/' },
  { topic: 'Abortion', stance: 'Pro-choice. Supported codifying Roe v. Wade as congressman. Supports NY\'s constitutional amendment protecting reproductive rights.', citation: 'NY Lt Gov Office', url: 'https://www.governor.ny.gov/' },
  { topic: 'Religion', stance: 'Has emphasized religious freedom and interfaith cooperation in public service.', citation: 'NY Lt Gov Office', url: 'https://www.governor.ny.gov/' },
  { topic: 'Affordable Housing', stance: 'Supports Governor Hochul\'s housing compact. Has advocated for rural and suburban housing development alongside urban affordable housing.', citation: 'NY Lt Gov Office', url: 'https://www.governor.ny.gov/' },
]);

// ---- THOMAS DINAPOLI (Comptroller) ----
addPositions('NY-COMP', [
  { topic: 'Israel', stance: 'As sole trustee of NY State pension fund ($268B), has maintained investments in Israel. Opposed BDS divestment campaigns targeting the pension fund.', citation: 'NY Comptroller Office', url: 'https://www.osc.ny.gov/' },
  { topic: 'Taxes', stance: 'Audits state agencies for waste and fiscal accountability. Has warned about impact of federal SALT cap on NY taxpayers. Advocates for fiscal responsibility.', citation: 'NY Comptroller Office', url: 'https://www.osc.ny.gov/' },
  { topic: 'Abortion', stance: 'Supports reproductive rights. Has not taken direct legislative action as comptroller but has endorsed pro-choice policies.', citation: 'NY Comptroller Office', url: 'https://www.osc.ny.gov/' },
  { topic: 'Religion', stance: 'Has emphasized protecting religious institutions in fiscal oversight of state grants and nonprofit funding.', citation: 'NY Comptroller Office', url: 'https://www.osc.ny.gov/' },
  { topic: 'Affordable Housing', stance: 'Published reports on housing affordability crisis in NY. Audited NYCHA for mismanagement. Advocates for transparency in housing authority spending.', citation: 'NY Comptroller Office', url: 'https://www.osc.ny.gov/' },
]);

// ---- JABARI BRISPORT (State Senator Dist 25) ----
addPositions('NYSEN-25', [
  { topic: 'Israel', stance: 'Introduced resolution calling for ceasefire in Gaza. One of the most vocal critics of US military aid to Israel in the NY State Senate. Supports Palestinian rights.', citation: 'NY Senate', url: 'https://www.nysenate.gov/district/25' },
  { topic: 'Taxes', stance: 'Supports taxing the ultra-wealthy to fund public services. Co-sponsored billionaire\'s tax and stock transfer tax proposals.', citation: 'NY Senate', url: 'https://www.nysenate.gov/district/25' },
  { topic: 'Abortion', stance: 'Strong pro-choice advocate. Voted for NY Equal Rights Amendment. Supports expanding access to reproductive healthcare.', citation: 'NY Senate', url: 'https://www.nysenate.gov/district/25' },
  { topic: 'Religion', stance: 'Advocates for separation of church and state. Supports protecting all religious communities from discrimination.', citation: 'NY Senate', url: 'https://www.nysenate.gov/district/25' },
  { topic: 'Affordable Housing', stance: 'Co-sponsored Good Cause Eviction bill. Supports universal rent control and public housing investment. Opposes luxury development without affordable units.', citation: 'NY Senate', url: 'https://www.nysenate.gov/district/25' },
]);

// ---- PHARA SOUFFRANT FORREST (Assembly Dist 57) ----
addPositions('NYASM-57', [
  { topic: 'Israel', stance: 'Signed letter calling for ceasefire in Gaza. Supports conditioning US military aid to Israel on human rights compliance.', citation: 'NY Assembly', url: 'https://nyassembly.gov/mem/Phara-Souffrant-Forrest' },
  { topic: 'Taxes', stance: 'Supports progressive taxation including taxes on billionaires and Wall Street transactions to fund public services.', citation: 'NY Assembly', url: 'https://nyassembly.gov/mem/Phara-Souffrant-Forrest' },
  { topic: 'Abortion', stance: 'Pro-choice. Supports expanded reproductive healthcare access and voted for the Equal Rights Amendment.', citation: 'NY Assembly', url: 'https://nyassembly.gov/mem/Phara-Souffrant-Forrest' },
  { topic: 'Religion', stance: 'Supports religious freedom and protecting communities of faith from discrimination.', citation: 'NY Assembly', url: 'https://nyassembly.gov/mem/Phara-Souffrant-Forrest' },
  { topic: 'Affordable Housing', stance: 'Former tenant organizer. Strong advocate for Good Cause Eviction, universal rent control, and public housing funding. Opposes landlord-friendly legislation.', citation: 'NY Assembly', url: 'https://nyassembly.gov/mem/Phara-Souffrant-Forrest' },
]);

// ---- ZOHRAN MAMDANI (NYC Mayor) ----
addPositions('NYC-MAYOR', [
  { topic: 'Israel', stance: 'Vocal critic of Israel\'s military operations in Gaza. Supported ceasefire resolutions. Has called for end to US military aid to Israel.', citation: 'NYC Mayor Office', url: 'https://www.nyc.gov/' },
  { topic: 'Taxes', stance: 'Supports progressive taxation. As assemblymember, backed billionaire\'s tax. Favors using tax revenue to fund social services and public transit.', citation: 'NYC Mayor Office', url: 'https://www.nyc.gov/' },
  { topic: 'Abortion', stance: 'Pro-choice. Supports NYC as a sanctuary city for reproductive rights. Backs expanded access to reproductive healthcare citywide.', citation: 'NYC Mayor Office', url: 'https://www.nyc.gov/' },
  { topic: 'Religion', stance: 'Muslim. Advocates for religious pluralism and protecting all faith communities from hate crimes and discrimination in NYC.', citation: 'NYC Mayor Office', url: 'https://www.nyc.gov/' },
  { topic: 'Affordable Housing', stance: 'Ran on housing affordability platform. Supports expanding rent stabilization, building more public housing, and taxing vacant luxury apartments.', citation: 'NYC Mayor Office', url: 'https://www.nyc.gov/' },
]);

// ---- JUMAANE WILLIAMS (Public Advocate) ----
addPositions('NYC-PUBADV', [
  { topic: 'Israel', stance: 'Has called for ceasefire in Gaza and conditioning US aid to Israel. Attended pro-Palestinian rallies. Supports a two-state solution.', citation: 'NYC Public Advocate', url: 'https://advocate.nyc.gov/' },
  { topic: 'Taxes', stance: 'Supports taxing wealthy New Yorkers to fund public services. Advocates for closing corporate tax loopholes and increasing property taxes on luxury developments.', citation: 'NYC Public Advocate', url: 'https://advocate.nyc.gov/' },
  { topic: 'Abortion', stance: 'Pro-choice. Introduced legislation to protect reproductive rights in NYC. Supports funding for reproductive healthcare clinics.', citation: 'NYC Public Advocate', url: 'https://advocate.nyc.gov/' },
  { topic: 'Religion', stance: 'Christian. Has emphasized faith-based community organizing. Advocates for protecting houses of worship and religious communities.', citation: 'NYC Public Advocate', url: 'https://advocate.nyc.gov/' },
  { topic: 'Affordable Housing', stance: 'Former City Council housing committee chair. Sponsored numerous tenant protection bills. Advocates for right to counsel in eviction cases and NYCHA reform.', citation: 'NYC Public Advocate', url: 'https://advocate.nyc.gov/' },
]);

// ---- MARK LEVINE (NYC Comptroller) ----
addPositions('NYC-COMP', [
  { topic: 'Israel', stance: 'Supports Israel\'s right to self-defense. Has condemned antisemitism in NYC. Maintains balanced approach to Middle East issues.', citation: 'NYC Comptroller', url: 'https://comptroller.nyc.gov/' },
  { topic: 'Taxes', stance: 'Oversees NYC pension funds and city finances. Advocates for fiscal responsibility while maintaining social services funding.', citation: 'NYC Comptroller', url: 'https://comptroller.nyc.gov/' },
  { topic: 'Abortion', stance: 'Pro-choice. Supports NYC funding for reproductive healthcare. Has called for protecting abortion access in city-funded health programs.', citation: 'NYC Comptroller', url: 'https://comptroller.nyc.gov/' },
  { topic: 'Religion', stance: 'Jewish. Has spoken out against antisemitism and all forms of religious hatred. Supports interfaith initiatives.', citation: 'NYC Comptroller', url: 'https://comptroller.nyc.gov/' },
  { topic: 'Affordable Housing', stance: 'Has audited NYCHA and city housing agencies. Advocates for increased affordable housing investment and better oversight of housing subsidies.', citation: 'NYC Comptroller', url: 'https://comptroller.nyc.gov/' },
]);

// ---- ANTONIO REYNOSO (Brooklyn BP) ----
addPositions('NYC-BP-BK', [
  { topic: 'Israel', stance: 'Has called for ceasefire in Gaza. Supports Palestinian rights while condemning antisemitism. Advocates for diplomacy over military action.', citation: 'Brooklyn BP Office', url: 'https://www.brooklynbp.nyc.gov/' },
  { topic: 'Taxes', stance: 'Supports progressive taxation to fund Brooklyn infrastructure and services. Advocates for closing tax abatements that benefit luxury developers.', citation: 'Brooklyn BP Office', url: 'https://www.brooklynbp.nyc.gov/' },
  { topic: 'Abortion', stance: 'Pro-choice. Supports expanded access to reproductive healthcare in Brooklyn communities. Backs city funding for reproductive services.', citation: 'Brooklyn BP Office', url: 'https://www.brooklynbp.nyc.gov/' },
  { topic: 'Religion', stance: 'Supports protecting all religious communities in Brooklyn. Has participated in interfaith events across diverse Brooklyn neighborhoods.', citation: 'Brooklyn BP Office', url: 'https://www.brooklynbp.nyc.gov/' },
  { topic: 'Affordable Housing', stance: 'Top priority as BP. Pushes for community land trusts, mandatory affordable housing in rezonings, and NYCHA investment. Opposes displacement.', citation: 'Brooklyn BP Office', url: 'https://www.brooklynbp.nyc.gov/' },
]);

// ---- ERIC GONZALEZ (Brooklyn DA) ----
addPositions('NYC-DA-BK', [
  { topic: 'Israel', stance: 'Has prosecuted hate crimes targeting Jewish and Muslim communities in Brooklyn. Focuses on equal justice for all communities.', citation: 'Brooklyn DA Office', url: 'https://www.brooklynda.org/' },
  { topic: 'Taxes', stance: 'Prosecuted major tax fraud cases in Brooklyn. Focuses on corporate and white-collar crime that defrauds taxpayers.', citation: 'Brooklyn DA Office', url: 'https://www.brooklynda.org/' },
  { topic: 'Abortion', stance: 'Announced Brooklyn DA office would not prosecute anyone seeking or providing abortion care. Supports reproductive rights.', citation: 'Brooklyn DA Office', url: 'https://www.brooklynda.org/' },
  { topic: 'Religion', stance: 'Established hate crimes bureau to protect religious communities. Prosecutes bias crimes against all faiths.', citation: 'Brooklyn DA Office', url: 'https://www.brooklynda.org/' },
  { topic: 'Affordable Housing', stance: 'Created tenant protection unit to prosecute landlord harassment and illegal evictions. Partners with housing courts to protect renters.', citation: 'Brooklyn DA Office', url: 'https://www.brooklynda.org/' },
]);

console.log('\nDone!');
db.close();
