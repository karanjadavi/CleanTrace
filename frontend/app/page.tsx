'use client';

import { useState, useEffect } from 'react';

interface Reading {
  location: string;
  pm25: number;
  source: string;
  timestamp: number;
}

const API_BASE = 'https://cleantrace.onrender.com';
const ALERT_THRESHOLD = 150;

export default function Home() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [pm25, setPm25] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cleantrace-theme');
    if (saved === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('cleantrace-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pollution/readings`);
      const data = await res.json();
      setReadings(data.reverse());
    } catch (err) {
      console.error('Failed to fetch readings', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !pm25) return;

    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/pollution/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          pm25: Number(pm25),
          source: 'citizen-submission',
        }),
      });
      setLocation('');
      setPm25('');
      setTimeout(fetchReadings, 6000);
    } catch (err) {
      console.error('Submit failed', err);
    }
    setSubmitting(false);
  };

  const bg = darkMode ? 'bg-gray-950' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-900' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-500';
  const border = darkMode ? 'border-gray-800' : 'border-gray-200';
  const inputBg = darkMode
    ? 'bg-gray-800 border-gray-700 text-gray-100'
    : 'bg-white border-gray-300 text-gray-900';
  const titleColor = darkMode ? 'text-green-400' : 'text-green-800';

  return (
    <main className={`min-h-screen ${bg} p-8 transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className={`text-3xl font-bold ${titleColor}`}>CleanTrace</h1>
            <p className={`${textSecondary} mb-8`}>
              On-chain verified pollution monitoring for Ghana
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
            className={`p-2 rounded-full border ${border} ${cardBg} hover:opacity-80 transition-opacity`}
          >
            {darkMode ? (
              // Sun icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              // Moon icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>

        <div className={`${cardBg} rounded-lg shadow p-6 mb-8 border ${border}`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>
            Submit a Reading
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Location (e.g. Accra)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`flex-1 border rounded px-3 py-2 ${inputBg}`}
              required
            />
            <input
              type="number"
              placeholder="PM2.5"
              value={pm25}
              onChange={(e) => setPm25(e.target.value)}
              className={`w-32 border rounded px-3 py-2 ${inputBg}`}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        <div className={`${cardBg} rounded-lg shadow p-6 border ${border}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${textPrimary}`}>
              Recent Readings
            </h2>
            <button
              onClick={fetchReadings}
              className="text-sm text-green-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className={textMuted}>Loading...</p>
          ) : readings.length === 0 ? (
            <p className={textMuted}>No readings yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className={`border-b ${border} text-sm ${textMuted}`}>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">PM2.5</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => (
                  <tr key={i} className={`border-b ${border} last:border-0`}>
                    <td className={`py-2 ${textPrimary}`}>{r.location}</td>
                    <td className="py-2">
                      <span
                        className={
                          r.pm25 > ALERT_THRESHOLD
                            ? 'text-red-500 font-semibold'
                            : textPrimary
                        }
                      >
                        {r.pm25}
                        {r.pm25 > ALERT_THRESHOLD && ' ⚠️'}
                      </span>
                    </td>
                    <td className={`py-2 text-sm ${textMuted}`}>{r.source}</td>
                    <td className={`py-2 text-sm ${textMuted}`}>
                      {new Date(r.timestamp * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className={`text-xs ${textMuted} mt-6 text-center`}>
          Data attested on-chain via Soroban smart contract on Stellar testnet
        </p>
      </div>
    </main>
  );
}