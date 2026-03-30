import { NextRequest, NextResponse } from 'next/server';
import { getPoliticiansByLocation } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  try {
    // Step 1: Geocode address to get state
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

    // Step 2: Get state abbreviation
    const stateAbbr = getStateAbbr(state);
    if (!stateAbbr) {
      return NextResponse.json({ error: 'Could not determine your state' }, { status: 404 });
    }

    // Step 3: Get congressional district from Census
    let district: string | null = null;
    try {
      const censusRes = await fetch(
        `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
      );
      const censusData = await censusRes.json();
      district = censusData?.result?.geographies?.['Congressional Districts']?.[0]?.BASENAME || null;
    } catch {
      // Continue without district
    }

    // Step 4: Query DB + Redis cache
    const politicians = await getPoliticiansByLocation(stateAbbr, district);

    const normalizedAddress = [addr.house_number, addr.road, city, stateAbbr, addr.postcode].filter(Boolean).join(', ');

    return NextResponse.json({
      address: normalizedAddress || address,
      politicians,
    });
  } catch (err) {
    console.error('Representatives error:', err);
    return NextResponse.json({ error: 'Failed to find representatives' }, { status: 500 });
  }
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
