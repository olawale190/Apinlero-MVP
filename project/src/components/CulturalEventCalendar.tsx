import { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  Package,
  AlertCircle,
  ChevronRight,
  ShoppingCart,
  MessageCircle,
  Star
} from 'lucide-react';

interface CulturalEventCalendarProps {
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_quantity?: number;
}

interface CulturalEvent {
  id: string;
  name: string;
  date: Date;
  emoji: string;
  description: string;
  affectedProducts: string[];
  expectedIncrease: number; // percentage
  communities: string[];
  stockRecommendations: { product: string; extraUnits: number }[];
}

const culturalEvents: CulturalEvent[] = [
  // ===== 2025 EVENTS =====

  // JANUARY
  {
    id: 'new-year-2025',
    name: 'New Year\'s Day',
    date: new Date('2025-01-01'),
    emoji: '🎉',
    description: 'New Year celebrations. Party food and drinks demand.',
    affectedProducts: ['Drinks', 'Snacks', 'Rice', 'Meat', 'Soft Drinks'],
    expectedIncrease: 100,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Rice 5kg', extraUnits: 30 },
      { product: 'Drinks', extraUnits: 40 },
      { product: 'Snacks', extraUnits: 35 },
    ]
  },
  {
    id: 'chinese-new-year-2025',
    name: 'Chinese New Year',
    date: new Date('2025-01-29'),
    emoji: '🐍',
    description: 'Year of the Snake. High demand for Asian groceries and celebration foods.',
    affectedProducts: ['Rice', 'Noodles', 'Soy Sauce', 'Dumplings', 'Spring Rolls', 'Sesame Oil'],
    expectedIncrease: 160,
    communities: ['Chinese', 'East Asian', 'Vietnamese', 'Korean'],
    stockRecommendations: [
      { product: 'Jasmine Rice', extraUnits: 45 },
      { product: 'Noodles', extraUnits: 40 },
      { product: 'Soy Sauce', extraUnits: 30 },
    ]
  },

  // FEBRUARY
  {
    id: 'valentines-2025',
    name: 'Valentine\'s Day',
    date: new Date('2025-02-14'),
    emoji: '❤️',
    description: 'Romantic meals and chocolates in demand.',
    affectedProducts: ['Chocolates', 'Wine', 'Desserts', 'Special Ingredients'],
    expectedIncrease: 60,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Chocolates', extraUnits: 30 },
      { product: 'Wine', extraUnits: 20 },
    ]
  },

  // MARCH
  {
    id: 'holi-2025',
    name: 'Holi',
    date: new Date('2025-03-14'),
    emoji: '🎨',
    description: 'Hindu festival of colours. Sweets and festive foods.',
    affectedProducts: ['Ghee', 'Flour', 'Sugar', 'Milk', 'Sweets', 'Spices'],
    expectedIncrease: 120,
    communities: ['Indian', 'Hindu', 'Nepali', 'South Asian'],
    stockRecommendations: [
      { product: 'Ghee', extraUnits: 30 },
      { product: 'Flour', extraUnits: 25 },
      { product: 'Sugar', extraUnits: 20 },
    ]
  },
  {
    id: 'ramadan-start-2025',
    name: 'Ramadan Begins',
    date: new Date('2025-03-01'),
    emoji: '🌙',
    description: 'Holy month of fasting. High demand for Iftar foods throughout the month.',
    affectedProducts: ['Dates', 'Rice', 'Meat', 'Lentils', 'Flour', 'Milk'],
    expectedIncrease: 150,
    communities: ['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab', 'Nigerian'],
    stockRecommendations: [
      { product: 'Dates', extraUnits: 60 },
      { product: 'Rice 5kg', extraUnits: 50 },
      { product: 'Lentils', extraUnits: 40 },
    ]
  },
  {
    id: 'eid-al-fitr-2025',
    name: 'Eid al-Fitr',
    date: new Date('2025-03-30'),
    emoji: '🌙',
    description: 'End of Ramadan celebration. Major spike in food orders for feasts.',
    affectedProducts: ['Rice', 'Meat', 'Palm Oil', 'Spices', 'Flour', 'Sweets'],
    expectedIncrease: 200,
    communities: ['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab', 'Nigerian'],
    stockRecommendations: [
      { product: 'Rice 5kg', extraUnits: 60 },
      { product: 'Palm Oil 5L', extraUnits: 40 },
      { product: 'Goat Meat', extraUnits: 50 },
    ]
  },
  {
    id: 'mothers-day-uk-2025',
    name: 'Mother\'s Day (UK)',
    date: new Date('2025-03-30'),
    emoji: '💐',
    description: 'Special meals for mothers. Family gatherings.',
    affectedProducts: ['Chicken', 'Rice', 'Cakes', 'Drinks', 'Vegetables'],
    expectedIncrease: 80,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Chicken', extraUnits: 25 },
      { product: 'Rice', extraUnits: 20 },
    ]
  },

  // APRIL
  {
    id: 'easter-2025',
    name: 'Easter Sunday',
    date: new Date('2025-04-20'),
    emoji: '🐣',
    description: 'Christian celebration. Large family meals and gatherings.',
    affectedProducts: ['Rice', 'Chicken', 'Lamb', 'Vegetables', 'Fish', 'Drinks'],
    expectedIncrease: 130,
    communities: ['Nigerian', 'Ghanaian', 'Caribbean', 'Polish', 'Christian'],
    stockRecommendations: [
      { product: 'Rice 5kg', extraUnits: 35 },
      { product: 'Chicken', extraUnits: 30 },
      { product: 'Stockfish', extraUnits: 25 },
    ]
  },
  {
    id: 'vaisakhi-2025',
    name: 'Vaisakhi',
    date: new Date('2025-04-14'),
    emoji: '🎊',
    description: 'Sikh New Year and harvest festival. Community meals and celebrations.',
    affectedProducts: ['Rice', 'Flour', 'Lentils', 'Ghee', 'Vegetables', 'Paneer'],
    expectedIncrease: 100,
    communities: ['Sikh', 'Punjabi', 'Indian'],
    stockRecommendations: [
      { product: 'Basmati Rice', extraUnits: 30 },
      { product: 'Flour', extraUnits: 25 },
      { product: 'Ghee', extraUnits: 20 },
    ]
  },

  // MAY
  {
    id: 'eid-al-adha-2025',
    name: 'Eid al-Adha',
    date: new Date('2025-06-07'),
    emoji: '🐑',
    description: 'Festival of Sacrifice. Highest meat demand of the year.',
    affectedProducts: ['Lamb', 'Goat', 'Rice', 'Spices', 'Vegetables'],
    expectedIncrease: 220,
    communities: ['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab', 'Nigerian'],
    stockRecommendations: [
      { product: 'Goat Meat', extraUnits: 70 },
      { product: 'Lamb', extraUnits: 60 },
      { product: 'Rice 5kg', extraUnits: 50 },
    ]
  },
  {
    id: 'vesak-2025',
    name: 'Vesak (Buddha Day)',
    date: new Date('2025-05-12'),
    emoji: '🪷',
    description: 'Buddhist celebration of Buddha\'s birth, enlightenment, and death.',
    affectedProducts: ['Rice', 'Vegetables', 'Tofu', 'Noodles', 'Tea'],
    expectedIncrease: 70,
    communities: ['Buddhist', 'Sri Lankan', 'Thai', 'Vietnamese'],
    stockRecommendations: [
      { product: 'Jasmine Rice', extraUnits: 20 },
      { product: 'Vegetables', extraUnits: 25 },
      { product: 'Tofu', extraUnits: 15 },
    ]
  },

  // JUNE
  {
    id: 'fathers-day-2025',
    name: 'Father\'s Day',
    date: new Date('2025-06-15'),
    emoji: '👔',
    description: 'Family gatherings and BBQ season.',
    affectedProducts: ['Meat', 'Drinks', 'BBQ Items', 'Snacks'],
    expectedIncrease: 70,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Meat', extraUnits: 30 },
      { product: 'Drinks', extraUnits: 25 },
    ]
  },
  {
    id: 'windrush-day-2025',
    name: 'Windrush Day',
    date: new Date('2025-06-22'),
    emoji: '🇯🇲',
    description: 'Celebrating Caribbean heritage in the UK.',
    affectedProducts: ['Rice', 'Jerk Seasoning', 'Plantain', 'Ackee', 'Saltfish', 'Rum'],
    expectedIncrease: 90,
    communities: ['Caribbean', 'Jamaican', 'Trinidadian', 'Barbadian'],
    stockRecommendations: [
      { product: 'Plantain', extraUnits: 35 },
      { product: 'Ackee', extraUnits: 25 },
      { product: 'Jerk Seasoning', extraUnits: 30 },
    ]
  },

  // JULY
  {
    id: 'muharram-2025',
    name: 'Islamic New Year',
    date: new Date('2025-06-27'),
    emoji: '🕌',
    description: 'Islamic New Year. Reflective gatherings and special meals.',
    affectedProducts: ['Dates', 'Rice', 'Meat', 'Milk'],
    expectedIncrease: 60,
    communities: ['Muslim', 'Shia', 'Sunni'],
    stockRecommendations: [
      { product: 'Dates', extraUnits: 25 },
      { product: 'Rice', extraUnits: 20 },
    ]
  },

  // AUGUST
  {
    id: 'jamaica-independence-2025',
    name: 'Jamaica Independence Day',
    date: new Date('2025-08-06'),
    emoji: '🇯🇲',
    description: 'Jamaican national day celebrations.',
    affectedProducts: ['Rice', 'Jerk Seasoning', 'Plantain', 'Ackee', 'Rum', 'Red Stripe'],
    expectedIncrease: 100,
    communities: ['Jamaican', 'Caribbean'],
    stockRecommendations: [
      { product: 'Plantain', extraUnits: 30 },
      { product: 'Jerk Seasoning', extraUnits: 25 },
      { product: 'Ackee', extraUnits: 20 },
    ]
  },
  {
    id: 'notting-hill-carnival-2025',
    name: 'Notting Hill Carnival',
    date: new Date('2025-08-24'),
    emoji: '🎭',
    description: 'Europe\'s biggest street festival. Massive Caribbean food demand.',
    affectedProducts: ['Jerk Chicken ingredients', 'Rice', 'Plantain', 'Rum', 'Drinks'],
    expectedIncrease: 180,
    communities: ['Caribbean', 'Jamaican', 'Trinidadian', 'All'],
    stockRecommendations: [
      { product: 'Rice', extraUnits: 50 },
      { product: 'Plantain', extraUnits: 45 },
      { product: 'Jerk Seasoning', extraUnits: 40 },
    ]
  },
  {
    id: 'janmashtami-2025',
    name: 'Janmashtami',
    date: new Date('2025-08-16'),
    emoji: '🙏',
    description: 'Hindu celebration of Lord Krishna\'s birth.',
    affectedProducts: ['Milk', 'Ghee', 'Butter', 'Sweets', 'Fruits'],
    expectedIncrease: 90,
    communities: ['Hindu', 'Indian', 'ISKCON'],
    stockRecommendations: [
      { product: 'Milk', extraUnits: 30 },
      { product: 'Ghee', extraUnits: 25 },
      { product: 'Butter', extraUnits: 20 },
    ]
  },
  {
    id: 'raksha-bandhan-2025',
    name: 'Raksha Bandhan',
    date: new Date('2025-08-09'),
    emoji: '🧵',
    description: 'Hindu festival celebrating brother-sister bond. Sweets exchanged.',
    affectedProducts: ['Sweets', 'Dry Fruits', 'Mithai', 'Gift Boxes'],
    expectedIncrease: 80,
    communities: ['Hindu', 'Indian', 'Nepali'],
    stockRecommendations: [
      { product: 'Sweets', extraUnits: 30 },
      { product: 'Dry Fruits', extraUnits: 25 },
    ]
  },

  // SEPTEMBER
  {
    id: 'ganesh-chaturthi-2025',
    name: 'Ganesh Chaturthi',
    date: new Date('2025-08-27'),
    emoji: '🐘',
    description: 'Hindu festival honoring Lord Ganesha. Modak sweets in demand.',
    affectedProducts: ['Modak', 'Coconut', 'Jaggery', 'Flour', 'Ghee'],
    expectedIncrease: 100,
    communities: ['Hindu', 'Marathi', 'Indian'],
    stockRecommendations: [
      { product: 'Coconut', extraUnits: 30 },
      { product: 'Jaggery', extraUnits: 25 },
      { product: 'Ghee', extraUnits: 20 },
    ]
  },
  {
    id: 'milad-un-nabi-2025',
    name: 'Mawlid (Prophet\'s Birthday)',
    date: new Date('2025-09-05'),
    emoji: '☪️',
    description: 'Celebration of Prophet Muhammad\'s birthday.',
    affectedProducts: ['Dates', 'Rice', 'Meat', 'Sweets', 'Milk'],
    expectedIncrease: 80,
    communities: ['Muslim', 'Sunni'],
    stockRecommendations: [
      { product: 'Dates', extraUnits: 30 },
      { product: 'Sweets', extraUnits: 25 },
    ]
  },

  // OCTOBER
  {
    id: 'nigeria-independence-2025',
    name: 'Nigerian Independence Day',
    date: new Date('2025-10-01'),
    emoji: '🇳🇬',
    description: 'Nigeria\'s national day. Major celebration with traditional foods.',
    affectedProducts: ['Jollof Rice ingredients', 'Palm Oil', 'Meat', 'Egusi', 'Stockfish'],
    expectedIncrease: 120,
    communities: ['Nigerian', 'West African'],
    stockRecommendations: [
      { product: 'Rice 5kg', extraUnits: 40 },
      { product: 'Tomato Paste', extraUnits: 35 },
      { product: 'Palm Oil', extraUnits: 30 },
      { product: 'Egusi', extraUnits: 25 },
    ]
  },
  {
    id: 'navratri-2025',
    name: 'Navratri',
    date: new Date('2025-09-22'),
    emoji: '💃',
    description: 'Nine nights of Hindu worship and Garba dancing. Fasting foods in demand.',
    affectedProducts: ['Sabudana', 'Potatoes', 'Kuttu Flour', 'Fruits', 'Milk'],
    expectedIncrease: 110,
    communities: ['Hindu', 'Gujarati', 'Indian'],
    stockRecommendations: [
      { product: 'Sabudana', extraUnits: 30 },
      { product: 'Kuttu Flour', extraUnits: 25 },
      { product: 'Potatoes', extraUnits: 35 },
    ]
  },
  {
    id: 'durga-puja-2025',
    name: 'Durga Puja',
    date: new Date('2025-10-01'),
    emoji: '🙏',
    description: 'Bengali Hindu festival. Major celebrations with special foods.',
    affectedProducts: ['Rice', 'Fish', 'Sweets', 'Vegetables', 'Paneer'],
    expectedIncrease: 100,
    communities: ['Bengali', 'Hindu', 'Indian'],
    stockRecommendations: [
      { product: 'Rice', extraUnits: 30 },
      { product: 'Fish', extraUnits: 35 },
      { product: 'Sweets', extraUnits: 30 },
    ]
  },
  {
    id: 'dussehra-2025',
    name: 'Dussehra (Vijayadashami)',
    date: new Date('2025-10-02'),
    emoji: '🏹',
    description: 'Victory of good over evil. End of Navratri celebrations.',
    affectedProducts: ['Sweets', 'Fruits', 'Rice', 'Vegetables'],
    expectedIncrease: 90,
    communities: ['Hindu', 'Indian', 'Nepali'],
    stockRecommendations: [
      { product: 'Sweets', extraUnits: 30 },
      { product: 'Fruits', extraUnits: 25 },
    ]
  },
  {
    id: 'diwali-2025',
    name: 'Diwali',
    date: new Date('2025-10-20'),
    emoji: '🪔',
    description: 'Festival of Lights. Biggest Hindu celebration. Sweets and gifts exchanged.',
    affectedProducts: ['Rice', 'Spices', 'Ghee', 'Sweets', 'Dry Fruits', 'Flour'],
    expectedIncrease: 200,
    communities: ['Hindu', 'Sikh', 'Jain', 'Indian', 'Nepali', 'South Asian'],
    stockRecommendations: [
      { product: 'Basmati Rice', extraUnits: 50 },
      { product: 'Ghee', extraUnits: 40 },
      { product: 'Sweets', extraUnits: 60 },
      { product: 'Dry Fruits', extraUnits: 45 },
    ]
  },
  {
    id: 'black-history-month-2025',
    name: 'Black History Month (UK)',
    date: new Date('2025-10-01'),
    emoji: '✊🏿',
    description: 'Celebrating Black heritage and culture in the UK.',
    affectedProducts: ['African Foods', 'Caribbean Foods', 'Palm Oil', 'Plantain'],
    expectedIncrease: 70,
    communities: ['African', 'Caribbean', 'Black British'],
    stockRecommendations: [
      { product: 'Plantain', extraUnits: 25 },
      { product: 'Palm Oil', extraUnits: 20 },
    ]
  },

  // NOVEMBER
  {
    id: 'bonfire-night-2025',
    name: 'Bonfire Night',
    date: new Date('2025-11-05'),
    emoji: '🎆',
    description: 'Guy Fawkes Night. BBQ and outdoor food parties.',
    affectedProducts: ['Sausages', 'Burgers', 'Drinks', 'Snacks', 'Hot Chocolate'],
    expectedIncrease: 60,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Sausages', extraUnits: 25 },
      { product: 'Drinks', extraUnits: 30 },
    ]
  },
  {
    id: 'bandi-chhor-divas-2025',
    name: 'Bandi Chhor Divas',
    date: new Date('2025-10-20'),
    emoji: '🪔',
    description: 'Sikh festival coinciding with Diwali. Liberation celebration.',
    affectedProducts: ['Rice', 'Flour', 'Ghee', 'Lentils', 'Sweets'],
    expectedIncrease: 100,
    communities: ['Sikh', 'Punjabi'],
    stockRecommendations: [
      { product: 'Rice', extraUnits: 30 },
      { product: 'Flour', extraUnits: 25 },
    ]
  },
  {
    id: 'guru-nanak-jayanti-2025',
    name: 'Guru Nanak Jayanti',
    date: new Date('2025-11-05'),
    emoji: '🙏',
    description: 'Birth anniversary of Guru Nanak, founder of Sikhism. Langar meals.',
    affectedProducts: ['Rice', 'Flour', 'Lentils', 'Ghee', 'Vegetables', 'Milk'],
    expectedIncrease: 110,
    communities: ['Sikh', 'Punjabi', 'Indian'],
    stockRecommendations: [
      { product: 'Rice', extraUnits: 40 },
      { product: 'Flour', extraUnits: 35 },
      { product: 'Lentils', extraUnits: 30 },
    ]
  },

  // DECEMBER
  {
    id: 'hanukkah-2025',
    name: 'Hanukkah',
    date: new Date('2025-12-14'),
    emoji: '🕎',
    description: 'Jewish Festival of Lights. Fried foods and latkes.',
    affectedProducts: ['Potatoes', 'Oil', 'Flour', 'Eggs', 'Cheese'],
    expectedIncrease: 80,
    communities: ['Jewish'],
    stockRecommendations: [
      { product: 'Potatoes', extraUnits: 30 },
      { product: 'Oil', extraUnits: 25 },
    ]
  },
  {
    id: 'christmas-2025',
    name: 'Christmas',
    date: new Date('2025-12-25'),
    emoji: '🎄',
    description: 'Major UK holiday. Biggest sales period of the year.',
    affectedProducts: ['Rice', 'Chicken', 'Turkey', 'Drinks', 'Snacks', 'Vegetables'],
    expectedIncrease: 250,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Rice 5kg', extraUnits: 70 },
      { product: 'Chicken', extraUnits: 60 },
      { product: 'Turkey', extraUnits: 40 },
      { product: 'Palm Oil', extraUnits: 45 },
    ]
  },
  {
    id: 'boxing-day-2025',
    name: 'Boxing Day',
    date: new Date('2025-12-26'),
    emoji: '🎁',
    description: 'Day after Christmas. Leftovers and continued celebrations.',
    affectedProducts: ['Snacks', 'Drinks', 'Quick Meals'],
    expectedIncrease: 60,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Snacks', extraUnits: 25 },
      { product: 'Drinks', extraUnits: 30 },
    ]
  },
  {
    id: 'kwanzaa-2025',
    name: 'Kwanzaa',
    date: new Date('2025-12-26'),
    emoji: '🖤',
    description: 'Week-long celebration of African heritage (Dec 26 - Jan 1).',
    affectedProducts: ['African Foods', 'Vegetables', 'Fruits', 'Nuts'],
    expectedIncrease: 50,
    communities: ['African American', 'Black British', 'African'],
    stockRecommendations: [
      { product: 'Fruits', extraUnits: 20 },
      { product: 'Vegetables', extraUnits: 20 },
    ]
  },
  {
    id: 'new-years-eve-2025',
    name: 'New Year\'s Eve',
    date: new Date('2025-12-31'),
    emoji: '🥂',
    description: 'New Year\'s Eve celebrations. Party food and drinks.',
    affectedProducts: ['Drinks', 'Snacks', 'Party Food', 'Champagne'],
    expectedIncrease: 120,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Drinks', extraUnits: 50 },
      { product: 'Snacks', extraUnits: 40 },
    ]
  },

  // ===== 2026 EVENTS =====
  {
    id: 'new-year-2026',
    name: 'New Year\'s Day 2026',
    date: new Date('2026-01-01'),
    emoji: '🎉',
    description: 'New Year celebrations. Party food and drinks demand.',
    affectedProducts: ['Drinks', 'Snacks', 'Rice', 'Meat'],
    expectedIncrease: 100,
    communities: ['All'],
    stockRecommendations: [
      { product: 'Rice 5kg', extraUnits: 30 },
      { product: 'Drinks', extraUnits: 40 },
    ]
  },
  {
    id: 'chinese-new-year-2026',
    name: 'Chinese New Year 2026',
    date: new Date('2026-02-17'),
    emoji: '🐴',
    description: 'Year of the Horse. High demand for Asian groceries.',
    affectedProducts: ['Rice', 'Noodles', 'Soy Sauce', 'Dumplings', 'Spring Rolls'],
    expectedIncrease: 160,
    communities: ['Chinese', 'East Asian', 'Vietnamese'],
    stockRecommendations: [
      { product: 'Jasmine Rice', extraUnits: 45 },
      { product: 'Noodles', extraUnits: 40 },
    ]
  },
  {
    id: 'ramadan-2026',
    name: 'Ramadan 2026',
    date: new Date('2026-02-18'),
    emoji: '🌙',
    description: 'Holy month of fasting begins.',
    affectedProducts: ['Dates', 'Rice', 'Meat', 'Lentils', 'Flour', 'Milk'],
    expectedIncrease: 150,
    communities: ['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab'],
    stockRecommendations: [
      { product: 'Dates', extraUnits: 60 },
      { product: 'Rice 5kg', extraUnits: 50 },
    ]
  },
  {
    id: 'eid-al-fitr-2026',
    name: 'Eid al-Fitr 2026',
    date: new Date('2026-03-20'),
    emoji: '🌙',
    description: 'End of Ramadan celebration.',
    affectedProducts: ['Rice', 'Meat', 'Palm Oil', 'Spices', 'Flour', 'Sweets'],
    expectedIncrease: 200,
    communities: ['Muslim', 'Somali', 'Pakistani', 'Bangladeshi', 'Arab'],
    stockRecommendations: [
      { product: 'Rice 5kg', extraUnits: 60 },
      { product: 'Goat Meat', extraUnits: 50 },
    ]
  },
];

export default function CulturalEventCalendar({ products }: CulturalEventCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CulturalEvent | null>(null);

  const today = new Date();

  // Calculate days until each event
  const upcomingEvents = culturalEvents
    .map(event => ({
      ...event,
      daysUntil: Math.ceil((event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .filter(event => event.daysUntil > 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'border-red-500 bg-red-50';
    if (days <= 14) return 'border-orange-500 bg-orange-50';
    if (days <= 30) return 'border-yellow-500 bg-yellow-50';
    return 'border-gray-200 bg-white';
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Urgent</span>;
    if (days <= 14) return <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">Soon</span>;
    if (days <= 30) return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Prepare</span>;
    return <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Upcoming</span>;
  };

  // Check stock levels against recommendations
  const checkStockReadiness = (event: CulturalEvent) => {
    let ready = 0;
    let total = event.stockRecommendations.length;

    event.stockRecommendations.forEach(rec => {
      const product = products.find(p =>
        p.name.toLowerCase().includes(rec.product.toLowerCase())
      );
      if (product && (product.stock_quantity || 0) >= rec.extraUnits) {
        ready++;
      }
    });

    return { ready, total, percentage: Math.round((ready / total) * 100) };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <Calendar className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-lg">Cultural Event Calendar</h2>
            <p className="text-orange-100 text-xs sm:text-sm">AI-powered demand forecasting</p>
          </div>
        </div>
      </div>

      {/* Next Event Highlight */}
      {upcomingEvents.length > 0 && upcomingEvents[0].daysUntil <= 30 && (
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{upcomingEvents[0].emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">{upcomingEvents[0].name}</h3>
                {getUrgencyBadge(upcomingEvents[0].daysUntil)}
              </div>
              <p className="text-sm text-gray-600">
                {upcomingEvents[0].daysUntil} days away • {upcomingEvents[0].expectedIncrease}% expected increase
              </p>
            </div>
            <button
              onClick={() => setSelectedEvent(upcomingEvents[0])}
              className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-700 flex items-center gap-1"
            >
              Prepare
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="space-y-3">
          {upcomingEvents.slice(0, 5).map((event) => {
            const readiness = checkStockReadiness(event);
            return (
              <div
                key={event.id}
                className={`border-l-4 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${getUrgencyColor(event.daysUntil)}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{event.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{event.name}</h3>
                      <p className="text-xs text-gray-500">
                        {event.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' • '}{event.daysUntil} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <TrendingUp size={14} />
                      +{event.expectedIncrease}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Stock: {readiness.percentage}% ready
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {event.affectedProducts.slice(0, 4).map((product, idx) => (
                    <span key={idx} className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded border">
                      {product}
                    </span>
                  ))}
                  {event.affectedProducts.length > 4 && (
                    <span className="text-xs text-gray-400">+{event.affectedProducts.length - 4} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-pink-50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedEvent.emoji}</span>
                <div>
                  <h3 className="font-bold text-gray-800">{selectedEvent.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Description */}
              <p className="text-sm text-gray-600">{selectedEvent.description}</p>

              {/* Expected Impact */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-green-600" size={18} />
                  <span className="font-semibold text-green-700">Expected Impact</span>
                </div>
                <p className="text-2xl font-bold text-green-600">+{selectedEvent.expectedIncrease}%</p>
                <p className="text-xs text-green-600">increase in orders expected</p>
              </div>

              {/* Communities */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">🎯 Target Communities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.communities.map((community, idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                      {community}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stock Recommendations */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <Package size={16} />
                  Stock Recommendations
                </h4>
                <div className="space-y-2">
                  {selectedEvent.stockRecommendations.map((rec, idx) => {
                    const product = products.find(p =>
                      p.name.toLowerCase().includes(rec.product.toLowerCase())
                    );
                    const currentStock = product?.stock_quantity || 0;
                    const isReady = currentStock >= rec.extraUnits;

                    return (
                      <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${isReady ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center gap-2">
                          {isReady ? (
                            <Star className="text-green-600" size={16} />
                          ) : (
                            <AlertCircle className="text-red-600" size={16} />
                          )}
                          <span className="text-sm font-medium text-gray-700">{rec.product}</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isReady ? 'text-green-600' : 'text-red-600'}`}>
                            Need: +{rec.extraUnits}
                          </p>
                          <p className="text-xs text-gray-500">Current: {currentStock}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <ShoppingCart size={16} />
                  Order Stock
                </button>
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                  <MessageCircle size={16} />
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
