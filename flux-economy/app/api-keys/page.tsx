'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface APIKey {
  id: string;
  key_name: string;
  key_hash: string;
  masked_key: string;
  last_used_at: string | null;
  created_at: string;
}

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'test' | 'live'>('test');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/keys', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const response = await fetch('http://localhost:5001/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newKeyName,
          type: newKeyType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCreatedKey(data.api_key);
        setNewKeyName('');
        await fetchKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        await fetchKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const toggleVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
            <p className="text-gray-400">Manage your API keys for accessing the AgentPay Economy API</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-5 h-5" />
            Create API Key
          </button>
        </div>

        {/* Copy Success Toast */}
        <AnimatePresence>
          {copySuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg backdrop-blur-xl"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied to clipboard!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {keys.length > 0 ? (
          <div className="space-y-4">
            {keys.map((apiKey, index) => (
              <motion.div
                key={apiKey.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{apiKey.key_name}</h3>
                        <span className="text-xs text-gray-400">
                          {apiKey.key_hash?.startsWith('sk_live') ? 'Live' : 'Test'} Key
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <code className="flex-1 px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-sm text-gray-300 font-mono">
                        {visibleKeys.has(apiKey.id) ? apiKey.key_hash : apiKey.masked_key}
                      </code>
                      <button
                        onClick={() => toggleVisibility(apiKey.id)}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                        title={visibleKeys.has(apiKey.id) ? 'Hide' : 'Show'}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key_hash)}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span>Created: {formatDate(apiKey.created_at)}</span>
                      <span>Last used: {formatDate(apiKey.last_used_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all text-red-400"
                    title="Delete key"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <Key className="w-16 h-16 mx-auto mb-4 opacity-30 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">No API keys yet</h3>
            <p className="text-gray-400 mb-6">Create your first API key to start using the AgentPay SDK</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create API Key
            </button>
          </div>
        )}

        {/* SDK Integration Guide */}
        <div className="mt-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Using the AgentPay SDK</h2>
          <p className="text-gray-400 mb-6">
            Integrate AgentPay into your autonomous agents with our Python SDK. Get started in minutes.
          </p>

          <div className="space-y-6">
            {/* Installation */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-400">1</span>
                Install the SDK
              </h3>
              <div className="relative">
                <code className="block px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300 font-mono">
                  pip install agentpay-sdk
                </code>
                <button
                  onClick={() => copyToClipboard('pip install agentpay-sdk')}
                  className="absolute right-3 top-3 p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Initialize */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-400">2</span>
                Initialize with your API key
              </h3>
              <div className="relative">
                <pre className="px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto">
{`from agentpay import AgentPaySDK

# Initialize SDK with your API key
sdk = AgentPaySDK(
    api_key="sk_test_your_api_key_here",
    base_url="http://localhost:5001"
)

# SDK is now connected and ready to use!`}</pre>
                <button
                  onClick={() => copyToClipboard(`from agentpay import AgentPaySDK\n\n# Initialize SDK with your API key\nsdk = AgentPaySDK(\n    api_key="sk_test_your_api_key_here",\n    base_url="http://localhost:5001"\n)\n\n# SDK is now connected and ready to use!`)}
                  className="absolute right-3 top-3 p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Request Payment Card */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-400">3</span>
                Request a one-time payment card
              </h3>
              <div className="relative">
                <pre className="px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300 font-mono overflow-x-auto">
{`# Agent requests payment approval
result = await sdk.request_payment_card(
    amount=10000,  # $100.00 in cents
    purpose="OpenAI API Credits",
    justification="Need GPT-4 for customer support",
    expected_roi="Save $3000/month in support costs",
    urgency="High"
)

if result.approved:
    # Use the one-time virtual card
    card = result.card
    print(f"Card: {card.card_number}")
    print(f"CVV: {card.cvv}")
    print(f"Expires: {card.expiry_date}")

    # Card is valid for 5 minutes or one use
    # After first charge, card is automatically invalidated
else:
    print(f"Denied: {result.denial_reason}")`}</pre>
                <button
                  onClick={() => copyToClipboard(`# Agent requests payment approval\nresult = await sdk.request_payment_card(\n    amount=10000,  # $100.00 in cents\n    purpose="OpenAI API Credits",\n    justification="Need GPT-4 for customer support",\n    expected_roi="Save $3000/month in support costs",\n    urgency="High"\n)\n\nif result.approved:\n    # Use the one-time virtual card\n    card = result.card\n    print(f"Card: {card.card_number}")\n    print(f"CVV: {card.cvv}")\n    print(f"Expires: {card.expiry_date}")\n    \n    # Card is valid for 5 minutes or one use\n    # After first charge, card is automatically invalidated\nelse:\n    print(f"Denied: {result.denial_reason}")`)}
                  className="absolute right-3 top-3 p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="text-white font-semibold mb-2">AI-Powered Approval</h4>
                <p className="text-sm text-gray-400">
                  5 AI agents vote on each request based on justification, ROI, and risk assessment
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-white font-semibold mb-2">One-Time Cards</h4>
                <p className="text-sm text-gray-400">
                  Virtual cards expire after 5 minutes or first use, whichever comes first
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-lg">
                <h4 className="text-white font-semibold mb-2">Full Transparency</h4>
                <p className="text-sm text-gray-400">
                  All transactions and approval votes appear in real-time on your dashboard
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create API Key Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md backdrop-blur-xl bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
              >
                {!createdKey ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Key className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Create API Key</h2>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Key Name
                        </label>
                        <input
                          type="text"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g., Production API Key"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Environment
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setNewKeyType('test')}
                            className={`px-4 py-3 rounded-lg border transition-all ${
                              newKeyType === 'test'
                                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            Test
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewKeyType('live')}
                            className={`px-4 py-3 rounded-lg border transition-all ${
                              newKeyType === 'live'
                                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            Live
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300">
                          This key will only be shown once. Make sure to copy it and store it securely.
                        </p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setShowCreateModal(false)}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateKey}
                          disabled={!newKeyName.trim()}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Create Key
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">API Key Created!</h2>
                      <p className="text-gray-400 text-sm">
                        Copy your API key now. You won't be able to see it again.
                      </p>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 bg-black/20 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 font-mono break-all">
                          {createdKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(createdKey)}
                          className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all text-emerald-400"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCreatedKey(null);
                        setShowCreateModal(false);
                        setNewKeyName('');
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
                    >
                      Done
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
