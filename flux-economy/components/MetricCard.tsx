'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface MetricCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  iconBg: string;
  trend?: 'up' | 'down';
  isCurrency?: boolean;
  delay?: number;
}

export default function MetricCard({
  icon: Icon,
  value,
  label,
  iconBg,
  trend,
  isCurrency = false,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${iconBg}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend === 'up' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {isCurrency ? formatCurrency(value) : formatNumber(value)}
          </div>
          <div className="text-sm text-gray-400">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}
