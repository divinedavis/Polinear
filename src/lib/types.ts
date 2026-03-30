export interface Politician {
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  party: 'Democrat' | 'Republican' | 'Independent' | string;
  photoUrl: string | null;
  birthplace: string | null;
  bioguideId: string | null;
  positions: Position[];
  bills: BillVote[];
  pacs: PACContribution[];
  termEnd: string | null;
  nextElection: string | null;
}

export interface Position {
  topic: string;
  stance: string;
  citation: string;
  sourceUrl: string;
}

export interface BillVote {
  billId: string;
  title: string;
  vote: 'Yes' | 'No' | 'Not Voting' | 'Present';
  date: string;
  description: string;
}

export interface PACContribution {
  pacName: string;
  amount: number;
  cycle: string;
}

export interface CivicOfficial {
  name: string;
  party: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  channels?: { type: string; id: string }[];
  address?: { line1: string; city: string; state: string; zip: string }[];
}

export interface CivicOffice {
  name: string;
  divisionId: string;
  levels?: string[];
  roles?: string[];
  officialIndices: number[];
}

export interface RepresentativeResult {
  politicians: Politician[];
  address: string;
}
