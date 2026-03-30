import { getCached, setCache } from '../cache';

interface CivicResponse {
  normalizedInput: { line1: string; city: string; state: string; zip: string };
  offices: { name: string; divisionId: string; levels?: string[]; roles?: string[]; officialIndices: number[] }[];
  officials: { name: string; party?: string; photoUrl?: string; phones?: string[]; urls?: string[]; channels?: { type: string; id: string }[]; address?: { line1: string; city: string; state: string; zip: string }[] }[];
}

export async function getRepresentatives(address: string): Promise<CivicResponse | null> {
  const cacheKey = `civic:${address}`;
  const cached = getCached<CivicResponse>(cacheKey);
  if (cached) return cached;

  try {
    return await buildFromFreeSources(address, cacheKey);
  } catch (e) {
    console.error('Representative lookup error:', e);
    return null;
  }
}

async function buildFromFreeSources(address: string, cacheKey: string): Promise<CivicResponse | null> {
  // Step 1: Geocode the address
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`,
    { headers: { 'User-Agent': 'Polinear/1.0' } }
  );
  const geoData = await geoRes.json();
  if (!geoData || geoData.length === 0) return null;

  const location = geoData[0];
  const addr = location.address || {};
  const state = addr.state || '';
  const city = addr.city || addr.town || addr.village || '';
  const lat = location.lat;
  const lon = location.lon;

  const officials: CivicResponse['officials'] = [];
  const offices: CivicResponse['offices'] = [];

  const stateAbbr = getStateAbbr(state);

  if (stateAbbr) {
    try {
      // Get congressional district from census geocoder
      const censusRes = await fetch(
        `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
      );
      const censusData = await censusRes.json();
      const geos = censusData?.result?.geographies;
      const congressionalDistrict = geos?.['Congressional Districts']?.[0]?.BASENAME || '';

      // Get current members from Congress API
      const congressApiKey = process.env.CONGRESS_GOV_API_KEY || '';
      if (congressApiKey) {
        const membersRes = await fetch(
          `https://api.congress.gov/v3/member?stateCode=${stateAbbr}&currentMember=true&limit=50&api_key=${congressApiKey}`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const members = membersData?.members || [];

          for (const member of members) {
            const latestTerm = member.terms?.item?.[member.terms.item.length - 1];
            const chamber = latestTerm?.chamber || '';
            const district = member.district;

            if (chamber === 'Senate') {
              const idx = officials.length;
              officials.push({
                name: member.name || `${member.firstName} ${member.lastName}`,
                party: member.partyName || '',
                photoUrl: member.depiction?.imageUrl || null,
              });
              offices.push({
                name: `U.S. Senator - ${stateAbbr}`,
                divisionId: `ocd-division/country:us/state:${stateAbbr.toLowerCase()}`,
                levels: ['country'],
                roles: ['legislatorUpperBody'],
                officialIndices: [idx],
              });
            }

            if (chamber === 'House of Representatives' && congressionalDistrict && String(district) === String(congressionalDistrict)) {
              const idx = officials.length;
              officials.push({
                name: member.name || `${member.firstName} ${member.lastName}`,
                party: member.partyName || '',
                photoUrl: member.depiction?.imageUrl || null,
              });
              offices.push({
                name: `U.S. Representative - District ${congressionalDistrict}`,
                divisionId: `ocd-division/country:us/state:${stateAbbr.toLowerCase()}/cd:${congressionalDistrict}`,
                levels: ['country'],
                roles: ['legislatorLowerBody'],
                officialIndices: [idx],
              });
            }
          }
        }
      }

      // Add President and VP
      const presIdx = officials.length;
      officials.push({ name: 'Donald J. Trump', party: 'Republican', photoUrl: undefined });
      offices.push({
        name: 'President of the United States',
        divisionId: 'ocd-division/country:us',
        levels: ['country'],
        roles: ['headOfState'],
        officialIndices: [presIdx],
      });

      const vpIdx = officials.length;
      officials.push({ name: 'J.D. Vance', party: 'Republican', photoUrl: undefined });
      offices.push({
        name: 'Vice President of the United States',
        divisionId: 'ocd-division/country:us',
        levels: ['country'],
        roles: ['deputyHeadOfState'],
        officialIndices: [vpIdx],
      });

    } catch (e) {
      console.error('Census/Congress API error:', e);
    }
  }

  if (officials.length === 0) return null;

  const result: CivicResponse = {
    normalizedInput: {
      line1: addr.road || '',
      city,
      state: stateAbbr || state,
      zip: addr.postcode || '',
    },
    offices,
    officials,
  };

  setCache(cacheKey, result, 86400 * 7);
  return result;
}

function getStateAbbr(stateName: string): string | null {
  const states: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  };

  const abbrs = Object.values(states);
  if (abbrs.includes(stateName.toUpperCase())) return stateName.toUpperCase();

  return states[stateName.toLowerCase()] || null;
}
