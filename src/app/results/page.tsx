'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Politician } from '@/lib/types';
import PoliticianCard from '@/components/PoliticianCard';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = searchParams.get('address');
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [normalizedAddress, setNormalizedAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) {
      router.push('/');
      return;
    }

    async function fetchData() {
      try {
        const res = await fetch(`/api/representatives?address=${encodeURIComponent(address!)}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to find representatives');
          return;
        }
        const data = await res.json();
        setNormalizedAddress(data.address);
        setPoliticians(data.politicians);
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [address, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Finding your elected officials...</p>
        <p className="text-gray-600 text-sm mt-2">This may take a moment as we gather their data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
        >
          Try another address
        </button>
      </div>
    );
  }

  // Group politicians by level
  const federal = politicians.filter(p => p.level === 'federal');
  const state = politicians.filter(p => p.level === 'state');
  const local = politicians.filter(p => p.level === 'local');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          New search
        </button>
        <h1 className="text-3xl font-bold text-white">
          Your <span className="text-blue-500">Representatives</span>
        </h1>
        {normalizedAddress && (
          <p className="text-gray-400 mt-1 text-sm">{normalizedAddress}</p>
        )}
      </div>

      {/* Federal */}
      {federal.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Federal Officials
          </h2>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {federal.map((p, i) => (
              <PoliticianCard key={i} politician={p} />
            ))}
          </div>
        </section>
      )}

      {/* State */}
      {state.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            State Officials
          </h2>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {state.map((p, i) => (
              <PoliticianCard key={i} politician={p} />
            ))}
          </div>
        </section>
      )}

      {/* Local */}
      {local.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Local Officials
          </h2>
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {local.map((p, i) => (
              <PoliticianCard key={i} politician={p} />
            ))}
          </div>
        </section>
      )}

      {politicians.length === 0 && (
        <p className="text-gray-500 text-center py-12">No representatives found for this address.</p>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
