import { Politician } from './types';
import { getLegislatorInfo } from './idMapping';
import { getMemberVotes } from './apis/propublica';
import { getTopPACs } from './apis/openfec';
import { getPositions } from './apis/positions';

export async function aggregatePoliticianData(
  name: string,
  office: string,
  party: string,
  photoUrl: string | null,
  levels: string[],
): Promise<Politician> {
  const level = levels.includes('country')
    ? 'federal'
    : levels.includes('administrativeArea1')
      ? 'state'
      : 'local';

  const normalizedParty = party?.includes('Democrat')
    ? 'Democrat'
    : party?.includes('Republican')
      ? 'Republican'
      : party || 'Unknown';

  // Look up bioguide ID and birth info
  const legislatorInfo = await getLegislatorInfo(name);
  const bioguideId = legislatorInfo?.bioguideId || null;

  // Build photo URL from bioguide if available
  let finalPhotoUrl = photoUrl;
  if (bioguideId && !finalPhotoUrl) {
    finalPhotoUrl = `https://theunitedstates.io/images/congress/450x550/${bioguideId}.jpg`;
  }

  // Fetch enrichment data in parallel (only for federal officials with bioguide IDs)
  const [bills, pacs, positions] = await Promise.all([
    bioguideId ? getMemberVotes(bioguideId) : Promise.resolve([]),
    getTopPACs(name),
    getPositions(name),
  ]);

  return {
    name,
    office,
    level,
    party: normalizedParty,
    photoUrl: finalPhotoUrl,
    birthplace: legislatorInfo
      ? `${legislatorInfo.birthState}${legislatorInfo.birthday ? ` (born ${legislatorInfo.birthday})` : ''}`
      : null,
    bioguideId,
    positions,
    bills,
    pacs,
  };
}
