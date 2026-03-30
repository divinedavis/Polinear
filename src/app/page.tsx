'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    router.push(`/results?address=${encodeURIComponent(address.trim())}`);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
          );
          const data = await res.json();
          if (data.address) {
            router.push(`/results?address=${encodeURIComponent(data.address)}`);
          } else {
            alert('Could not determine your address. Please enter it manually.');
            setGeoLoading(false);
          }
        } catch {
          alert('Error getting your location. Please enter your address manually.');
          setGeoLoading(false);
        }
      },
      () => {
        alert('Location access denied. Please enter your address manually.');
        setGeoLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
          Poli<span className="text-blue-500">near</span>
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          See who impacts your life politically. Your elected officials, their views, votes, and who funds them.
        </p>
      </div>

      {/* Search */}
      <div className="mt-10 w-full max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address (e.g. 1600 Pennsylvania Ave, Washington DC)"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {loading ? 'Finding your representatives...' : 'Find My Representatives'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        <button
          onClick={handleGeolocation}
          disabled={geoLoading}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {geoLoading ? 'Getting your location...' : 'Use My Location'}
        </button>
      </div>

      {/* Footer */}
      <p className="mt-16 text-xs text-gray-600">
        No login required. Your location data is not stored.
      </p>
    </div>
  );
}
