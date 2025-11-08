'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Clock, Rocket, Briefcase, DollarSign, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface SimulationAction {
  type: string;
  approved: boolean;
  amount: number;
  purpose?: string;
  agent_hired?: string;
  task?: string;
  votes?: any;
}

interface SimulationResult {
  agent: string;
  goal: string;
  reasoning: string;
  actions_taken: SimulationAction[];
  total_spent: number;
  budget_remaining: number;
}

export default function SimulationPage() {
  const [loading, setLoading] = useState(false);
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [formData, setFormData] = useState({
    agent_name: 'Marketing Agent Alpha',
    goal: 'Launch a new product landing page and ad campaign to acquire 1000 users',
    budget: '5000'
  });

  // Load existing simulations on mount
  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/simulations');
      const data = await response.json();
      if (data.success && data.simulations) {
        setSimulations(data.simulations);
      }
    } catch (error) {
      console.error('Error loading simulations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_name: formData.agent_name,
          goal: formData.goal,
          budget: parseInt(formData.budget)
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add the new simulation to the list
        setSimulations(prev => [data.result, ...prev]);
        // Reset form
        setFormData({
          agent_name: '',
          goal: '',
          budget: '5000'
        });
      } else {
        alert(`Error: ${data.error || 'Failed to run simulation'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error running simulation. Make sure the Flask backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (approved: boolean) => {
    return approved ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
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
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-4 mt-6">
            <Link 
              href="/"
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Single Request
            </Link>
            <Link 
              href="/simulation"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Agent Simulation
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Simulation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 sticky top-8">
              <h2 className="text-2xl font-bold text-white mb-6">Start Simulation</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={formData.agent_name}
                    onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Marketing Agent Alpha"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Goal
                  </label>
                  <textarea
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={4}
                    placeholder="Describe what the agent should accomplish..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Run Simulation
                    </>
                  )}
                </button>
              </form>

              {loading && (
                <div className="mt-6 p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <p className="text-sm text-purple-200">
                    The agent is autonomously planning and executing purchases...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Simulation Results */}
          <div className="lg:col-span-2 space-y-6">
            {simulations.length === 0 && !loading && (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                <Activity className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Simulations Yet</h3>
                <p className="text-purple-200">
                  Start a simulation to see autonomous agents make purchase decisions.
                </p>
              </div>
            )}

            <AnimatePresence>
              {simulations.map((sim, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
                >
                  {/* Simulation Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Rocket className="w-6 h-6 text-purple-400" />
                        <h3 className="text-2xl font-bold text-white">{sim.agent}</h3>
                      </div>
                      <p className="text-purple-200 mb-4">{sim.goal}</p>
                      {sim.reasoning && (
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <p className="text-sm text-white/80 italic">{sim.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-sm text-purple-200 mb-1">Total Spent</div>
                      <div className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        {sim.total_spent}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-sm text-purple-200 mb-1">Budget Left</div>
                      <div className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        {sim.budget_remaining}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-sm text-purple-200 mb-1">Actions</div>
                      <div className="text-2xl font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {sim.actions_taken.length}
                      </div>
                    </div>
                  </div>

                  {/* Actions Taken */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Actions Taken
                    </h4>
                    {sim.actions_taken.map((action, actionIndex) => (
                      <motion.div
                        key={actionIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: actionIndex * 0.1 }}
                        className={`p-4 rounded-lg border ${
                          action.approved
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(action.approved)}
                            <div>
                              <div className="font-semibold text-white">
                                {action.type === 'purchase' 
                                  ? action.purpose 
                                  : `Hire ${action.agent_hired}`}
                              </div>
                              {action.type === 'agent_hire' && (
                                <div className="text-sm text-purple-200">{action.task}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">${action.amount}</div>
                            <div className={`text-xs ${
                              action.approved ? 'text-emerald-300' : 'text-red-300'
                            }`}>
                              {action.approved ? 'APPROVED' : 'DENIED'}
                            </div>
                          </div>
                        </div>
                        {action.votes && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center gap-4 text-xs text-purple-200">
                              <span>
                                {action.votes.yes_votes || 0} YES · {action.votes.no_votes || 0} NO
                              </span>
                              <span>Risk: {action.votes.average_risk_score || 0}/10</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

