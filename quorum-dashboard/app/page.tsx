'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Shield, Briefcase, Rocket, Settings, BarChart3, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '500',
    purpose: 'OpenAI API credits for customer support chatbot',
    requesting_agent: 'Customer Service Agent',
    justification: 'Support tickets increased 300%. AI chatbot could handle 70% of common questions.',
    expected_roi: 'Save $3,000/month in support costs',
    urgency: 'High',
    budget_remaining: '10000'
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5001/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(formData.amount),
          purpose: formData.purpose,
          requesting_agent: formData.requesting_agent,
          justification: formData.justification,
          expected_roi: formData.expected_roi,
          urgency: formData.urgency,
          budget_remaining: parseInt(formData.budget_remaining)
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Simulate agent voting one by one for dramatic effect
        const votes = data.result.agent_votes;
        for (let i = 0; i < votes.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setResult((prev: any) => ({
            ...data.result,
            agent_votes: votes.slice(0, i + 1)
          }));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error evaluating purchase. Make sure the Flask backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (name: string) => {
    if (name.includes('CFO')) return <Briefcase className="w-6 h-6" />;
    if (name.includes('Growth')) return <Rocket className="w-6 h-6" />;
    if (name.includes('Risk')) return <Shield className="w-6 h-6" />;
    if (name.includes('Operations')) return <Settings className="w-6 h-6" />;
    if (name.includes('Data')) return <BarChart3 className="w-6 h-6" />;
    return <Clock className="w-6 h-6" />;
  };

  const getVoteColor = (vote: string) => {
    if (vote === 'YES') return 'bg-emerald-500';
    if (vote === 'NO') return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Quorum</h1>
              <p className="text-purple-200">AI-Native Financial Infrastructure</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-200">Budget Remaining</div>
              <div className="text-3xl font-bold text-white">${formData.budget_remaining}</div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-4 mt-6">
            <Link 
              href="/"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold"
            >
              Single Request
            </Link>
            <Link 
              href="/simulation"
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Agent Simulation
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Purchase Request Form */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Purchase Request</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Purpose
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Requesting Agent
                </label>
                <input
                  type="text"
                  value={formData.requesting_agent}
                  onChange={(e) => setFormData({ ...formData, requesting_agent: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Justification
                </label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Expected ROI
                </label>
                <input
                  type="text"
                  value={formData.expected_roi}
                  onChange={(e) => setFormData({ ...formData, expected_roi: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Urgency
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Evaluating...' : 'Submit for Consensus'}
              </button>
            </form>
          </div>

          {/* Consensus Visualization */}
          <div className="space-y-6">
            {loading && !result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-purple-400 animate-spin" />
                  <h3 className="text-xl font-bold text-white">Gathering Votes...</h3>
                </div>
                <p className="text-purple-200">5 agents are evaluating your request...</p>
              </motion.div>
            )}

            <AnimatePresence>
              {result && result.agent_votes && result.agent_votes.map((vote: any, index: number) => (
                <motion.div
                  key={vote.agent_name}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${getVoteColor(vote.vote)}`}>
                      {getAgentIcon(vote.agent_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-white">
                          {vote.emoji} {vote.agent_name}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          vote.vote === 'YES' ? 'bg-emerald-500/20 text-emerald-300' :
                          vote.vote === 'NO' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {vote.vote}
                        </span>
                      </div>
                      <p className="text-sm text-purple-200 mb-2">{vote.model}</p>
                      <p className="text-white/80 text-sm mb-2">{vote.reasoning}</p>
                      <div className="flex items-center gap-4 text-xs text-purple-200">
                        <span>Risk Score: {vote.risk_score}/10</span>
                        {vote.conditions && <span>Conditions: {vote.conditions}</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {result && result.agent_votes && result.agent_votes.length === 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-gradient-to-r ${
                  result.approved 
                    ? 'from-emerald-600 to-teal-600' 
                    : 'from-red-600 to-pink-600'
                } rounded-2xl p-8 border border-white/20`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {result.approved ? (
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  ) : (
                    <XCircle className="w-12 h-12 text-white" />
                  )}
                  <div>
                    <h3 className="text-3xl font-bold text-white">
                      {result.approved ? 'APPROVED' : 'DENIED'}
                    </h3>
                    <p className="text-white/80">
                      {result.yes_votes} YES · {result.no_votes} NO · {result.abstain_votes} ABSTAIN
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-white/70">Average Risk</div>
                    <div className="text-2xl font-bold text-white">{result.average_risk_score}/10</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-white/70">Amount</div>
                    <div className="text-2xl font-bold text-white">${result.purchase_request.amount}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}