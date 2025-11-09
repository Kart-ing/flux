'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '@/types';
import { formatCurrency, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { ArrowRight, CreditCard, Lock, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface TransactionRowProps {
  transaction: Transaction;
  delay?: number;
}

const typeIcons: Record<string, any> = {
  payment: CreditCard,
  escrow: Lock,
  stream: Activity,
  top_up: CreditCard,
  card_request: CreditCard,
  card_charge: CreditCard,
};

export default function TransactionRow({ transaction, delay = 0 }: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = typeIcons[transaction.type] || CreditCard;
  const isOutgoing = transaction.fromAgentId !== transaction.toAgentId;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
    >
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="font-medium truncate">{transaction.fromAgentName}</span>
            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium truncate">{transaction.toAgentName}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{transaction.purpose}</div>
        </div>
        
        <div className={`text-lg font-semibold ${isOutgoing ? 'text-red-400' : 'text-emerald-400'}`}>
          {isOutgoing ? '-' : '+'}{formatCurrency(transaction.amount)}
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
          {transaction.status}
        </span>
        
        <div className="text-xs text-gray-400 whitespace-nowrap">
          {formatRelativeTime(transaction.timestamp)}
        </div>

        {transaction.consensusRequired && (
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {expanded && transaction.consensusResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-white">Consensus Votes</div>
              <span className={`px-2 py-1 rounded text-xs ${
                transaction.consensusResult.approved 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {transaction.consensusResult.approved ? 'APPROVED' : 'REJECTED'}
              </span>
            </div>
            <div className="space-y-2">
              {/* Handle both agentVotes and agent_votes */}
              {(transaction.consensusResult.agentVotes || (transaction.consensusResult as any).agent_votes || []).map((vote: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <span className="text-2xl">{vote.emoji || '🤖'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{vote.agentName || vote.agent_name || 'Unknown'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        vote.vote === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {vote.vote}
                      </span>
                      <span className="text-xs text-gray-400">Risk: {vote.riskScore || vote.risk_score || 0}</span>
                    </div>
                    <div className="text-xs text-gray-400">{vote.reasoning}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
