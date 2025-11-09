'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Power, TrendingUp, TrendingDown } from 'lucide-react';
import { Agent, Transaction } from '@/types';
import { formatCurrency, formatNumber, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { useState, useEffect } from 'react';
import SpendingChart from './SpendingChart';
import CategoryPieChart from './CategoryPieChart';
import ConsensusChart from './ConsensusChart';
import TransactionRow from './TransactionRow';

interface AgentDetailModalProps {
  agent: Agent | null;
  onClose: () => void;
  transactions: Transaction[];
}

export default function AgentDetailModal({ agent, onClose, transactions }: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics' | 'consensus'>('overview');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'payment' | 'escrow' | 'stream'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  if (!agent) return null;

  const filteredTransactions = transactions.filter(tx => {
    const typeMatch = transactionFilter === 'all' || tx.type === transactionFilter;
    const statusMatch = statusFilter === 'all' || tx.status === statusFilter;
    return typeMatch && statusMatch;
  });

  // Prepare analytics data
  const spendingOverTime = transactions
    .filter(tx => tx.fromAgentId === agent.id)
    .reduce((acc, tx) => {
      const date = new Date(tx.timestamp).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date] += tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const earningOverTime = transactions
    .filter(tx => tx.toAgentId === agent.id)
    .reduce((acc, tx) => {
      const date = new Date(tx.timestamp).toLocaleDateString();
      if (!acc[date]) acc[date] = 0;
      acc[date] += tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const spendingData = Object.entries(spendingOverTime).map(([date, amount]) => ({ date, amount }));
  const earningData = Object.entries(earningOverTime).map(([date, amount]) => ({ date, amount }));

  // Category breakdown
  const categoryBreakdown = transactions.reduce((acc, tx) => {
    const category = tx.purpose.split(' ')[0] || 'Other';
    if (!acc[category]) acc[category] = 0;
    acc[category] += tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value }));

  // Consensus data - handle both snake_case and camelCase
  const consensusVotes = transactions
    .filter(tx => tx.consensusResult && (tx.consensusResult.agentVotes || (tx.consensusResult as any).agent_votes))
    .flatMap(tx => {
      // Handle both agentVotes and agent_votes
      const votes = tx.consensusResult!.agentVotes || (tx.consensusResult as any).agent_votes || [];
      return votes;
    })
    .reduce((acc, vote: any) => {
      // Handle both agentName and agent_name
      const agentName = vote.agentName || vote.agent_name || 'Unknown';
      if (!acc[agentName]) {
        acc[agentName] = { approvals: 0, rejections: 0 };
      }
      if (vote.vote === 'YES') acc[agentName].approvals++;
      else if (vote.vote === 'NO') acc[agentName].rejections++;
      return acc;
    }, {} as Record<string, { approvals: number; rejections: number }>);

  const consensusData = Object.entries(consensusVotes).map(([agentName, counts]) => {
    const total = counts.approvals + counts.rejections;
    return {
      agentName,
      approvalRate: total > 0 ? (counts.approvals / total) * 100 : 0,
      rejectionRate: total > 0 ? (counts.rejections / total) * 100 : 0,
    };
  });

  const netPosition = agent.totalEarned - agent.totalSpent;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/95 backdrop-blur-xl">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{agent.displayName}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-400 capitalize">{agent.type}</span>
                <span className="text-gray-600">•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
                {agent.rating && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-yellow-400">⭐ {agent.rating.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Power className="w-4 h-4" />
                {agent.status === 'active' ? 'Pause' : 'Activate'}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Balance Section */}
            <div className="mb-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Current Balance</div>
              <div className="text-4xl font-bold text-white mb-4">
                {formatCurrency(agent.balance)}
              </div>
              {agent.hold > 0 && (
                <div className="text-sm text-gray-400">
                  On Hold: {formatCurrency(agent.hold)}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
              {(['overview', 'transactions', 'analytics', 'consensus'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Spent</div>
                    <div className="text-2xl font-bold text-red-400 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {formatCurrency(agent.totalSpent)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Total Earned</div>
                    <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5" />
                      {formatCurrency(agent.totalEarned)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Net Position</div>
                    <div className={`text-2xl font-bold flex items-center gap-2 ${
                      netPosition >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {netPosition >= 0 ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : (
                        <TrendingUp className="w-5 h-5" />
                      )}
                      {formatCurrency(netPosition)}
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Transactions</div>
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(agent.transactionCount)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Avg: {formatCurrency(agent.avgTransactionSize)}
                    </div>
                  </div>
                </div>

                {agent.approvalRate !== undefined && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Approval Rate</span>
                      <span className="text-lg font-bold text-emerald-400">{agent.approvalRate?.toFixed(1) ?? 'N/A'}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${agent.approvalRate ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {agent.completionRate !== undefined && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">Completion Rate</span>
                      <span className="text-lg font-bold text-emerald-400">{agent.completionRate?.toFixed(1) ?? 'N/A'}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${agent.completionRate ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex gap-4 mb-4">
                  <select
                    value={transactionFilter}
                    onChange={(e) => setTransactionFilter(e.target.value as any)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="payment">Payment</option>
                    <option value="escrow">Escrow</option>
                    <option value="stream">Stream</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="space-y-3">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx, idx) => (
                      <TransactionRow key={tx.id} transaction={tx} delay={idx * 0.05} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      No transactions found
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {spendingData.length > 0 && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Spending Over Time</h3>
                    <SpendingChart data={spendingData} color="#ef4444" />
                  </div>
                )}
                
                {earningData.length > 0 && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Earnings Over Time</h3>
                    <SpendingChart data={earningData} color="#10b981" />
                  </div>
                )}

                {categoryData.length > 0 && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
                    <CategoryPieChart data={categoryData} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Consensus Tab */}
            {activeTab === 'consensus' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {consensusData.length > 0 ? (
                  <>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Approval Rates by Agent</h3>
                      <ConsensusChart data={consensusData} />
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Voting Breakdown</h3>
                      <div className="space-y-3">
                        {consensusData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <span className="text-sm font-medium text-white">{item.agentName}</span>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-emerald-400">{item.approvalRate.toFixed(1)}% Approval</div>
                                <div className="text-xs text-gray-400">{item.rejectionRate.toFixed(1)}% Rejection</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    No consensus data available
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
