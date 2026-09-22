'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['submit', 'report', 'add reading', 'how do i add', 'citizen report'],
    answer:
      "Type a location and a PM2.5 value in the form at the top, then hit Submit. It takes a few seconds to confirm on-chain \u2014 hit Refresh after a moment to see it appear. This works for both automated readings and citizen reports like illegal dumping or smoke.",
  },
  {
    keywords: ['pm2.5', 'pm25', 'threshold', 'alert', 'shown in red', 'particulate'],
    answer:
      "PM2.5 is fine particulate air pollution \u2014 tiny particles small enough to get deep into your lungs and bloodstream. A reading shown in red with \u26a0\ufe0f means it's above the recognized safety threshold (150). Common sources include vehicle exhaust, burning waste, construction dust, and industrial smoke.",
  },
  {
    keywords: ['is this safe', 'trustworthy', 'verify', 'can i trust', 'edit the data', 'delete a reading', 'is it fake'],
    answer:
      "Every reading lives on the Stellar blockchain, not just in this app. Nobody \u2014 including us \u2014 can edit or delete a record once it's submitted. You can check it yourself on Stellar Expert.",
  },
  {
    keywords: ['openaq', 'sensor', 'where does data come from', 'data source'],
    answer:
      "Readings marked \"OpenAQ\" come automatically from OpenAQ's live public air quality sensors. Anything else is a citizen-submitted report.",
  },
  {
    keywords: ['dark mode', 'theme', 'light mode'],
    answer:
      "Click the sun/moon icon in the top-right corner to switch between light and dark mode.",
  },
  {
    keywords: ['smart contract', 'blockchain', 'stellar', 'soroban', 'on-chain', 'onchain'],
    answer:
      "CleanTrace uses a Soroban smart contract on the Stellar testnet. You can view the raw contract data anytime on Stellar Expert \u2014 see the Guide page for the link.",
  },
  {
    keywords: ['guide', 'tutorial', 'instructions'],
    answer:
      "Check out the full Guide page (link near the top) for a step-by-step walkthrough of the app.",
  },
  {
    keywords: ['climate change', 'claimet', 'clamate', 'global warming', 'greenhouse', 'carbon emission', 'co2', 'c02', 'carbon dioxide', 'carbon gas', 'corbon', 'carbon footprint', 'reduce carbon'],
    answer:
      "Main causes of CO2 and air pollution: burning fossil fuels (petrol, diesel, coal) for transport, electricity and industry; deforestation, which removes trees that absorb CO2; burning waste and crop residue in the open; and gas flaring/industrial emissions. \n\nWays to reduce it: switch to renewable energy (solar, wind) where possible; use public transport, cycling, or carpooling instead of driving alone; avoid burning waste \u2014 compost or recycle instead; plant trees and protect existing forests; improve energy efficiency (better insulation, efficient appliances); and support policies that regulate industrial and vehicle emissions. \n\nOn an individual level, reducing waste, conserving electricity, and reporting pollution sources (like this app lets you do) all help build the evidence needed to push for cleaner air at a community level.",
  },
  {
    keywords: ['plastic', 'waste management', 'landfill', 'recycl'],
    answer:
      "Plastic and improperly managed waste are major pollution sources \u2014 they contaminate soil and waterways, and burning plastic releases toxic fumes into the air. Recycling, proper waste collection, and reducing single-use plastic all help reduce this, and citizen reports on CleanTrace can help document illegal dumping sites.",
  },
  {
    keywords: ['water pollution', 'contamination', 'clean water', 'drinking water'],
    answer:
      "Water pollution happens when chemicals, waste, or sewage contaminate rivers, lakes, or groundwater \u2014 making water unsafe to drink or use, and harming aquatic life. It's one of the categories citizens can report on CleanTrace alongside air quality readings.",
  },
  {
    keywords: ['deforestation', 'cutting trees', 'losing forest'],
    answer:
      "Deforestation removes trees that would otherwise absorb CO2 and filter air pollutants, and it destroys habitats and worsens soil erosion. Fewer trees generally means worse local air quality over time.",
  },
  {
    keywords: ['renewable energy', 'solar power', 'wind power', 'clean energy'],
    answer:
      "Renewable energy \u2014 like solar and wind \u2014 produces electricity without burning fossil fuels, which are a major source of the air pollution this app tracks. Expanding renewable energy is one of the most effective long-term ways to reduce PM2.5 and other pollutants.",
  },
  {
    keywords: ['biodiversity', 'wildlife', 'ecosystem', 'species'],
    answer:
      "Pollution doesn't just affect people \u2014 it disrupts ecosystems, contaminates food chains, and threatens wildlife. Healthy, low-pollution environments support greater biodiversity.",
  },
  {
    keywords: ['sustainab', 'green living', 'eco-friendly'],
    answer:
      "Sustainability means meeting today's needs without compromising the environment for the future \u2014 things like reducing waste, conserving energy and water, and supporting clean-air initiatives all contribute. Reporting pollution you see is itself a small but real contribution.",
  },
  {
    keywords: ['importance of', 'why is it important', 'impotant', 'why clean environment', 'health effects', 'environmental impact', 'pollution matter', 'prevent pollution', 'how to prevent', 'privent', 'why keep clean', 'benefits of clean'],
    answer:
      "Polluted air and water directly harm human health \u2014 causing respiratory illness, heart disease, and reduced life expectancy \u2014 and damage crops, water sources, and ecosystems that communities depend on. To help prevent pollution: reduce burning of waste and fossil fuels, support renewable energy, recycle and manage waste properly, protect trees and green spaces, and report pollution incidents so there's a public record to act on. Keeping track of pollution isn't just data collection; it gives people the evidence they need to push for cleaner air, safer water, and better environmental policy where they live.",
  },
  {
    keywords: ['what is cleantrace', 'what does cleantrace do', 'about this app', 'explain this app', 'clean trace', 'how does cleantrace work', 'how does this work', 'how this app work', 'what can you help'],
    answer:
      "CleanTrace tracks pollution readings for locations in Ghana. Every reading is permanently recorded on the Stellar blockchain, so it can never be quietly edited or deleted. Air quality data comes in automatically from OpenAQ sensors, and anyone can also submit a citizen report.",
  },
];

const DEFAULT_ANSWER =
  "I'm not sure about that specific one \u2014 but I can help with questions about pollution, air and water quality, climate change, recycling, renewable energy, or how CleanTrace itself works. Try rephrasing, or check the Guide page for more detail.";

function getAnswer(question: string): string {
  const q = question.toLowerCase();
  for (const entry of FAQ) {
    if (entry.keywords.some((k) => q.includes(k))) {
      return entry.answer;
    }
  }
  return DEFAULT_ANSWER;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! Ask me about how CleanTrace works, or any general question about pollution, air quality, water, climate, or the environment.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', text: input };
    const botMsg: Message = { role: 'bot', text: getAnswer(input) };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-sm">CleanTrace Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white hover:opacity-75">
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-green-600 text-white ml-auto'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-800 p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              className="bg-green-700 text-white text-sm px-3 py-1 rounded hover:bg-green-800"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="bg-green-700 hover:bg-green-800 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl"
        aria-label="Open assistant"
      >
        {open ? '\u00d7' : '\ud83d\udcac'}
      </button>
    </div>
  );
}
