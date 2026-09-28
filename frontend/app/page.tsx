'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ChatWidget from './components/ChatWidget';
import PollutionChart from './components/PollutionChart';
import { translations, Lang } from './translations';

const PollutionMap = dynamic(() => import('./components/PollutionMap'), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-lg bg-gray-500/20" />,
});

interface Reading {
  location: string;
  pm25: number;
  source: string;
  timestamp: number;
}

type Status = 'good' | 'moderate' | 'unhealthy' | 'hazardous';

const API_BASE = 'https://cleantrace.onrender.com';
const CONTRACT_URL =
  'https://stellar.expert/explorer/testnet/contract/CBCJXJQQZN474BFXRWNCIDJI3EG7TW2QOKQ66F6X5QTQZHCKICIVRDGJ';
const GITHUB_URL = 'https://github.com/karanjadavi/CleanTrace';
const DEFAULT_VISIBLE_ROWS = 5;
const REFRESH_MS = 24 * 60 * 60 * 1000;

function getStatus(pm25: number): Status {
  if (pm25 > 150) return 'hazardous';
  if (pm25 > 55) return 'unhealthy';
  if (pm25 > 25) return 'moderate';
  return 'good';
}

function badgeClass(status: Status, dark: boolean): string {
  const light: Record<Status, string> = {
    good: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    unhealthy: 'bg-orange-100 text-orange-800',
    hazardous: 'bg-red-100 text-red-800',
  };
  const night: Record<Status, string> = {
    good: 'bg-green-900/40 text-green-300',
    moderate: 'bg-yellow-900/40 text-yellow-300',
    unhealthy: 'bg-orange-900/40 text-orange-300',
    hazardous: 'bg-red-900/40 text-red-300',
  };
  return dark ? night[status] : light[status];
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Home() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [pm25, setPm25] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  const t = { ...translations.en, ...translations[lang] };

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
    const interval = setInterval(fetchReadings, REFRESH_MS);
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

  const latestByCity = useMemo(() => {
    const m: Record<string, Reading> = {};
    for (const r of readings) {
      const k = r.location.toLowerCase();
      if (!m[k] || r.timestamp > m[k].timestamp) m[k] = r;
    }
    return m;
  }, [readings]);

  const liveSensorReadings = Object.values(latestByCity).filter(
    (r) => r.source === 'OpenAQ',
  );
  const averagePm25 =
    liveSensorReadings.length > 0
      ? Math.round(
          liveSensorReadings.reduce((sum, r) => sum + r.pm25, 0) /
            liveSensorReadings.length,
        )
      : null;

  const stats = [
    { label: t.statCities, value: String(liveSensorReadings.length) },
    { label: t.statAverage, value: averagePm25 === null ? '-' : String(averagePm25) },
    { label: t.statTotal, value: String(readings.length) },
    {
      label: t.statLastReading,
      value: readings.length > 0 ? formatTime(readings[0].timestamp) : '-',
    },
  ];

  const statusLabel: Record<Status, string> = {
    good: t.statusGood,
    moderate: t.statusModerate,
    unhealthy: t.statusUnhealthy,
    hazardous: t.statusHazardous,
  };

  const legend: { status: Status; range: string }[] = [
    { status: 'good', range: '0-25' },
    { status: 'moderate', range: '26-55' },
    { status: 'unhealthy', range: '56-150' },
    { status: 'hazardous', range: '150+' },
  ];

  const bg = darkMode ? 'bg-gray-950' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-900' : 'bg-white';
  const navBg = darkMode ? 'bg-gray-950/80' : 'bg-white/80';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-500';
  const border = darkMode ? 'border-gray-800' : 'border-gray-200';
  const inputBg = darkMode
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const accent = darkMode ? 'text-green-400' : 'text-green-700';
  const card = `${cardBg} rounded-xl border ${border} shadow-sm`;

  const visibleReadings = showAll ? readings : readings.slice(0, DEFAULT_VISIBLE_ROWS);
  const initialLoading = loading && readings.length === 0;

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <header className={`sticky top-0 z-40 border-b ${border} ${navBg} backdrop-blur`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`h-7 w-7 ${accent}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span className={`text-lg font-bold ${textPrimary}`}>CleanTrace</span>
            <span
              className={`ml-2 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium md:inline-flex ${
                darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {t.liveBadge}
            </span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/guide"
              className={`hidden text-sm font-medium hover:underline sm:inline ${textSecondary}`}
            >
              {t.navGuide}
            </Link>
            
              <a href={CONTRACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden text-sm font-medium hover:underline sm:inline ${textSecondary}`}
            >
              {t.navContract}
            </a>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${border} ${cardBg} ${textPrimary}`}
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
              className={`rounded-full border p-2 transition-opacity hover:opacity-80 ${border} ${cardBg}`}
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-400"
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
                  className="h-5 w-5 text-gray-600"
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
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8">
          <h1 className={`text-2xl font-bold sm:text-3xl ${textPrimary}`}>{t.subtitle}</h1>
          <Link href="/guide" className={`mt-2 inline-block text-sm hover:underline ${accent}`}>
            {t.howItWorks}
          </Link>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`${card} p-4`}>
              <p className={`text-xs font-medium uppercase tracking-wide ${textMuted}`}>
                {s.label}
              </p>
              {initialLoading ? (
                <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-500/20" />
              ) : (
                <p className={`mt-1 text-xl font-bold sm:text-2xl ${textPrimary}`}>{s.value}</p>
              )}
            </div>
          ))}
        </section>

        <section className={`${card} mb-8 p-6`}>
          <h2 className={`mb-4 text-lg font-semibold ${textPrimary}`}>{t.submitReading}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder={t.locationPlaceholder}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`flex-1 rounded-lg border px-3 py-2 ${inputBg}`}
              required
            />
            <input
              type="number"
              placeholder="PM2.5"
              value={pm25}
              onChange={(e) => setPm25(e.target.value)}
              className={`rounded-lg border px-3 py-2 sm:w-32 ${inputBg}`}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-green-700 px-5 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className={`${card} p-6`}>
            <h2 className={`mb-4 text-lg font-semibold ${textPrimary}`}>{t.pollutionMap}</h2>
            <PollutionMap readings={readings} />
            <div className="mt-4">
              <p className={`mb-2 text-xs font-medium ${textMuted}`}>{t.legendTitle}</p>
              <div className="flex flex-wrap gap-2">
                {legend.map((l) => (
                  <span
                    key={l.status}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(l.status, darkMode)}`}
                  >
                    {statusLabel[l.status]} {l.range}
                  </span>
                ))}
              </div>
              <p className={`mt-2 text-xs ${textMuted}`}>{t.legendNote}</p>
            </div>
          </div>

          <div className={`${card} p-6`}>
            <h2 className={`mb-4 text-lg font-semibold ${textPrimary}`}>{t.pm25Trend}</h2>
            {initialLoading ? (
              <div className="h-64 w-full animate-pulse rounded-lg bg-gray-500/20" />
            ) : (
              <PollutionChart readings={readings} darkMode={darkMode} />
            )}
          </div>
        </section>

        <section className={`${card} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${textPrimary}`}>{t.recentReadings}</h2>
            <button onClick={fetchReadings} className={`text-sm hover:underline ${accent}`}>
              {t.refresh}
            </button>
          </div>

          {initialLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-full animate-pulse rounded bg-gray-500/20" />
              ))}
            </div>
          ) : readings.length === 0 ? (
            <p className={textMuted}>{t.noReadings}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b text-xs uppercase tracking-wide ${border} ${textMuted}`}>
                      <th className="pb-2 pr-3 font-medium">{t.location}</th>
                      <th className="pb-2 pr-3 font-medium">PM2.5</th>
                      <th className="pb-2 pr-3 font-medium">{t.status}</th>
                      <th className="hidden pb-2 pr-3 font-medium sm:table-cell">{t.source}</th>
                      <th className="pb-2 font-medium">{t.time}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleReadings.map((r, i) => {
                      const status = getStatus(r.pm25);
                      return (
                        <tr key={i} className={`border-b last:border-0 ${border}`}>
                          <td className={`py-3 pr-3 font-medium ${textPrimary}`}>
                            {titleCase(r.location)}
                          </td>
                          <td className={`py-3 pr-3 ${textPrimary}`}>{r.pm25}</td>
                          <td className="py-3 pr-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(status, darkMode)}`}
                            >
                              {statusLabel[status]}
                            </span>
                          </td>
                          <td className={`hidden py-3 pr-3 text-sm sm:table-cell ${textMuted}`}>
                            {r.source}
                          </td>
                          <td className={`py-3 text-sm ${textMuted}`}>{formatTime(r.timestamp)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {readings.length > DEFAULT_VISIBLE_ROWS && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className={`mt-4 text-sm hover:underline ${accent}`}
                >
                  {showAll ? t.showLess : t.showAll(readings.length)}
                </button>
              )}
            </>
          )}
        </section>
      </main>

      <footer className={`border-t ${border} ${cardBg}`}>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm font-semibold ${textPrimary}`}>CleanTrace</p>
              <p className={`text-xs ${textMuted}`}>{t.footerBuilt}</p>
            </div>
            <div className="flex gap-4 text-sm">
              
                <a href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline ${accent}`}
              >
                GitHub
              </a>
              
                <a href={CONTRACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline ${accent}`}
              >
                Stellar Expert
              </a>
              <Link href="/guide" className={`hover:underline ${accent}`}>
                {t.navGuide}
              </Link>
            </div>
          </div>
          <p className={`mt-4 text-xs ${textMuted}`}>{t.footer}</p>
          <p className={`mt-1 text-xs ${textMuted}`}>{t.dataCredit}</p>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}

