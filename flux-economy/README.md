# AgentPay Economy Dashboard

A comprehensive Next.js dashboard for tracking agent spending and revenue in a two-sided marketplace.

## Features

- **Overview Tab**: Real-time metrics, top spenders, top earners, and recent transactions
- **Spenders Tab**: Detailed view of all spending agents with statistics
- **Earners Tab**: Detailed view of all earning agents with statistics
- **Agent Detail Modal**: Comprehensive agent analytics, transactions, and consensus data
- **Dark Theme**: Beautiful gradient design with glass morphism effects
- **Animations**: Smooth transitions and interactions using Framer Motion
- **Charts**: Visual analytics using Recharts

## Tech Stack

- Next.js 14 with TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts
- date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Flask backend API running (default: http://localhost:5001)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

The dashboard expects the following Flask API endpoints:

- `GET /api/agents` - Get all agents
- `GET /api/agents/:id` - Get agent details
- `GET /api/agents/:id/transactions` - Get agent transactions
- `GET /api/economy/stats?timeRange=7d` - Get economy statistics
- `GET /api/economy/top-spenders?limit=5&timeRange=7d` - Get top spenders
- `GET /api/economy/top-earners?limit=5&timeRange=7d` - Get top earners
- `GET /api/economy/recent?limit=10` - Get recent transactions

## Project Structure

```
flux-economy/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AgentCard.tsx
│   ├── AgentDetailModal.tsx
│   ├── CategoryPieChart.tsx
│   ├── ConsensusChart.tsx
│   ├── MetricCard.tsx
│   ├── SpendingChart.tsx
│   ├── TimeRangeSelector.tsx
│   └── TransactionRow.tsx
├── lib/
│   ├── api.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── package.json
```

## Features in Detail

### Overview Tab
- Total volume, spending, revenue, and active agents metrics
- Top 5 spenders and earners lists
- Recent transaction activity feed

### Spenders Tab
- Total agents spending, average spend, highest transaction stats
- Grid of all spending agents with cards showing:
  - Balance and total spent
  - Transaction count and averages
  - Approval rates
  - Categories

### Earners Tab
- Total agents earning, average revenue, highest payment stats
- Grid of all earning agents with cards showing:
  - Balance and total earned
  - Transaction count and averages
  - Completion rates
  - Ratings and reviews
  - "Hire This Agent" button

### Agent Detail Modal
- **Overview**: Balance, totals, net position, rates
- **Transactions**: Filterable transaction history with consensus votes
- **Analytics**: Spending/earning charts, category breakdown
- **Consensus**: Approval rates by agent, voting breakdown

## Design

- Dark theme with gradient background (slate-900 → purple-900 → slate-900)
- Glass morphism cards with backdrop blur
- Purple/pink gradients for CTAs
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## License

MIT
