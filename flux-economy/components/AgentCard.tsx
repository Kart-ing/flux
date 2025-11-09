'use client';

import { motion } from 'framer-motion';
import { Agent } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Star } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  type: 'spender' | 'earner';
  onClick: () => void;
  delay?: number;
}

export default function AgentCard({ agent, type, onClick, delay = 0 }: AgentCardProps) {
  const isSpender = type === 'spender';
  const amount = isSpender ? agent.totalSpent : agent.totalEarned;
  const colorTheme = isSpender ? 'red' : 'emerald';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{agent.displayName}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              agent.status === 'active' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {agent.status}
            </span>
            {agent.type === 'earner' && agent.rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs">{agent.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        {isSpender ? (
          <ArrowUpRight className="w-5 h-5 text-red-400" />
        ) : (
          <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
        )}
      </div>
      
      <div className="mb-4">
        <div className={`text-3xl font-bold mb-2 ${isSpender ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatCurrency(amount)}
        </div>
        <div className="text-xs text-gray-400">Balance: {formatCurrency(agent.balance)}</div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span>{formatNumber(agent.transactionCount)} transactions</span>
        <span>Avg: {formatCurrency(agent.avgTransactionSize)}</span>
      </div>

      {isSpender && agent.approvalRate !== undefined && agent.approvalRate !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Approval Rate</span>
            <span className="text-white font-medium">{agent.approvalRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${agent.approvalRate}%` }}
            />
          </div>
        </div>
      )}

      {!isSpender && agent.completionRate !== undefined && agent.completionRate !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Completion Rate</span>
            <span className="text-white font-medium">{agent.completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${agent.completionRate}%` }}
            />
          </div>
        </div>
      )}
      
      {agent.categories && agent.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {agent.categories.slice(0, 3).map((category, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {!isSpender && (
        <button className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          Hire This Agent
        </button>
      )}
    </motion.div>
  );
}
