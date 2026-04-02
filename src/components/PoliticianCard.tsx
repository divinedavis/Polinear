'use client';

import { Politician } from '@/lib/types';
import CollapsibleSection from './CollapsibleSection';

interface PoliticianCardProps {
  politician: Politician;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTimeUntil(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = new Date();
  const target = new Date(dateStr + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return 'Past';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return remainMonths > 0 ? `${years}y ${remainMonths}mo` : `${years}y`;
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
        <div className="flex-shrink-0">
          {politician.photoUrl ? (
            <img
              src={politician.photoUrl}
              alt={politician.name}
              className="w-20 h-24 object-cover rounded-lg bg-gray-700"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-20 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{politician.name}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{politician.office}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${partyColor}`}>
              {politician.party}
            </span>
          </div>
          {politician.birthplace && (
            <p className="text-xs text-gray-500 mt-2">Born: {politician.birthplace}</p>
          )}
        </div>
      </div>

      {/* Term Info */}
      {(politician.termEnd || politician.nextElection) && (
        <div className="px-4 pb-2">
          <div className="bg-gray-750 rounded-lg p-3 border border-gray-700" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
            <div className="flex justify-between items-center text-xs">
              {politician.termEnd && (
                <div>
                  <span className="text-gray-500">Term ends:</span>{' '}
                  <span className="text-gray-300 font-medium">{formatDate(politician.termEnd)}</span>
                  <span className="text-gray-500 ml-1">({getTimeUntil(politician.termEnd)})</span>
                </div>
              )}
            </div>
            {politician.nextElection && (
              <div className="text-xs mt-1">
                <span className="text-gray-500">Next election:</span>{' '}
                <span className="text-yellow-400 font-medium">{formatDate(politician.nextElection)}</span>
                <span className="text-gray-500 ml-1">({getTimeUntil(politician.nextElection)})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="px-4 pb-2">
<div className="bg-gray-800/50 rounded-lg p-3 mb-3">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Net Worth</h4>
            {politician.netWorth2010 || politician.netWorth2025 ? (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500">2010</p>
                <p className="text-sm font-mono text-gray-300">
                  {politician.netWorth2010 ? `$${politician.netWorth2010 >= 1000000000 ? (politician.netWorth2010 / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B' : politician.netWorth2010 >= 1000000 ? (politician.netWorth2010 / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' : (politician.netWorth2010 / 1000).toFixed(0) + 'K'}` : <span className="text-gray-600">N/A</span>}
                </p>
              </div>
              <div className="text-gray-500 text-lg">&#8594;</div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">2025</p>
                <p className="text-sm font-mono text-gray-300">
                  {politician.netWorth2025 ? `$${politician.netWorth2025 >= 1000000000 ? (politician.netWorth2025 / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B' : politician.netWorth2025 >= 1000000 ? (politician.netWorth2025 / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' : (politician.netWorth2025 / 1000).toFixed(0) + 'K'}` : <span className="text-gray-600">N/A</span>}
                </p>
              </div>
              {politician.netWorth2010 && politician.netWorth2025 ? (
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-500">Change</p>
                  <p className={`text-sm font-mono font-medium ${politician.netWorth2025 > politician.netWorth2010 ? 'text-green-400' : 'text-red-400'}`}>
                    {politician.netWorth2025 > politician.netWorth2010 ? '+' : ''}{(((politician.netWorth2025 - politician.netWorth2010) / politician.netWorth2010) * 100).toFixed(0)}%
                  </p>
                </div>
              ) : null}
            </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Not publicly available</p>
            )}
          </div>

        <CollapsibleSection title="Views on Key Issues" badge={politician.positions.length > 0 ? `${politician.positions.length}` : undefined}>
          {politician.positions.length > 0 ? (
            <div className="space-y-3">
              {politician.positions.map((pos, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-white">{pos.topic}:</span>{' '}
                  <span className="text-gray-400">{pos.stance}</span>
                  {pos.sourceUrl && (
                    <a href={pos.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs ml-1">[Source]</a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Position data not yet available</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Recent Bills Voted On" badge={politician.bills.length > 0 ? `${politician.bills.length}` : undefined}>
          {politician.bills.length > 0 ? (
            <div className="space-y-2">
              {politician.bills.map((bill, i) => (
                <div key={i} className="text-sm border border-gray-700 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${bill.vote === 'Yes' ? 'bg-green-900 text-green-300' : bill.vote === 'No' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'}`}>
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

        <CollapsibleSection title={politician.pacs.length > 0 ? `Top PAC Contributions (Total: $${(() => { const t = politician.pacs.reduce((s, p) => s + p.amount, 0); return t >= 1000000 ? (t/1000000).toFixed(1).replace(/\.0$/, '') + 'M' : t >= 1000 ? (t/1000).toFixed(1).replace(/\.0$/, '') + 'K' : t.toLocaleString(); })()})` : "Top PAC Contributions"} badge={politician.pacs.length > 0 ? `${politician.pacs.length}` : undefined}>
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
