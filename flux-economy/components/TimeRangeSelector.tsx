'use client';

import { TimeRange } from '@/types';
import { motion } from 'framer-motion';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All Time' },
];

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-full">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            value === range.value
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {value === range.value && (
            <motion.div
              layoutId="activeRange"
              className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{range.label}</span>
        </button>
      ))}
    </div>
  );
}
