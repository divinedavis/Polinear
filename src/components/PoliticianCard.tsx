'use client';

import { Politician } from '@/lib/types';
import CollapsibleSection from './CollapsibleSection';

interface PoliticianCardProps {
  politician: Politician;
}

export default function PoliticianCard({ politician }: PoliticianCardProps) {
  const partyColor = politician.party === 'Democrat'
    ? 'bg-blue-600'
    : politician.party === 'Republican'
      ? 'bg-red-600'
      : 'bg-gray-600';

  const partyBorder = politician.party === 'Democrat'
    ? 'border-blue-500'
    : politician.party === 'Republican'
      ? 'border-red-500'
      : 'border-gray-500';

  return (
    <div className={`bg-gray-800 rounded-xl border-l-4 ${partyBorder} overflow-hidden shadow-lg`}>
      {/* Header */}
      <div className="p-4 flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          {politician.photoUrl ? (
            <img
              src={politician.photoUrl}
              alt={politician.name}
              className="w-20 h-24 object-cover rounded-lg bg-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-headshot.svg';
              }}
            />
          ) : (
            <div className="w-20 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{politician.name}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{politician.office}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${partyColor}`}>
              {politician.party}
            </span>
          </div>
          {politician.birthplace && (
            <p className="text-xs text-gray-500 mt-2">
              Born: {politician.birthplace}
            </p>
          )}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="px-4 pb-2">
        {/* Views / Positions */}
        <CollapsibleSection title="Views on Key Issues" badge={politician.positions.length > 0 ? `${politician.positions.length}` : undefined}>
          {politician.positions.length > 0 ? (
            <div className="space-y-3">
              {politician.positions.map((pos, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-white">{pos.topic}:</span>{' '}
                  <span className="text-gray-400">{pos.stance}</span>
                  {pos.sourceUrl && (
                    <a
                      href={pos.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs ml-1"
                    >
                      [Source]
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Position data not yet available</p>
          )}
        </CollapsibleSection>

        {/* Bills */}
        <CollapsibleSection title="Recent Bills Voted On" badge={politician.bills.length > 0 ? `${politician.bills.length}` : undefined}>
          {politician.bills.length > 0 ? (
            <div className="space-y-2">
              {politician.bills.map((bill, i) => (
                <div key={i} className="text-sm border border-gray-700 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      bill.vote === 'Yes' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {bill.vote}
                    </span>
                    <span className="text-gray-400 text-xs">{bill.date}</span>
                  </div>
                  <p className="text-gray-300 mt-1 font-medium">{bill.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{bill.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No bill vote data available</p>
          )}
        </CollapsibleSection>

        {/* PACs */}
        <CollapsibleSection title="Top PAC Contributions" badge={politician.pacs.length > 0 ? `${politician.pacs.length}` : undefined}>
          {politician.pacs.length > 0 ? (
            <div className="space-y-2">
              {politician.pacs.map((pac, i) => (
                <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-700 last:border-0">
                  <span className="text-gray-300 truncate mr-2">{pac.pacName}</span>
                  <span className="text-green-400 font-mono font-medium whitespace-nowrap">
                    ${pac.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No PAC data available</p>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
