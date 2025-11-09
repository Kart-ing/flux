'use client';

import React, { useState } from 'react';

export default function DocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AgentPay SDK Documentation
          </h1>
          <p className="text-xl text-gray-300">
            Enable autonomous AI agents to make purchases, manage budgets, and participate in consensus-based approval flows.
          </p>
        </div>

        {/* Key Features */}
        <section className="mb-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">✨ Key Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-lg">Autonomous Agent Support</h3>
                <p className="text-gray-400">AI agents can request and use virtual payment cards</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🗳️</span>
              <div>
                <h3 className="font-semibold text-lg">AI Consensus System</h3>
                <p className="text-gray-400">5 specialized AI agents vote on purchase approvals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h3 className="font-semibold text-lg">Virtual Card Management</h3>
                <p className="text-gray-400">Request, activate, and charge virtual payment cards</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold text-lg">Transaction Tracking</h3>
                <p className="text-gray-400">Complete ledger of all agent transactions and consensus votes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section className="mb-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">📦 Installation</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Install from Git</h3>
                <button
                  onClick={() => copyToClipboard('pip install git+https://github.com/Swayam-Bansal/AgentPay-SDK.git', 'install')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                >
                  {copiedSection === 'install' ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                <code className="text-green-400">pip install git+https://github.com/Swayam-Bansal/AgentPay-SDK.git</code>
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Required Dependencies</h3>
              <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                <code className="text-gray-300">requests &gt;= 2.31.0</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">🚀 Quick Start</h2>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Basic Usage Example</h3>
              <button
                onClick={() => copyToClipboard('import os\nfrom agentpay import AgentPaySDK\n\n# Initialize SDK\nsdk = AgentPaySDK(\n    api_key=os.getenv("AGENTPAY_API_KEY"),\n    base_url=os.getenv("AGENTPAY_BASE_URL", "http://localhost:5001")\n)\n\n# Register an agent\nagent_id = sdk.register_agent(\n    name="ShoppingAgent",\n    agent_type="autonomous",\n    capabilities=["purchase", "budget_management"]\n)\n\n# Request a payment card\ncard = sdk.request_payment_card(\n    agent_id=agent_id,\n    amount=100.0,\n    purpose="Purchase ML training credits"\n)\n\nprint(f"Card issued: {card[\'card_number\']}")\nprint(f"Status: {card[\'status\']}")', 'quickstart')}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
              >
                {copiedSection === 'quickstart' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto">
              <code className="text-gray-300">
{`import os
from agentpay import AgentPaySDK

# Initialize SDK
sdk = AgentPaySDK(
    api_key=os.getenv("AGENTPAY_API_KEY"),
    base_url=os.getenv("AGENTPAY_BASE_URL", "http://localhost:5001")
)

# Register an agent
agent_id = sdk.register_agent(
    name="ShoppingAgent",
    agent_type="autonomous",
    capabilities=["purchase", "budget_management"]
)

# Request a payment card
card = sdk.request_payment_card(
    agent_id=agent_id,
    amount=100.0,
    purpose="Purchase ML training credits"
)

print(f"Card issued: {card['card_number']}")
print(f"Status: {card['status']}")`}
              </code>
            </pre>
          </div>
        </section>

        {/* Core Methods */}
        <section className="mb-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">🔧 Core SDK Methods</h2>
          
          <div className="space-y-6">
            {/* register_agent */}
            <div>
              <h3 className="text-xl font-semibold mb-2 text-purple-200">register_agent()</h3>
              <p className="text-gray-400 mb-3">Register a new autonomous agent in the system</p>
              <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto mb-2">
                <code className="text-gray-300">
{`agent_id = sdk.register_agent(
    name="DataAnalysisAgent",
    agent_type="autonomous",
    capabilities=["data_processing", "api_calls"],
    budget_limit=500.0
)`}
                </code>
              </pre>
            </div>

            {/* request_payment_card */}
            <div>
              <h3 className="text-xl font-semibold mb-2 text-purple-200">request_payment_card()</h3>
              <p className="text-gray-400 mb-3">Request a virtual payment card for purchases</p>
              <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                <code className="text-gray-300">
{`card = sdk.request_payment_card(
    agent_id=agent_id,
    amount=250.0,
    purpose="API credits for OpenAI GPT-4",
    merchant="OpenAI",
    metadata={"project": "customer_support_bot"}
)

print(f"Card Number: {card['card_number']}")
print(f"CVV: {card['cvv']}")
print(f"Expiry: {card['expiry_date']}")
print(f"Status: {card['status']}")  # 'pending_approval'`}
                </code>
              </pre>
            </div>

            {/* charge_card */}
            <div>
              <h3 className="text-xl font-semibold mb-2 text-purple-200">charge_card()</h3>
              <p className="text-gray-400 mb-3">Charge an approved virtual card</p>
              <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                <code className="text-gray-300">
{`# After card is approved
transaction = sdk.charge_card(
    card_number=card['card_number'],
    amount=50.0,
    description="1M tokens GPT-4 API usage"
)

print(f"Transaction ID: {transaction['id']}")
print(f"Status: {transaction['status']}")
print(f"New Balance: {transaction['new_balance']}")`}
                </code>
              </pre>
            </div>

            {/* get_transactions */}
            <div>
              <h3 className="text-xl font-semibold mb-2 text-purple-200">get_transactions()</h3>
              <p className="text-gray-400 mb-3">Retrieve transaction history for an agent</p>
              <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                <code className="text-gray-300">
{`transactions = sdk.get_transactions(
    agent_id=agent_id,
    limit=10
)

for tx in transactions:
    print(f"{tx['timestamp']}: {tx['description']} - {tx['amount']}")`}
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* AI Consensus System */}
        <section className="mb-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">🗳️ AI Consensus System</h2>
          <p className="text-gray-300 mb-6">
            Every payment card request is evaluated by 5 specialized AI agents who vote on approval. 
            The system uses LLaMA 3.2 models to analyze risk, business value, and budget impact.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-purple-200">🛡️ Risk Agent</h3>
              <p className="text-sm text-gray-400">Analyzes security risks and fraud potential</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-purple-200">💼 Business Agent</h3>
              <p className="text-sm text-gray-400">Evaluates business value and ROI</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-purple-200">💰 Budget Agent</h3>
              <p className="text-sm text-gray-400">Checks budget constraints and spending patterns</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-purple-200">📊 Technical Agent</h3>
              <p className="text-sm text-gray-400">Assesses technical feasibility</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg md:col-span-2">
              <h3 className="font-semibold mb-2 text-purple-200">⚖️ Compliance Agent</h3>
              <p className="text-sm text-gray-400">Ensures regulatory compliance</p>
            </div>
          </div>

          <div className="bg-black/30 p-6 rounded-lg">
            <h3 className="font-semibold mb-3 text-purple-200">Voting Process</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400">1.</span>
                <span>Agent requests a payment card with purpose and amount</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">2.</span>
                <span>5 AI agents independently analyze the request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">3.</span>
                <span>Each agent votes: approve, reject, or needs_info</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">4.</span>
                <span>Majority approval (3+ votes) activates the card</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">5.</span>
                <span>All votes and reasoning are logged for transparency</span>
              </li>
            </ul>
          </div>
        </section>

        {/* API Endpoints Reference */}
        <section className="mb-12 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">🔌 API Endpoints Reference</h2>
          <p className="text-gray-300 mb-6">
            The SDK communicates with these backend endpoints (default: http://localhost:5001):
          </p>
          
          <div className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-green-600 text-xs rounded font-mono">POST</span>
                <code className="text-purple-300">/api/agents</code>
              </div>
              <p className="text-sm text-gray-400">Register a new agent</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-600 text-xs rounded font-mono">GET</span>
                <code className="text-purple-300">/api/agents/:id</code>
              </div>
              <p className="text-sm text-gray-400">Get agent details</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-green-600 text-xs rounded font-mono">POST</span>
                <code className="text-purple-300">/api/cards/request</code>
              </div>
              <p className="text-sm text-gray-400">Request a virtual payment card</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-green-600 text-xs rounded font-mono">POST</span>
                <code className="text-purple-300">/api/cards/charge</code>
              </div>
              <p className="text-sm text-gray-400">Charge a virtual card</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-600 text-xs rounded font-mono">GET</span>
                <code className="text-purple-300">/api/cards/:card_number/status</code>
              </div>
              <p className="text-sm text-gray-400">Get card status and consensus votes</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-600 text-xs rounded font-mono">GET</span>
                <code className="text-purple-300">/api/agents/:id/transactions</code>
              </div>
              <p className="text-sm text-gray-400">Get agent transaction history</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-600 text-xs rounded font-mono">GET</span>
                <code className="text-purple-300">/api/virtual-cards</code>
              </div>
              <p className="text-sm text-gray-400">Get all virtual cards</p>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold mb-6 text-purple-300">💬 Support & Resources</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📚 GitHub Repository</h3>
              <a 
                href="https://github.com/Swayam-Bansal/AgentPay-SDK" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                github.com/Swayam-Bansal/AgentPay-SDK
              </a>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🐛 Report Issues</h3>
              <a 
                href="https://github.com/Swayam-Bansal/AgentPay-SDK/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                Submit bug reports and feature requests
              </a>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📖 Examples</h3>
              <p className="text-sm text-gray-400">Check out the <code className="text-purple-300">examples/</code> directory for more use cases</p>
            </div>
            
            <div className="bg-black/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🔑 API Keys</h3>
              <p className="text-sm text-gray-400">Generate your API key in the <a href="/api-keys" className="text-purple-400 hover:text-purple-300">API Keys</a> section</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
