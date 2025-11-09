'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Agent, Transaction, EconomyStats, TimeRange } from '@/types';
import {
  fetchEconomyStats,
  fetchTopSpenders,
  fetchTopEarners,
  fetchRecentTransactions,
  fetchAgent,
  fetchAgentTransactions,
  fetchAgents,
} from '@/lib/api';
import MetricCard from '@/components/MetricCard';
import AgentCard from '@/components/AgentCard';
import TransactionRow from '@/components/TransactionRow';
import AgentDetailModal from '@/components/AgentDetailModal';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'spenders' | 'earners'>('overview');
  const [stats, setStats] = useState<EconomyStats | null>(null);
  const [topSpenders, setTopSpenders] = useState<Agent[]>([]);
  const [topEarners, setTopEarners] = useState<Agent[]>([]);
  const [allSpenders, setAllSpenders] = useState<Agent[]>([]);
  const [allEarners, setAllEarners] = useState<Agent[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentTransactions, setAgentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spenderStats, setSpenderStats] = useState<{
    totalAgents: number;
    avgSpend: number;
    highestTransaction: number;
  } | null>(null);
  const [earnerStats, setEarnerStats] = useState<{
    totalAgents: number;
    avgRevenue: number;
    highestPayment: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        const [statsData, spendersData, earnersData, transactionsData] = await Promise.all([
          fetchEconomyStats('all'),
          fetchTopSpenders(5, 'all'),
          fetchTopEarners(5, 'all'),
          fetchRecentTransactions(10),
        ]);

        setStats(statsData);
        setTopSpenders(spendersData);
        setTopEarners(earnersData);
        setRecentTransactions(transactionsData);
      } else if (activeTab === 'spenders') {
        const [allAgentsData, topSpendersData] = await Promise.all([
          fetchAgents(),
          fetchTopSpenders(100, 'all'),
        ]);

        const spenders = allAgentsData.filter(a => a.type === 'spender' || a.type === 'both');
        const sortedSpenders = topSpendersData.length > 0 
          ? topSpendersData 
          : spenders.sort((a, b) => b.totalSpent - a.totalSpent);

        setAllSpenders(sortedSpenders);
        
        if (sortedSpenders.length > 0) {
          const totalSpent = sortedSpenders.reduce((sum, a) => sum + (a.totalSpent || 0), 0);
          const avgSpend = totalSpent / sortedSpenders.length;
          const allTransactions = sortedSpenders.reduce((sum, a) => sum + (a.transactionCount || 0), 0);
          const highestTx = Math.max(...sortedSpenders.map(a => ((a.avgTransactionSize || 0) * (a.transactionCount || 0)) || 0));
          
          setSpenderStats({
            totalAgents: sortedSpenders.length,
            avgSpend,
            highestTransaction: highestTx,
          });
        }
      } else if (activeTab === 'earners') {
        const [allAgentsData, topEarnersData] = await Promise.all([
          fetchAgents(),
          fetchTopEarners(100, 'all'),
        ]);

        const earners = allAgentsData.filter(a => a.type === 'earner' || a.type === 'both');
        const sortedEarners = topEarnersData.length > 0 
          ? topEarnersData 
          : earners.sort((a, b) => b.totalEarned - a.totalEarned);

        setAllEarners(sortedEarners);
        
        if (sortedEarners.length > 0) {
          const totalEarned = sortedEarners.reduce((sum, a) => sum + (a.totalEarned || 0), 0);
          const avgRevenue = totalEarned / sortedEarners.length;
          const highestPayment = Math.max(...sortedEarners.map(a => ((a.avgTransactionSize || 0) * (a.transactionCount || 0)) || 0));
          
          setEarnerStats({
            totalAgents: sortedEarners.length,
            avgRevenue,
            highestPayment,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAgentClick(agentId: string) {
    try {
      const [agent, transactions] = await Promise.all([
        fetchAgent(agentId),
        fetchAgentTransactions(agentId),
      ]);
      setSelectedAgent(agent);
      setAgentTransactions(transactions);
    } catch (error) {
      console.error('Failed to load agent details:', error);
    }
  }

  if (loading && !stats && activeTab === 'overview') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">Real-time agent spending & revenue tracking</p>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-red-400 font-medium">Error loading data</div>
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          {(['overview', 'spenders', 'earners'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {stats ? (
              <>
                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    icon={DollarSign}
                    value={stats.totalVolume || 0}
                    label="Total Volume"
                    iconBg="bg-gradient-to-br from-purple-500 to-pink-500"
                    trend="up"
                    isCurrency
                    delay={0}
                  />
                  <MetricCard
                    icon={ArrowUpRight}
                    value={stats.totalSpending || 0}
                    label="Total Spending"
                    iconBg="bg-gradient-to-br from-red-500 to-pink-500"
                    isCurrency
                    delay={0.1}
                  />
                  <MetricCard
                    icon={ArrowDownLeft}
                    value={stats.totalRevenue || 0}
                    label="Total Revenue"
                    iconBg="bg-gradient-to-br from-emerald-500 to-teal-500"
                    isCurrency
                    delay={0.2}
                  />
                  <MetricCard
                    icon={Users}
                    value={stats.activeAgents || 0}
                    label="Active Agents"
                    iconBg="bg-gradient-to-br from-blue-500 to-cyan-500"
                    delay={0.3}
                  />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Spenders */}
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <ArrowUpRight className="w-5 h-5 text-red-400" />
                      <h2 className="text-xl font-semibold text-white">Top Spenders</h2>
                    </div>
                    {topSpenders.length > 0 ? (
                      <div className="space-y-4">
                        {topSpenders.map((agent, idx) => (
                          <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => handleAgentClick(agent.id)}
                            className="flex items-center gap-4 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer transition-all"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{agent.displayName}</div>
                              <div className="text-xs text-gray-400">{agent.transactionCount} transactions</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-400">
                                ${((agent.totalSpent || 0) / 100).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Avg: ${((agent.avgTransactionSize || 0) / 100).toFixed(2)}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No spenders found</p>
                      </div>
                    )}
                  </div>

                  {/* Top Earners */}
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-xl font-semibold text-white">Top Earners</h2>
                    </div>
                    {topEarners.length > 0 ? (
                      <div className="space-y-4">
                        {topEarners.map((agent, idx) => (
                          <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => handleAgentClick(agent.id)}
                            className="flex items-center gap-4 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer transition-all"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{agent.displayName}</div>
                              <div className="text-xs text-gray-400">{agent.transactionCount} transactions</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-400">
                                ${((agent.totalEarned || 0) / 100).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Avg: ${((agent.avgTransactionSize || 0) / 100).toFixed(2)}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No earners found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.map((tx, idx) => (
                        <TransactionRow key={tx.id} transaction={tx} delay={idx * 0.05} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data available for this time range</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Spenders Tab */}
        {activeTab === 'spenders' && (
          <motion.div
            key="spenders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading spenders...</p>
              </div>
            ) : (
              <>
                {/* Spender Stats */}
                {spenderStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="text-sm text-gray-400 mb-2">Total Agents Spending</div>
                      <div className="text-3xl font-bold text-white">{spenderStats.totalAgents}</div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="text-sm text-gray-400 mb-2">Average Spend per Agent</div>
                      <div className="text-3xl font-bold text-red-400">
                        ${(spenderStats.avgSpend / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="text-sm text-gray-400 mb-2">Highest Single Transaction</div>
                      <div className="text-3xl font-bold text-red-400">
                        ${(spenderStats.highestTransaction / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Agent Cards Grid */}
                {allSpenders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allSpenders.map((agent, idx) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        type="spender"
                        onClick={() => handleAgentClick(agent.id)}
                        delay={idx * 0.05}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-400 text-lg mb-2">No agents yet</p>
                    <p className="text-gray-500 text-sm">Create your first agent to get started</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Earners Tab */}
        {activeTab === 'earners' && (
          <motion.div
            key="earners"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading earners...</p>
              </div>
            ) : (
              <>
                {/* Earner Stats */}
                {earnerStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="text-sm text-gray-400 mb-2">Total Agents Earning</div>
                      <div className="text-3xl font-bold text-white">{earnerStats.totalAgents}</div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="text-sm text-gray-400 mb-2">Average Revenue per Agent</div>
                      <div className="text-3xl font-bold text-emerald-400">
                        ${(earnerStats.avgRevenue / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="text-sm text-gray-400 mb-2">Highest Single Payment Received</div>
                      <div className="text-3xl font-bold text-emerald-400">
                        ${(earnerStats.highestPayment / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Agent Cards Grid */}
                {allEarners.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allEarners.map((agent, idx) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        type="earner"
                        onClick={() => handleAgentClick(agent.id)}
                        delay={idx * 0.05}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-400 text-lg mb-2">No agents yet</p>
                    <p className="text-gray-500 text-sm">Create your first agent to get started</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

      {/* Agent Detail Modal */}
      <AgentDetailModal
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        transactions={agentTransactions}
      />
    </div>
  );
}
