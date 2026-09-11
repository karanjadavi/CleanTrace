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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-2">CleanTrace</h1>
        <p className="text-gray-600 mb-8">
          On-chain verified pollution monitoring for Ghana
        </p>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Submit a Reading</h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Location (e.g. Accra)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="PM2.5"
              value={pm25}
              onChange={(e) => setPm25(e.target.value)}
              className="w-32 border rounded px-3 py-2"
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

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Readings</h2>
            <button
              onClick={fetchReadings}
              className="text-sm text-green-700 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : readings.length === 0 ? (
            <p className="text-gray-500">No readings yet.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-2">Location</th>
                  <th className="pb-2">PM2.5</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{r.location}</td>
                    <td className="py-2">
                      <span
                        className={
                          r.pm25 > ALERT_THRESHOLD
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-800'
                        }
                      >
                        {r.pm25}
                        {r.pm25 > ALERT_THRESHOLD && ' ⚠️'}
                      </span>
                    </td>
                    <td className="py-2 text-sm text-gray-500">{r.source}</td>
                    <td className="py-2 text-sm text-gray-500">
                      {new Date(r.timestamp * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Data attested on-chain via Soroban smart contract on Stellar testnet
        </p>
      </div>
    </main>
  );
}