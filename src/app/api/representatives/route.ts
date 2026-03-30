import { NextRequest, NextResponse } from 'next/server';
import { getPoliticiansByLocation } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`,
      { headers: { 'User-Agent': 'Polinear/1.0' } }
    );
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return NextResponse.json({ error: 'Could not find this address' }, { status: 404 });
    }

    const location = geoData[0];
    const addr = location.address || {};
    const state = addr.state || '';
    const city = addr.city || addr.town || addr.village || '';
    const lat = location.lat;
    const lon = location.lon;
    const borough = addr.suburb || addr.city_district || '';

    const stateAbbr = getStateAbbr(state);
    if (!stateAbbr) {
      return NextResponse.json({ error: 'Could not determine your state' }, { status: 404 });
    }

    let congressionalDistrict: string | null = null;
    let stateSenateDistrict: string | null = null;
    let stateAssemblyDistrict: string | null = null;

    try {
      const censusRes = await fetch(
        `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json`
      );
      const censusData = await censusRes.json();
      const geos = censusData?.result?.geographies || {};

      // Find congressional district (key name varies)
      for (const [key, val] of Object.entries(geos)) {
        const arr = val as Array<Record<string, string>>;
        if (!arr || arr.length === 0) continue;
        if (key.toLowerCase().includes('congressional')) {
          congressionalDistrict = arr[0].BASENAME || null;
        }
        if (key.toLowerCase().includes('legislative') && key.toLowerCase().includes('upper')) {
          stateSenateDistrict = arr[0].BASENAME || null;
        }
        if (key.toLowerCase().includes('legislative') && key.toLowerCase().includes('lower')) {
          stateAssemblyDistrict = arr[0].BASENAME || null;
        }
      }
    } catch {
      // Continue without district info
    }

    let nycBorough: string | null = null;
    const isNyc = isNYC(borough, city, addr.county || '');

    if (stateAbbr === 'NY' && isNyc) {
      nycBorough = getNYCBorough(borough, city, addr.county || '');
    }

    const politicians = await getPoliticiansByLocation({
      state: stateAbbr,
      congressionalDistrict,
      stateSenateDistrict,
      stateAssemblyDistrict,
      cityCouncilDistrict: null, // TODO: NYC council district lookup
      borough: nycBorough,
      city: isNyc ? 'New York City' : city,
    });

    const normalizedAddress = [addr.house_number, addr.road, borough || city, stateAbbr, addr.postcode].filter(Boolean).join(', ');

    return NextResponse.json({ address: normalizedAddress || address, politicians });
  } catch (err) {
    console.error('Representatives error:', err);
    return NextResponse.json({ error: 'Failed to find representatives' }, { status: 500 });
  }
}

function isNYC(borough: string, city: string, county: string): boolean {
  const text = `${borough} ${city} ${county}`.toLowerCase();
  return ['brooklyn', 'manhattan', 'queens', 'bronx', 'staten island', 'new york', 'kings', 'richmond'].some(a => text.includes(a));
}

function getNYCBorough(borough: string, city: string, county: string): string {
  const text = `${borough} ${city} ${county}`.toLowerCase();
  if (text.includes('brooklyn') || text.includes('kings')) return 'Brooklyn';
  if (text.includes('manhattan') || text.includes('new york county')) return 'Manhattan';
  if (text.includes('queens')) return 'Queens';
  if (text.includes('bronx')) return 'Bronx';
  if (text.includes('staten island') || text.includes('richmond')) return 'Staten Island';
  return 'Brooklyn';
}

function getStateAbbr(stateName: string): string | null {
  const states: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD', 'massachusetts': 'MA',
    'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT',
    'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
    'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC',
  };
  const abbrs = Object.values(states);
  if (abbrs.includes(stateName.toUpperCase())) return stateName.toUpperCase();
  return states[stateName.toLowerCase()] || null;
}
