'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ChatWidget from './components/ChatWidget';
import PollutionChart from './components/PollutionChart';
import { translations, Lang } from './translations';

const PollutionMap = dynamic(() => import('./components/PollutionMap'), {
  ssr: false,
  loading: () => <p className="text-gray-400 text-sm">Loading map...</p>,
});

interface Reading {
  location: string;
  pm25: number;
  source: string;
  timestamp: number;
}

const API_BASE = 'https://cleantrace.onrender.com';
const ALERT_THRESHOLD = 150;
const DEFAULT_VISIBLE_ROWS = 5;

export default function Home() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [pm25, setPm25] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem('cleantrace-theme');
    if (saved === 'dark') setDarkMode(true);
    const savedLang = localStorage.getItem('cleantrace-lang') as Lang | null;
    if (savedLang && translations[savedLang]) setLang(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('cleantrace-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('cleantrace-lang', lang);
  }, [lang]);

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
    const interval = setInterval(fetchReadings, 60000);
    return () => clearInterval(interval);
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

  const visibleReadings = showAll ? readings : readings.slice(0, DEFAULT_VISIBLE_ROWS);

  return (
    <main className={`min-h-screen ${bg} p-8 transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className={`text-3xl font-bold ${titleColor}`}>CleanTrace</h1>
            <p className={`${textSecondary} mb-2`}>{t.subtitle}</p>
            <Link href="/guide" className="text-sm text-green-600 hover:underline">
              {t.howItWorks}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className={`text-sm rounded-full border ${border} ${cardBg} ${textPrimary} px-3 py-2 cursor-pointer`}
              aria-label="Select language"
            >
              {Object.entries(translations).map(([code, tr]) => (
                <option key={code} value={code}>
                  {tr.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              className={`p-2 rounded-full border ${border} ${cardBg} hover:opacity-80 transition-opacity`}
            >
              {darkMode ? (
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
        </div>

        <div className={`${cardBg} rounded-lg shadow p-6 mb-8 mt-6 border ${border}`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>{t.submitReading}</h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder={t.locationPlaceholder}
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
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </div>

        <div className={`${cardBg} rounded-lg shadow p-6 mb-8 border ${border}`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>{t.pollutionMap}</h2>
          <PollutionMap readings={readings} />
        </div>

        <div className={`${cardBg} rounded-lg shadow p-6 mb-8 border ${border}`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>{t.pm25Trend}</h2>
          <PollutionChart readings={readings} darkMode={darkMode} />
        </div>

        <div className={`${cardBg} rounded-lg shadow p-6 border ${border}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${textPrimary}`}>{t.recentReadings}</h2>
            <button onClick={fetchReadings} className="text-sm text-green-600 hover:underline">
              {t.refresh}
            </button>
          </div>

          {loading ? (
            <p className={textMuted}>{t.loading}</p>
          ) : readings.length === 0 ? (
            <p className={textMuted}>{t.noReadings}</p>
          ) : (
            <>
              <table className="w-full text-left">
                <thead>
                  <tr className={`border-b ${border} text-sm ${textMuted}`}>
                    <th className="pb-2">{t.location}</th>
                    <th className="pb-2">PM2.5</th>
                    <th className="pb-2">{t.source}</th>
                    <th className="pb-2">{t.time}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReadings.map((r, i) => (
                    <tr key={i} className={`border-b ${border} last:border-0`}>
                      <td className={`py-2 ${textPrimary}`}>{r.location}</td>
                      <td className="py-2">
                        <span
                          className={
                            r.pm25 > ALERT_THRESHOLD ? 'text-red-500 font-semibold' : textPrimary
                          }
                        >
                          {r.pm25}
                          {r.pm25 > ALERT_THRESHOLD && ' \u26a0\ufe0f'}
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
              {readings.length > DEFAULT_VISIBLE_ROWS && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-4 text-sm text-green-600 hover:underline"
                >
                  {showAll ? t.showLess : t.showAll(readings.length)}
                </button>
              )}
            </>
          )}
        </div>

        <p className={`text-xs ${textMuted} mt-6 text-center`}>{t.footer}</p>
      </div>

      <ChatWidget />
    </main>
  );
}
