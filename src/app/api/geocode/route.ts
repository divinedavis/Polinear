import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/apis/geocoding';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const address = await reverseGeocode(parseFloat(lat), parseFloat(lng));

  if (!address) {
    return NextResponse.json({ error: 'Could not geocode location' }, { status: 404 });
  }

  return NextResponse.json({ address });
}
