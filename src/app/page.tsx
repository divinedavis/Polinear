'use client';

import { useEffect, useState, useCallback } from 'react';
import { Politician } from '@/lib/types';
import PoliticianCard from '@/components/PoliticianCard';
import CollapsibleSection from '@/components/CollapsibleSection';

export default function Home() {
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [showManual, setShowManual] = useState(false);

  const detectLocation = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setShowManual(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const geoRes = await fetch(
            `/api/geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
          );
          const geoData = await geoRes.json();

          if (!geoData.address) {
            setError('Could not determine your address.');
            setShowManual(true);
            setLoading(false);
            return;
          }

          await fetchRepresentatives(geoData.address);
        } catch {
          setError('Error getting your location.');
          setShowManual(true);
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied.');
        setShowManual(true);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  async function fetchRepresentatives(addr: string) {
    try {
      const res = await fetch(`/api/representatives?address=${encodeURIComponent(addr)}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to find representatives');
        setShowManual(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAddress(data.address);
      setPoliticians(data.politicians);
    } catch {
      setError('Failed to load data. Please try again.');
      setShowManual(true);
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualAddress.trim()) return;
    setShowManual(false);
    fetchRepresentatives(manualAddress.trim());
    setLoading(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Poli<span className="text-blue-500">near</span>
        </h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Detecting your location...</p>
        <p className="text-gray-600 text-sm mt-2">Finding the politicians who represent you</p>
      </div>
    );
  }

  if (error && showManual && politicians.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Poli<span className="text-blue-500">near</span>
        </h1>
        <p className="text-gray-400 mb-8 text-center">See who impacts your life politically</p>
        <p className="text-yellow-400 text-sm mb-4">{error}</p>
        <form onSubmit={handleManualSubmit} className="w-full max-w-lg flex flex-col gap-3">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Enter your address (e.g. 1600 Pennsylvania Ave, Washington DC)"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
          <button
            type="submit"
            disabled={!manualAddress.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Find My Representatives
          </button>
        </form>
        <button
          onClick={detectLocation}
          className="mt-4 text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Try location again
        </button>
        <p className="mt-12 text-xs text-gray-600">No login required. Your location is not stored.</p>
      </div>
    );
  }

  const federal = politicians.filter(p => p.level === 'federal');
  const state = politicians.filter(p => p.level === 'state');
  const local = politicians.filter(p => p.level === 'local');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Poli<span className="text-blue-500">near</span>
        </h1>
        {address && (
          <p className="text-gray-400 mt-1 text-sm flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {address}
          </p>
        )}
      </div>

      {federal.length > 0 && (
        <section className="mb-4">
          <CollapsibleSection
            title={`Federal Officials (${federal.length})`}
            defaultOpen={true}
            level="federal"
          >
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 pt-2">
              {federal.map((p, i) => (
                <PoliticianCard key={i} politician={p} />
              ))}
            </div>
          </CollapsibleSection>
        </section>
      )}

      {state.length > 0 && (
        <section className="mb-4">
          <CollapsibleSection
            title={`State Officials (${state.length})`}
            defaultOpen={false}
            level="state"
          >
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 pt-2">
              {state.map((p, i) => (
                <PoliticianCard key={i} politician={p} />
              ))}
            </div>
          </CollapsibleSection>
        </section>
      )}

      {local.length > 0 && (
        <section className="mb-4">
          <CollapsibleSection
            title={`Local Officials (${local.length})`}
            defaultOpen={false}
            level="local"
          >
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 pt-2">
              {local.map((p, i) => (
                <PoliticianCard key={i} politician={p} />
              ))}
            </div>
          </CollapsibleSection>
        </section>
      )}

      {politicians.length === 0 && (
        <p className="text-gray-500 text-center py-12">No representatives found for this location.</p>
      )}
    </div>
  );
}
