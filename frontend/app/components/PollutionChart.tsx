'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Reading {
  location: string;
  pm25: number;
  source: string;
  timestamp: number;
}

const COLORS: Record<string, string> = {
  accra: '#16a34a',
  kumasi: '#2563eb',
  takoradi: '#d97706',
  tamale: '#dc2626',
};

function getColor(location: string) {
  return COLORS[location.toLowerCase()] || '#6b7280';
}

export default function PollutionChart({ readings, darkMode }: { readings: Reading[]; darkMode: boolean }) {
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);

  const cities = Array.from(new Set(sorted.map((r) => r.location)));

  const grouped: Record<string, { time: string; [key: string]: any }> = {};
  sorted.forEach((r) => {
    const timeLabel = new Date(r.timestamp * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    if (!grouped[timeLabel]) grouped[timeLabel] = { time: timeLabel };
    grouped[timeLabel][r.location] = r.pm25;
  });

  const chartData = Object.values(grouped);

  const gridColor = darkMode ? '#374151' : '#e5e7eb';
  const textColor = darkMode ? '#9ca3af' : '#6b7280';

  if (chartData.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: textColor }} />
        <YAxis tick={{ fontSize: 11, fill: textColor }} label={{ value: 'PM2.5', angle: -90, position: 'insideLeft', fill: textColor, fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            border: `1px solid ${gridColor}`,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {cities.map((city) => (
          <Line
            key={city}
            type="monotone"
            dataKey={city}
            stroke={getColor(city)}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
