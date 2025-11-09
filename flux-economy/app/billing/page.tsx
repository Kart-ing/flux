'use client';

import { useState, useEffect } from 'react';
import { Settings, DollarSign, CreditCard, Users, TrendingUp, Plus, Trash2, Check } from 'lucide-react';

interface UsageStats {
  apiCalls: number;
  virtualCards: number;
  consensusVotes: number;
  transactions: number;
  totalSpent: number;
}

interface BudgetSettings {
  monthlyBudget: number;
  alertThreshold: number;
  enabled: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export default function BillingPage() {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    apiCalls: 0,
    virtualCards: 0,
    consensusVotes: 0,
    transactions: 0,
    totalSpent: 0,
  });

  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>({
    monthlyBudget: 10000, // $100 in cents
    alertThreshold: 80,
    enabled: false,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load budget settings and payment methods from localStorage
  useEffect(() => {
    const savedBudget = localStorage.getItem('budgetSettings');
    if (savedBudget) {
      try {
        setBudgetSettings(JSON.parse(savedBudget));
      } catch (e) {
        console.error('Failed to load budget settings:', e);
      }
    }

    const savedPayments = localStorage.getItem('paymentMethods');
    if (savedPayments) {
      try {
        setPaymentMethods(JSON.parse(savedPayments));
      } catch (e) {
        console.error('Failed to load payment methods:', e);
      }
    }
  }, []);

  // Fetch usage stats
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        setLoading(true);
        
        // Get current month boundaries
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Fetch virtual cards for this month
        const cardsRes = await fetch('/api/virtual-cards');
        const cardsData = await cardsRes.json();
        
        const monthlyCards = cardsData.cards?.filter((card: any) => {
          const createdAt = new Date(card.created_at);
          return createdAt >= startOfMonth;
        }) || [];

        // Fetch recent transactions for this month
        const txRes = await fetch('/api/economy/recent?limit=1000');
        const txData = await txRes.json();
        
        const monthlyTx = txData.transactions?.filter((tx: any) => {
          const createdAt = new Date(tx.created_at);
          return createdAt >= startOfMonth;
        }) || [];

        // Calculate stats
        const apiCalls = monthlyTx.length;
        const virtualCards = monthlyCards.length;
        const consensusVotes = monthlyTx.reduce((sum: number, tx: any) => {
          const votes = tx.consensus_result?.agent_votes?.length || 0;
          return sum + votes;
        }, 0);
        
        const totalSpent = monthlyTx.reduce((sum: number, tx: any) => {
          return sum + (tx.amount || 0);
        }, 0);

        setUsageStats({
          apiCalls,
          virtualCards,
          consensusVotes,
          transactions: monthlyTx.length,
          totalSpent,
        });
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
    const interval = setInterval(fetchUsageStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const saveBudgetSettings = (settings: BudgetSettings) => {
    setBudgetSettings(settings);
    localStorage.setItem('budgetSettings', JSON.stringify(settings));
    setShowBudgetModal(false);
  };

  const addPaymentMethod = (method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: Math.random().toString(36).substring(7),
    };
    
    const updatedMethods = method.isDefault
      ? [newMethod, ...paymentMethods.map(m => ({ ...m, isDefault: false }))]
      : [...paymentMethods, newMethod];
    
    setPaymentMethods(updatedMethods);
    localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
    setShowAddCardModal(false);
  };

  const removePaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.filter(m => m.id !== id);
    setPaymentMethods(updatedMethods);
    localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
  };

  const setDefaultPaymentMethod = (id: string) => {
    const updatedMethods = paymentMethods.map(m => ({
      ...m,
      isDefault: m.id === id,
    }));
    setPaymentMethods(updatedMethods);
    localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
  };

  // Calculate costs
  const estimatedCost = 
    usageStats.apiCalls * 0.1 + // $0.001 per call = 0.1 cents
    usageStats.virtualCards * 10 + // $0.10 per card = 10 cents
    usageStats.consensusVotes * 2; // $0.02 per vote = 2 cents

  const budgetUsedPercentage = budgetSettings.enabled 
    ? (estimatedCost / budgetSettings.monthlyBudget) * 100 
    : 0;

  const isOverBudget = budgetSettings.enabled && budgetUsedPercentage >= 100;
  const isNearBudget = budgetSettings.enabled && budgetUsedPercentage >= budgetSettings.alertThreshold;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Billing & Usage</h1>
          <p className="text-gray-400">Monitor your API usage and manage payment methods</p>
        </div>

        {/* Budget Alert Banner */}
        {budgetSettings.enabled && isNearBudget && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isOverBudget 
              ? 'bg-red-500/10 border-red-500 text-red-400' 
              : 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
          }`}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">
                {isOverBudget 
                  ? '⚠️ Budget Exceeded!' 
                  : `⚠️ ${budgetUsedPercentage.toFixed(0)}% of budget used`}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-80">
              {isOverBudget
                ? `You've exceeded your monthly budget of $${(budgetSettings.monthlyBudget / 100).toFixed(2)}`
                : `You're approaching your alert threshold of ${budgetSettings.alertThreshold}%`}
            </p>
          </div>
        )}

        {/* Usage Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loading ? '...' : usageStats.apiCalls.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">API Calls</p>
            <p className="text-xs text-gray-500 mt-2">
              ${((usageStats.apiCalls * 0.001).toFixed(3))} estimated cost
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loading ? '...' : usageStats.virtualCards.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Virtual Cards</p>
            <p className="text-xs text-gray-500 mt-2">
              ${((usageStats.virtualCards * 0.10).toFixed(2))} estimated cost
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-500/20 rounded-lg">
                <Users className="w-6 h-6 text-pink-400" />
              </div>
              <span className="text-sm text-gray-400">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loading ? '...' : usageStats.consensusVotes.toLocaleString()}
            </h3>
            <p className="text-gray-400 text-sm">Consensus Votes</p>
            <p className="text-xs text-gray-500 mt-2">
              ${((usageStats.consensusVotes * 0.02).toFixed(2))} estimated cost
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loading ? '...' : `$${(usageStats.totalSpent / 100).toFixed(2)}`}
            </h3>
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className="text-xs text-gray-500 mt-2">
              {usageStats.transactions} transactions
            </p>
          </div>
        </div>

        {/* Budget Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Monthly Budget</h2>
              <p className="text-gray-400 text-sm">Set spending limits and get alerts</p>
            </div>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-purple-400" />
            </button>
          </div>

          {budgetSettings.enabled ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">
                  ${(estimatedCost / 100).toFixed(2)} of ${(budgetSettings.monthlyBudget / 100).toFixed(2)}
                </span>
                <span className="text-white font-semibold">
                  {budgetUsedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isOverBudget 
                      ? 'bg-gradient-to-r from-red-500 to-red-600' 
                      : isNearBudget
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                ${((budgetSettings.monthlyBudget - estimatedCost) / 100).toFixed(2)} remaining
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Budget tracking is disabled</p>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Enable Budget Tracking
              </button>
            </div>
          )}
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Payment Methods</h2>
              <p className="text-gray-400 text-sm">Manage your payment methods</p>
            </div>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          </div>

          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {method.brand || 'Card'} •••• {method.last4}
                        </span>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                            Default
                          </span>
                        )}
                      </div>
                      {method.expiryMonth && method.expiryYear && (
                        <span className="text-sm text-gray-400">
                          Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => setDefaultPaymentMethod(method.id)}
                        className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => removePaymentMethod(method.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
              <p className="text-gray-400 mb-4">No payment methods added yet</p>
              <button
                onClick={() => setShowAddCardModal(true)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Add Your First Payment Method
              </button>
            </div>
          )}
        </div>

        {/* Pricing Breakdown */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Pricing Breakdown</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">API Calls</span>
              <span className="text-white font-mono">$0.001 per call</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Virtual Cards</span>
              <span className="text-white font-mono">$0.10 per card</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Consensus Votes</span>
              <span className="text-white font-mono">$0.02 per vote</span>
            </div>
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Estimated Monthly Cost</span>
                <span className="text-xl font-bold text-purple-400">
                  ${(estimatedCost / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Settings Modal */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4">Budget Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-white mb-2">
                    <input
                      type="checkbox"
                      checked={budgetSettings.enabled}
                      onChange={(e) => setBudgetSettings({ ...budgetSettings, enabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Enable budget tracking
                  </label>
                </div>

                {budgetSettings.enabled && (
                  <>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Monthly Budget ($)</label>
                      <input
                        type="number"
                        value={budgetSettings.monthlyBudget / 100}
                        onChange={(e) => setBudgetSettings({ 
                          ...budgetSettings, 
                          monthlyBudget: Math.max(0, parseFloat(e.target.value) || 0) * 100 
                        })}
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">
                        Alert Threshold ({budgetSettings.alertThreshold}%)
                      </label>
                      <input
                        type="range"
                        value={budgetSettings.alertThreshold}
                        onChange={(e) => setBudgetSettings({ 
                          ...budgetSettings, 
                          alertThreshold: parseInt(e.target.value) 
                        })}
                        className="w-full"
                        min="50"
                        max="95"
                        step="5"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>50%</span>
                        <span>95%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveBudgetSettings(budgetSettings)}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Method Modal */}
        {showAddCardModal && (
          <AddPaymentMethodModal
            onAdd={addPaymentMethod}
            onClose={() => setShowAddCardModal(false)}
          />
        )}
      </div>
    </div>
  );
}

interface AddPaymentMethodModalProps {
  onAdd: (method: Omit<PaymentMethod, 'id'>) => void;
  onClose: () => void;
}

function AddPaymentMethodModal({ onAdd, onClose }: AddPaymentMethodModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const brand = cardNumber.startsWith('4') ? 'Visa' : 
                  cardNumber.startsWith('5') ? 'Mastercard' :
                  cardNumber.startsWith('3') ? 'Amex' : 'Card';
    
    onAdd({
      type: 'card',
      last4: cardNumber.slice(-4),
      brand,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      isDefault,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
        <h3 className="text-2xl font-bold text-white mb-4">Add Payment Method</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="1234 5678 9012 3456"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
              required
              maxLength={16}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">MM</label>
              <input
                type="text"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="12"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                required
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">YY</label>
              <input
                type="text"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                placeholder="25"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                required
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                required
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4"
              />
              Set as default payment method
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Add Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
