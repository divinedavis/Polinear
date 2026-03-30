import { NextRequest, NextResponse } from 'next/server';
import { getRepresentatives } from '@/lib/apis/civic';
import { aggregatePoliticianData } from '@/lib/aggregator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  const data = await getRepresentatives(address);

  if (!data) {
    return NextResponse.json({ error: 'Could not find representatives for this address' }, { status: 404 });
  }

  const normalizedAddress = data.normalizedInput
    ? `${data.normalizedInput.line1}, ${data.normalizedInput.city}, ${data.normalizedInput.state} ${data.normalizedInput.zip}`
    : address;

  // Build politicians from civic data
  const politicians = await Promise.all(
    data.offices.flatMap((office) =>
      office.officialIndices.map(async (idx) => {
        const official = data.officials[idx];
        return aggregatePoliticianData(
          official.name,
          office.name,
          official.party || 'Unknown',
          official.photoUrl || null,
          office.levels || [],
        );
      })
    )
  );

  return NextResponse.json({
    address: normalizedAddress,
    politicians,
  });
}
