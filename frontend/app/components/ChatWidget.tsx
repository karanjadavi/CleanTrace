'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface ChatSession {
  id: string;
  startedAt: number;
  messages: Message[];
}

interface Topic {
  keywords: string[];
  answer: string;
}

interface CompiledKeyword {
  base: string;
  prefix: boolean;
}

interface CompiledTopic {
  answer: string;
  keys: CompiledKeyword[];
}

const CONTRACT_ID = 'CBCJXJQQZN474BFXRWNCIDJI3EG7TW2QOKQ66F6X5QTQZHCKICIVRDGJ';
const STORAGE_CURRENT = 'cleantrace-chat-current';
const STORAGE_SESSIONS = 'cleantrace-chat-sessions';
const MAX_SESSIONS = 20;

const WELCOME =
  "Hi! I'm the CleanTrace helper. Ask me how the app works, what the numbers and colors mean, or anything about air pollution and the environment. Tap a suggestion to start.";

const SUGGESTIONS = [
  'How does CleanTrace work?',
  'Which cities are covered?',
  'How often is data updated?',
  'What do the colors mean?',
  'How do I submit a reading?',
  'Can I trust this data?',
];

const TOPICS: Topic[] = [
  {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    answer:
      "Hello! Ask me how CleanTrace works, what the numbers and colors mean, or anything about air pollution and the environment.",
  },
  {
    keywords: ['thanks', 'thank you', 'thank', 'appreciate it'],
    answer: "You're welcome! Ask me anything else about CleanTrace or the environment.",
  },
  {
    keywords: [
      'what is cleantrace', 'what is clean trace', 'about cleantrace', 'about clean trace',
      'what does cleantrace do', 'what does clean trace do', 'what does this app do',
      'what is this app', 'what is this site', 'what is this website', 'what is this',
      'how does cleantrace work', 'how does clean trace work', 'how do this clean trace work',
      'how does this work', 'how does this app work', 'how does it work', 'how do this work',
      'explain this app', 'explain cleantrace', 'tell me about this app',
      'tell me about cleantrace', 'purpose of this app', 'clean trace work', 'cleantrace work',
    ],
    answer:
      "CleanTrace is a public dashboard that tracks air quality (PM2.5) in Ghana and stores every reading on the Stellar blockchain, so the record can't be quietly edited or deleted.\n\nLive readings come from OpenAQ sensors in Accra, Kumasi, Takoradi and Tamale, and anyone can also submit a reading. The map, the trend chart and the table all show the same on-chain data.",
  },
  {
    keywords: [
      'tech stack', 'technology', 'technologies', 'built with', 'made with', 'architecture',
      'under the hood', 'behind the scenes', 'how is it built', 'how was it built',
      'how is this built', 'data flow', 'what powers', 'backend', 'frontend', 'nestjs',
      'next js', 'nextjs', 'rust', 'vercel', 'render', 'react',
    ],
    answer:
      "Behind the scenes: sensors report to OpenAQ, the CleanTrace backend reads them and writes each reading to a smart contract on the Stellar testnet, and this website asks the backend for the stored readings and draws them. Readings you submit take the same path.\n\nThe pieces: Rust/Soroban smart contract, NestJS backend on Render, Next.js website on Vercel, Leaflet and OpenStreetMap for the map, and Recharts for the chart.",
  },
  {
    keywords: [
      'which cities', 'what cities', 'which city', 'cities', 'other cities', 'more cities',
      'my city', 'add a city', 'which places', 'what places', 'which areas', 'what areas',
      'coverage', 'covered',
    ],
    answer:
      "Live sensor data is pulled for four cities: Accra (Kwame Nkrumah Circle), Kumasi (Adum), Takoradi (Market Circle) and Tamale (Central High Street). The map shows these four.\n\nYou can also submit a reading for any other place. It will appear in the table and the chart, but not as a pin on the map.",
  },
  {
    keywords: [
      'only ghana', 'ghana only', 'why ghana', 'why only', 'other countries', 'outside ghana',
      'another country', 'africa', 'kenya', 'nigeria', 'nairobi', 'lagos', 'worldwide', 'global',
    ],
    answer:
      "CleanTrace was built for a hackathon challenge focused on Ghana, so the live sensors are four Ghanaian cities. Nothing in the design is limited to Ghana: OpenAQ has sensors in many countries and the contract accepts any location, so other places can be added by connecting more sensors.",
  },
  {
    keywords: [
      'how often', 'update*', 'refresh*', 'real time', 'realtime', 'live data', 'live feed',
      'is it live', 'how fresh', 'latest data', 'new data', 'last updated', 'frequency',
      'how long', 'daily', 'every day', 'midnight', 'schedule*', 'cron',
    ],
    answer:
      "Three things happen on different schedules:\n\n1. The backend pulls new sensor readings from OpenAQ once a day, at midnight (GMT).\n2. This page reloads its data every 24 hours, and the Refresh button reloads it right away.\n3. A reading you submit shows up a few seconds after it is confirmed on the ledger.\n\nTiming can vary a little because the app runs on free hosting, so think of it as a daily snapshot rather than a live feed.",
  },
  {
    keywords: [
      'missing', 'not showing', 'not updating', 'not updated', 'no data', 'why no', 'gap*',
      'skipped', 'only some cities', 'outdated', 'stale', 'old data', 'delay*',
    ],
    answer:
      "A city can be missing from a run if its sensor was offline, OpenAQ was slow to answer, or the free hosting was asleep at that moment. The next scheduled run tries again. Use 'Show all' under the table to see older readings.",
  },
  {
    keywords: [
      'submit*', 'add a reading', 'add reading', 'send a reading', 'enter a reading',
      'enter data', 'how do i add', 'post a reading', 'contribute*', 'my own reading', 'add data',
    ],
    answer:
      "Use the Submit a Reading card: type a place and a PM2.5 value, then press Submit. The backend writes it to the contract and it usually appears in the table within a few seconds. Your entry is labelled 'citizen-submission'.\n\nIt is public and permanent, so please only enter values you actually measured, for example with a personal air-quality monitor.",
  },
  {
    keywords: [
      'report*', 'citizen report*', 'illegal dumping', 'dumping', 'dump', 'incident*',
      'photo*', 'picture*', 'image*', 'upload*', 'complain*',
    ],
    answer:
      "Right now the website form only takes PM2.5 readings. The smart contract already supports citizen reports (a place, a category such as dumping or smoke, and a hash of a photo), but there is no report form on the website yet.",
  },
  {
    keywords: [
      'color*', 'colour*', 'what does red mean', 'red', 'green', 'yellow', 'orange', 'status*',
      'badge*', 'good', 'moderate', 'unhealthy', 'hazardous', 'legend', 'air quality scale',
      'bands', 'scale', 'categor*', 'levels', 'what is good',
    ],
    answer:
      "Each reading gets a status from its PM2.5 value (\u00b5g/m\u00b3):\n\nGood: 0-25 (green)\nModerate: 26-55 (yellow)\nUnhealthy: 56-150 (orange)\nHazardous: above 150 (red)\n\nThese are simplified bands for quick reading, not a medical guideline. The map circles use the same colors.",
  },
  {
    keywords: [
      'who guideline*', 'world health organization', 'world health organisation',
      'who recommend*', 'who limit', 'who standard', 'safe level*', 'safe pm25',
      'safe to breathe', 'healthy level*', 'guideline*', 'standard*',
    ],
    answer:
      "The WHO 2021 guideline is a 24-hour average PM2.5 of no more than 15 \u00b5g/m\u00b3 (and 5 \u00b5g/m\u00b3 as a yearly average). CleanTrace's 'Good' band goes up to 25, so it is more relaxed than the WHO guideline. Lower is always better for health.",
  },
  {
    keywords: [
      'pm25', 'pm 25', 'pm2', 'what is pm', 'fine particles', 'particulate*', 'particulates',
      'micrograms', 'ug m3', 'ug m',
    ],
    answer:
      "PM2.5 means fine particles in the air smaller than 2.5 micrometres, roughly 30 times thinner than a human hair. They are small enough to reach deep into the lungs and even the bloodstream. Common sources are vehicle exhaust, burning waste or wood, charcoal cooking, industry, and dust. It is measured in \u00b5g/m\u00b3.",
  },
  {
    keywords: [
      'what is air pollution', 'what is air quality', 'air quality index', 'aqi',
      'define air pollution', 'pm10', 'ozone', 'nitrogen dioxide', 'carbon monoxide',
      'other pollutants', 'other gases', 'no2', 'so2',
    ],
    answer:
      "Air pollution is a mix of harmful particles and gases in the air, such as PM2.5, PM10, nitrogen dioxide, ozone and carbon monoxide. 'Air quality' describes how clean or polluted the air is. CleanTrace tracks PM2.5 only, one of the most health-relevant measures, and shows status bands instead of an index number.",
  },
  {
    keywords: [
      'causes of air pollution', 'what causes air pollution', 'what causes pollution',
      'cause of pollution', 'causes of pollution', 'sources of pollution',
      'sources of air pollution', 'where does pollution come from', 'open burning',
      'burning waste', 'charcoal', 'firewood', 'cooking', 'vehicle*', 'traffic', 'exhaust',
    ],
    answer:
      "Common sources of fine-particle pollution in Ghana's cities include vehicle exhaust and traffic congestion, open burning of waste, cooking with charcoal or firewood, roadside and construction dust, industry, and Harmattan dust in the dry season.",
  },
  {
    keywords: [
      'harmattan', 'dust', 'dusty', 'season*', 'dry season', 'rainy season', 'wet season',
      'weather',
    ],
    answer:
      "The Harmattan is a dry, dusty wind that blows across West Africa from roughly late November to March. It carries a lot of fine dust, so PM2.5 is often higher then. Rain tends to wash particles out of the air, so readings are often lower in the wet season.",
  },
  {
    keywords: [
      'protect*', 'mask*', 'n95', 'stay safe', 'what should i do', 'exposure', 'asthma',
      'children', 'kids', 'elderly', 'outdoor*', 'exercise', 'jogging', 'running', 'symptom*',
      'breathing', 'breathe', 'lungs',
    ],
    answer:
      "When PM2.5 is high (Unhealthy or Hazardous here): limit strenuous outdoor activity, keep windows closed near busy roads or smoke, wear a well-fitted N95 or FFP2 type mask outdoors if you can, and take extra care with children, older people and anyone with asthma or heart or lung conditions. This is general information, not medical advice.",
  },
  {
    keywords: [
      'why blockchain', 'why use blockchain', 'why stellar', 'why on chain', 'why onchain',
      'benefit of blockchain', 'purpose of blockchain', 'tamper*', 'immutable', 'permanent',
      'edit*', 'delet*', 'changed', 'alter*', 'manipulat*',
    ],
    answer:
      "Pollution records are only useful if people can trust them. Once a reading is written to the contract, nobody can edit or delete it, including the CleanTrace team, and anyone can check the record independently.",
  },
  {
    keywords: [
      'verify*', 'verification', 'check the contract', 'stellar expert', 'contract address',
      'contract id', 'view contract', 'see contract', 'explorer', 'proof', 'transaction*', 'hash',
    ],
    answer: `Open the Contract link in the top menu, or the Stellar Expert link in the footer, to see the smart contract on the Stellar testnet and its transactions.\n\nContract ID: ${CONTRACT_ID}`,
  },
  {
    keywords: [
      'what is blockchain', 'what is a blockchain', 'what is stellar', 'what is soroban',
      'what is a smart contract', 'what is smart contract', 'smart contract', 'soroban',
      'stellar', 'blockchain', 'on chain', 'onchain', 'ledger', 'explain blockchain',
    ],
    answer:
      "A blockchain is a shared record book that many computers keep copies of, so no single party can change it. Stellar is one such network, and Soroban is its smart-contract platform: small programs that run on the network. CleanTrace's contract is a small program that stores pollution readings.",
  },
  {
    keywords: [
      'testnet', 'test network', 'mainnet', 'real money', 'xlm', 'wallet*', 'crypto*',
      'token*', 'gas fee', 'gas fees', 'fee*', 'lumens', 'freighter',
    ],
    answer:
      "CleanTrace runs on the Stellar testnet, a public test network. You don't need a wallet or any crypto to use the site, and test-network coins have no real value. Because it is a test network, it can be reset from time to time, so this is a prototype rather than a permanent archive.",
  },
  {
    keywords: [
      'can i trust', 'trust*', 'accura*', 'reliab*', 'how accurate', 'is the data real',
      'is it real', 'real data', 'fake', 'correct', 'calibrat*', 'low cost', 'sensor quality',
      'reference grade', 'is the data right', 'is it true',
    ],
    answer:
      "The blockchain proves that a value was recorded and never changed, not that it was measured correctly.\n\nLive readings come from sensor nodes listed on OpenAQ under Breathe Accra and Ghana AQ. These are sensor nodes rather than reference-grade regulatory monitors, so they are good for spotting trends but can differ from official equipment.\n\nCitizen-submitted readings are not checked. Use the Source column to tell the two apart.",
  },
  {
    keywords: [
      'openaq', 'open aq', 'data source', 'data sources', 'where does the data come from',
      'where do the readings come from', 'where is the data from', 'where does data come from',
      'sensor*', 'who collects', 'clarity', 'breathe accra', 'ghana aq', 'station*',
    ],
    answer:
      "The automatic readings come from OpenAQ, an open air-quality data platform that gathers data from sensors around the world. The Ghana stations used here are listed under the Breathe Accra and Ghana AQ projects and use Clarity sensor nodes.",
  },
  {
    keywords: ['dark mode', 'light mode', 'theme', 'night mode', 'moon', 'sun icon', 'dark theme'],
    answer:
      "Use the sun/moon button in the top bar to switch between light and dark mode. Your choice is remembered on this device.",
  },
  {
    keywords: [
      'language*', 'twi', 'ewe', 'fante', 'translate*', 'translation*', 'local language*',
      'switch language', 'ga language',
    ],
    answer:
      "Use the language menu in the top bar to switch between English, Twi, Ewe, Fante and Ga. Your choice is remembered, and some newer labels are still English only.",
  },
  {
    keywords: ['mobile', 'phone', 'android', 'iphone', 'tablet', 'responsive', 'small screen'],
    answer:
      "Yes, the layout adapts to phones and tablets. On small screens the table hides the Source column so everything fits.",
  },
  {
    keywords: [
      'stat cards', 'stats', 'cards', 'average', 'total readings', 'readings on chain',
      'cities with live sensors', 'last reading', 'top boxes', 'numbers at the top', 'summary',
    ],
    answer:
      "The four cards at the top show: how many cities whose latest reading came from a live sensor, the average of those readings, the total number of readings stored on-chain, and the time of the most recent reading.",
  },
  {
    keywords: ['chart', 'graph', 'trend*', 'history', 'historical', 'line chart', 'lines', 'over time'],
    answer:
      "The PM2.5 Trend chart draws one line per place, showing how readings changed over time. Hover over a point to see its value.",
  },
  {
    keywords: ['map', 'marker*', 'pin*', 'circle*', 'leaflet', 'openstreetmap', 'open street map'],
    answer:
      "The map shows one circle per monitored city, colored by that city's latest PM2.5 status. Click a circle to see the value, source and time. It only shows the four cities with live sensors.",
  },
  {
    keywords: [
      'show all', 'table', 'recent readings', 'rows', 'more readings', 'older readings',
      'see all', 'all readings', 'list of readings',
    ],
    answer:
      "The Recent Readings table lists the newest five readings. Click 'Show all' under it to see every reading stored so far.",
  },
  {
    keywords: [
      'free', 'cost*', 'price*', 'pay', 'login', 'log in', 'sign in', 'sign up', 'account*',
      'register', 'password', 'privacy', 'private', 'personal data', 'personal information',
      'anonymous', 'data collected', 'do i need',
    ],
    answer:
      "CleanTrace is free and needs no account, wallet or sign-in. The form asks only for a place and a PM2.5 value. Anything you submit is public and permanent on the ledger, so don't include personal information.",
  },
  {
    keywords: [
      'for developers', 'api', 'endpoint*', 'json', 'rest api', 'integrat*', 'download*',
      'export*', 'csv', 'dataset', 'open data', 'use the data', 'fetch the data',
    ],
    answer:
      "You can read all stored readings as JSON from https://cleantrace.onrender.com/pollution/readings, and stored citizen reports from /pollution/reports on the same address. The root address describes the API. There is no CSV export yet.",
  },
  {
    keywords: [
      'who built', 'who made', 'who created', 'who is behind', 'who developed',
      'who is the developer', 'the developer', 'developed by', 'team', 'hackathon',
      'tech hub africa', 'open source', 'source code', 'github', 'repo*', 'author', 'creator',
    ],
    answer:
      "CleanTrace was built by an independent developer for the Tech Hub Africa Hackathon 2026 (Reducing Public Pollution track). The code is public on GitHub, with a link in the footer.",
  },
  {
    keywords: [
      'are you ai', 'are you a bot', 'are you a robot', 'are you real', 'who are you',
      'what are you', 'chatbot', 'chat bot', 'assistant', 'chatgpt', 'claude', 'gpt',
      'how do you work', 'are you human',
    ],
    answer:
      "I'm a simple built-in helper, not a live AI model. I answer from a fixed set of topics about CleanTrace and about pollution and the environment, so if I miss your question, try rephrasing it or tap one of the suggestions.",
  },
  {
    keywords: [
      'help', 'what can you do', 'what can i ask', 'topics', 'options', 'questions', 'menu',
      'commands', 'what do you know', 'support',
    ],
    answer:
      "I can help with:\n\n- How CleanTrace works and what it is built with\n- Which cities are covered and how often data updates\n- What the colors and numbers mean\n- Submitting a reading, and whether the data can be trusted\n- Air pollution, health, climate, waste, water and the environment",
  },
  {
    keywords: [
      'climate change', 'climate', 'claimet', 'clamate', 'global warming', 'greenhouse*',
      'carbon', 'corbon', 'co2', 'c02', 'carbon dioxide', 'emission*', 'footprint',
    ],
    answer:
      "CleanTrace measures PM2.5 particles, not CO2, but the sources overlap.\n\nMain causes of CO2 and air pollution: burning fossil fuels (petrol, diesel, coal) for transport, electricity and industry; deforestation, which removes trees that absorb CO2; and burning waste in the open.\n\nWays to reduce it: switch to renewable energy such as solar and wind, use public transport, cycling or carpooling, avoid burning waste, plant and protect trees, use energy more efficiently, and support rules that limit vehicle and industrial emissions.",
  },
  {
    keywords: [
      'prevent*', 'privent', 'prevnt', 'avoid pollution', 'reduce pollution',
      'reduce air pollution', 'stop pollution', 'ways to reduce', 'how can i help',
      'how can we help', 'what can i do', 'what can we do', 'how can we reduce',
      'how can we stop', 'how can we prevent', 'how can we fix', 'solution*', 'fix pollution',
      'clean air', 'clean up',
    ],
    answer:
      "Practical ways to reduce pollution: don't burn waste, use cleaner cooking (LPG or improved stoves), walk, cycle, carpool or use public transport, keep vehicles well maintained, plant and protect trees, save electricity, and support cleaner energy. You can also record what you measure so there is a public record to act on.",
  },
  {
    keywords: [
      'important', 'importance', 'impotant', 'importent', 'why clean',
      'why does pollution matter', 'pollution matter*', 'health effects',
      'effects of pollution', 'effects of air pollution', 'harmful', 'harm', 'why care',
      'why is it important', 'benefits of clean', 'clean environment', 'why keep',
    ],
    answer:
      "Polluted air and water harm human health, causing breathing problems, heart disease and shorter lives, and they damage crops, water sources and ecosystems that communities depend on. Keeping a public, tamper-proof record of pollution gives people evidence to push for cleaner air, safer water and better policy where they live.",
  },
  {
    keywords: [
      'plastic*', 'waste', 'landfill*', 'recycl*', 'rubbish', 'trash', 'litter', 'garbage',
    ],
    answer:
      "Plastic and poorly managed waste pollute soil and waterways, and burning them releases toxic smoke that adds to PM2.5. Reduce single-use plastic, separate and recycle where you can, and never burn rubbish. CleanTrace tracks air quality only, so it does not record dumping.",
  },
  {
    keywords: [
      'water pollution', 'water quality', 'contamination', 'contaminated', 'clean water',
      'drinking water', 'river*', 'galamsey', 'mining', 'sewage', 'sanitation',
    ],
    answer:
      "Water pollution happens when chemicals, waste or sewage contaminate rivers, lakes or groundwater, making water unsafe to drink and harming aquatic life. In Ghana, illegal small-scale gold mining (galamsey) is a major cause of river pollution. CleanTrace tracks air quality only, not water quality.",
  },
  {
    keywords: [
      'deforestation', 'cutting trees', 'losing forest', 'forest*', 'tree*', 'plant a tree',
      'tree planting',
    ],
    answer:
      "Deforestation removes trees that absorb CO2 and filter pollutants, and it destroys habitats and worsens soil erosion. Fewer trees generally means worse local air quality over time.",
  },
  {
    keywords: [
      'renewable*', 'solar', 'wind power', 'clean energy', 'green energy', 'fossil fuel*',
      'electricity',
    ],
    answer:
      "Renewable energy such as solar and wind produces electricity without burning fossil fuels, a major source of air pollution. Expanding it is one of the most effective long-term ways to reduce PM2.5 and other pollutants.",
  },
  {
    keywords: ['biodiversity', 'wildlife', 'ecosystem*', 'species', 'animals', 'habitat*'],
    answer:
      "Pollution doesn't only affect people. It disrupts ecosystems, contaminates food chains and threatens wildlife. Healthy, low-pollution environments support greater biodiversity.",
  },
  {
    keywords: ['sustainab*', 'green living', 'eco friendly', 'ecofriendly', 'reduce footprint'],
    answer:
      "Sustainability means meeting today's needs without harming the environment for the future: reducing waste, saving energy and water, and supporting clean-air initiatives.",
  },
];

const GENERAL_ANSWER =
  "Polluted air and water harm human health and damage ecosystems, so tracking and reducing pollution matters for everyone. Ask me about air pollution, health effects, climate change, waste, water, or how to reduce pollution, or ask how CleanTrace works.";

const DEFAULT_ANSWER =
  "I don't have an answer for that yet. I can help with how CleanTrace works, which cities are covered, how often data updates, what the colors mean, submitting a reading, whether the data can be trusted, and general questions about pollution, climate and the environment. Try rephrasing, or tap a suggestion.";

const GENERAL_WORDS = [
  'pollut*', 'polution*', 'environment*', 'enveroment*', 'envirnment*', 'climate', 'nature',
  'planet', 'earth', 'eco*', 'green*', 'air', 'water', 'health*',
];

function normalizeWords(s: string): string {
  return s
    .toLowerCase()
    .replace(/pm\s*2\.5/g, 'pm25')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compileKeyword(k: string): CompiledKeyword {
  const prefix = k.endsWith('*');
  return { base: normalizeWords(prefix ? k.slice(0, -1) : k), prefix };
}

function keywordMatches(padded: string, k: CompiledKeyword): boolean {
  return k.prefix ? padded.includes(' ' + k.base) : padded.includes(' ' + k.base + ' ');
}

const COMPILED: CompiledTopic[] = TOPICS.map((t) => ({
  answer: t.answer,
  keys: t.keywords.map(compileKeyword),
}));

const GENERAL_KEYS: CompiledKeyword[] = GENERAL_WORDS.map(compileKeyword);

function getAnswer(question: string): string {
  const padded = ' ' + normalizeWords(question) + ' ';
  let bestAnswer = '';
  let bestScore = 0;
  for (const topic of COMPILED) {
    let score = 0;
    for (const k of topic.keys) {
      if (keywordMatches(padded, k)) score += k.base.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = topic.answer;
    }
  }
  if (bestScore > 0) return bestAnswer;
  if (GENERAL_KEYS.some((k) => keywordMatches(padded, k))) return GENERAL_ANSWER;
  return DEFAULT_ANSWER;
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable, ignore
  }
}

function formatSessionTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function sessionPreview(session: ChatSession): string {
  const firstUser = session.messages.find((m) => m.role === 'user');
  return firstUser ? firstUser.text : 'New conversation';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'bot', text: WELCOME }]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMessages = loadJSON<Message[]>(STORAGE_CURRENT, []);
    if (savedMessages.length > 0) setMessages(savedMessages);
    setSessions(loadJSON<ChatSession[]>(STORAGE_SESSIONS, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && viewingId === null) saveJSON(STORAGE_CURRENT, messages);
  }, [messages, hydrated, viewingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, viewingId]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || viewingId !== null) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
      { role: 'bot', text: getAnswer(q) },
    ]);
    setInput('');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const startNewChat = () => {
    const hasRealMessage = messages.some((m) => m.role === 'user');
    let nextSessions = sessions;
    if (hasRealMessage) {
      const finished: ChatSession = { id: String(Date.now()), startedAt: Date.now(), messages };
      nextSessions = [finished, ...sessions].slice(0, MAX_SESSIONS);
      setSessions(nextSessions);
      saveJSON(STORAGE_SESSIONS, nextSessions);
    }
    const fresh = [{ role: 'bot' as const, text: WELCOME }];
    setMessages(fresh);
    saveJSON(STORAGE_CURRENT, fresh);
    setViewingId(null);
    setShowHistory(false);
  };

  const openSession = (id: string) => {
    setViewingId(id);
    setShowHistory(false);
  };

  const backToLiveChat = () => {
    setViewingId(null);
  };

  const clearHistory = () => {
    setSessions([]);
    saveJSON(STORAGE_SESSIONS, []);
    setViewingId(null);
  };

  const deleteSession = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    saveJSON(STORAGE_SESSIONS, next);
    if (viewingId === id) setViewingId(null);
  };

  const viewingSession = viewingId ? sessions.find((s) => s.id === viewingId) ?? null : null;
  const shownMessages = viewingSession ? viewingSession.messages : messages;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[32rem] max-h-[70vh] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2 bg-green-700 px-3 py-2 text-white">
            <span className="text-sm font-semibold">CleanTrace Assistant</span>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="rounded px-2 py-1 text-xs font-medium hover:bg-green-800"
                title="Start a new chat"
              >
                New chat
              </button>
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="rounded px-2 py-1 text-xs font-medium hover:bg-green-800"
                title="View past chats"
              >
                History{sessions.length > 0 ? ` (${sessions.length})` : ''}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none hover:opacity-75"
                aria-label="Close assistant"
              >
                &times;
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="max-h-40 overflow-y-auto border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-800/60">
              {sessions.length === 0 ? (
                <p className="p-2 text-xs text-gray-500 dark:text-gray-400">
                  No past chats saved yet on this device.
                </p>
              ) : (
                <>
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <button
                        onClick={() => openSession(s.id)}
                        className="block min-w-0 flex-1 px-2 py-1.5 text-left text-xs"
                      >
                        <span className="block font-medium text-gray-700 dark:text-gray-200">
                          {formatSessionTime(s.startedAt)}
                        </span>
                        <span className="block truncate text-gray-500 dark:text-gray-400">
                          {sessionPreview(s)}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="shrink-0 px-2 py-1.5 text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete this chat"
                        aria-label="Delete this chat"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={clearHistory}
                    className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700"
                  >
                    Clear all history
                  </button>
                </>
              )}
            </div>
          )}

          {viewingSession && (
            <div className="flex items-center justify-between border-b border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
              <span>Viewing chat from {formatSessionTime(viewingSession.startedAt)}</span>
              <button onClick={backToLiveChat} className="font-medium underline">
                Back to live chat
              </button>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {shownMessages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] whitespace-pre-line break-words rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'ml-auto bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {m.text}
              </div>
            ))}
            {!viewingSession && shownMessages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-full border border-green-600 px-3 py-1 text-xs text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-gray-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex gap-2 border-t border-gray-200 p-2 dark:border-gray-800"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={viewingSession ? 'Return to live chat to send a message' : 'Ask a question...'}
              disabled={!!viewingSession}
              className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={!!viewingSession}
              className="rounded bg-green-700 px-3 py-1 text-sm text-white hover:bg-green-800 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-2xl text-white shadow-lg hover:bg-green-800"
        aria-label="Open assistant"
      >
        {open ? '\u00d7' : '\ud83d\udcac'}
      </button>
    </div>
  );
}

