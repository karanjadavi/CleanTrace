'use client';

import Link from 'next/link';

export default function Guide() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 transition-colors">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm text-green-600 hover:underline">&larr; Back to app</Link>

        <h1 className="text-3xl font-bold text-green-800 dark:text-green-400 mt-4 mb-2">How CleanTrace Works</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">A quick guide for anyone using the app for the first time.</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">What this app does</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            CleanTrace tracks pollution readings for locations in Ghana. Every reading &mdash; whether pulled automatically
            from real air quality sensors or submitted by a citizen &mdash; is permanently recorded on the Stellar
            blockchain, so it can never be quietly edited or deleted.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Reading the table</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li><strong>Location</strong> &mdash; the city or area the reading is from</li>
            <li><strong>PM2.5</strong> &mdash; the fine particulate pollution level; a red number with &#9888; means it&apos;s above the safety threshold</li>
            <li><strong>Source</strong> &mdash; &quot;OpenAQ&quot; means it was pulled from a live public sensor; anything else is a citizen submission</li>
            <li><strong>Time</strong> &mdash; when the reading was recorded on-chain</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Submitting a reading</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Type in a location and a PM2.5 value, then hit Submit. It takes a few seconds to be confirmed on-chain &mdash;
            hit Refresh after a moment to see it appear at the top of the table.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Verifying a reading yourself</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Every reading lives on the Stellar testnet, not just in this app. You can independently check the raw contract data at <a href="https://stellar.expert/explorer/testnet/contract/CBCJXJQQZN474BFXRWNCIDJI3EG7TW2QOKQ66F6X5QTQZHCKICIVRDGJ" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Stellar Expert</a> at any time &mdash; nobody, including us, can alter what&apos;s already been recorded.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Why it matters</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Pollution reports usually disappear into a system nobody can check. Here, every report is public and
            permanent &mdash; so it can actually be used as evidence, by journalists, researchers, or communities
            pushing for change.
          </p>
        </section>
      </div>
    </main>
  );
}
