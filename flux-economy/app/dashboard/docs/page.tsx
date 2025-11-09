'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      // noop
    }
  };

  const CodeBlock = ({
    code,
    id,
    language = 'bash',
  }: {
    code: string;
    id: string;
    language?: string;
  }) => (
    <div className="relative group mt-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60">
          <span>{language}</span>
          <button
            aria-label="Copy code to clipboard"
            onClick={() => copyToClipboard(code, id)}
            className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-slate-600 ring-1 ring-slate-300 transition hover:bg-white/60 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800/60 dark:hover:text-white"
          >
            {copiedCode === id ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <pre className="max-h-[520px] overflow-auto px-4 md:px-5 py-4 text-sm leading-relaxed bg-slate-900 text-slate-100 dark:bg-slate-950/90">
          <code className="whitespace-pre">{code}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
        AgentPay SDK Documentation
      </h1>

      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Introduction
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          AgentPay is a powerful payment processing SDK that enables seamless integration of payment functionality into your applications. This documentation will guide you through installation, setup, and usage.
        </p>
      </section>

      {/* Installation */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Installation
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Install AgentPay using npm or yarn:
        </p>
        <CodeBlock
          id="install"
          language="bash"
          code={`npm install agentpay
# or
yarn add agentpay`}
        />
      </section>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Quick Start
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Get started with AgentPay in just a few lines of code:
        </p>
        <CodeBlock
          id="quickstart"
          language="ts"
          code={`import { AgentPay } from 'agentpay';

const agentPay = new AgentPay({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Create a payment
const payment = await agentPay.createPayment({
  amount: 1000,
  currency: 'USD',
  description: 'Product purchase'
});`}
        />
      </section>

      {/* Configuration */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Configuration
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Configure AgentPay with the following options:
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 mb-4 dark:border-slate-800 dark:bg-slate-900/40">
          <ul className="space-y-2">
            <li className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">apiKey</strong> (required): Your AgentPay API key
            </li>
            <li className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">environment</strong>: 'development' | 'production' (default: 'production')
            </li>
            <li className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">timeout</strong>: Request timeout in milliseconds (default: 30000)
            </li>
            <li className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">retries</strong>: Number of retry attempts (default: 3)
            </li>
          </ul>
        </div>
        <CodeBlock
          id="config"
          language="ts"
          code={`const agentPay = new AgentPay({
  apiKey: process.env.AGENTPAY_API_KEY,
  environment: 'production',
  timeout: 30000,
  retries: 3
});`}
        />
      </section>

      {/* Core Methods */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Core Methods
        </h2>

        <div className="space-y-8">
          {/* Create Payment */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Create Payment
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Create a new payment transaction:
            </p>
            <CodeBlock
              id="create-payment"
              language="ts"
              code={`const payment = await agentPay.createPayment({
  amount: 5000,
  currency: 'USD',
  description: 'Order #1234',
  metadata: {
    orderId: '1234',
    customerId: 'cus_123'
  }
});

console.log(payment.id); // Payment ID
console.log(payment.status); // Payment status`}
            />
          </div>

          {/* Get Payment */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Get Payment
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Retrieve payment details by ID:
            </p>
            <CodeBlock
              id="get-payment"
              language="ts"
              code={`const payment = await agentPay.getPayment('pay_123456');

console.log(payment.amount);
console.log(payment.status);
console.log(payment.createdAt);`}
            />
          </div>

          {/* Cancel Payment */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Cancel Payment
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Cancel a pending payment:
            </p>
            <CodeBlock
              id="cancel-payment"
              language="ts"
              code={`const canceledPayment = await agentPay.cancelPayment('pay_123456');

console.log(canceledPayment.status); // 'canceled'`}
            />
          </div>

          {/* List Payments */}
          <div>
            <h3 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              List Payments
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Retrieve a list of payments with optional filters:
            </p>
            <CodeBlock
              id="list-payments"
              language="ts"
              code={`const payments = await agentPay.listPayments({
  limit: 10,
  status: 'succeeded',
  createdAfter: '2024-01-01'
});

payments.data.forEach(payment => {
  console.log(payment.id, payment.amount);
});`}
            />
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Webhooks
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Set up webhooks to receive real-time payment notifications:
        </p>
        <CodeBlock
          id="webhooks"
          language="ts"
          code={`import { verifyWebhookSignature } from 'agentpay';

app.post('/webhooks/agentpay', (req, res) => {
  const signature = req.headers['agentpay-signature'];
  const payload = req.body;

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = payload.event;
  
  switch (event.type) {
    case 'payment.succeeded':
      console.log('Payment succeeded:', event.data);
      break;
    case 'payment.failed':
      console.log('Payment failed:', event.data);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }

  res.json({ received: true });
});`}
        />
      </section>

      {/* Error Handling */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Error Handling
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Handle errors gracefully with try-catch blocks:
        </p>
        <CodeBlock
          id="error-handling"
          language="ts"
          code={`try {
  const payment = await agentPay.createPayment({
    amount: 1000,
    currency: 'USD'
  });
} catch (error) {
  if (error.type === 'invalid_request') {
    console.error('Invalid request:', error.message);
  } else if (error.type === 'authentication_error') {
    console.error('Authentication failed:', error.message);
  } else if (error.type === 'api_error') {
    console.error('API error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}`}
        />
      </section>

      {/* Best Practices */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Best Practices
        </h2>
        <div className="rounded-xl border-l-4 border-blue-600 bg-blue-50 p-6 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-500">
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
              <span>Always use environment variables for API keys</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
              <span>Implement proper error handling for all payment operations</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
              <span>Use webhooks for reliable payment status updates</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
              <span>Test thoroughly in development mode before going live</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
              <span>Keep your SDK version up to date</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Support */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
          Support
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          Need help? Here are some resources:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Documentation
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Visit our comprehensive docs at docs.agentpay.com
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Community
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Join our Discord community for help and discussions
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Email Support
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Contact us at support@agentpay.com
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              GitHub
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Report issues on our GitHub repository
            </p>
          </div>
        </div>
      </section>
    </div>
    );

}
