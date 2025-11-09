# flux# Quorum Dashboard

Beautiful real-time visualization for the Quorum AI Agent Payment Consensus System.

## 🎨 Features

- **Real-time Agent Voting Visualization** - Watch 5 AI agents deliberate and vote
- **Beautiful Gradient UI** - Modern, sleek design with Tailwind CSS
- **Animated Transitions** - Smooth animations with Framer Motion
- **Live Results** - See consensus decisions in real-time
- **Agent Personas** - Each agent has distinct personality and reasoning

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed
- Your consensus.py file in the parent directory

### Backend Setup (Flask API)

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Make sure your `.env` file has all required API keys:
```bash
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
XAI_API_KEY=your_key
# etc...
```

4. Start the Flask server:
```bash
python api.py
```

The API will run on `http://localhost:5001`

### Frontend Setup (Next.js)

1. In the root quorum-dashboard directory, install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## 📁 Project Structure

```
quorum-dashboard/
├── app/
│   ├── page.tsx          # Main dashboard component
│   ├── layout.tsx        # Next.js layout
│   └── globals.css       # Global styles
├── backend/
│   ├── api.py           # Flask API server
│   └── requirements.txt # Python dependencies
├── package.json
└── README.md
```

## 🎯 How to Use

1. Fill out the purchase request form with:
   - Amount
   - Purpose
   - Requesting Agent
   - Justification
   - Expected ROI
   - Urgency

2. Click "Submit for Consensus"

3. Watch as 5 AI agents (CFO, Growth, Risk, Operations, Data) evaluate your request

4. See the final decision: APPROVED or DENIED

## 🎨 UI Highlights

- **Gradient Background** - Purple/slate theme
- **Glass Morphism** - Frosted glass effect on cards
- **Agent Icons** - Unique icons for each agent type
- **Vote Colors** - Green for YES, Red for NO
- **Animated Entries** - Smooth stagger animations
- **Risk Scores** - Visual risk assessment

## 🔧 Tech Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide Icons

**Backend:**
- Flask
- Flask-CORS
- Your consensus.py system

## 🎬 Demo Scenarios

Try these test cases:

1. **Should Pass:**
   - Amount: $500
   - Purpose: "OpenAI API credits for customer support chatbot"
   - Justification: "Support tickets up 300%, chatbot handles 70%"

2. **Should Fail:**
   - Amount: $5000
   - Purpose: "Premium Slack workspace"
   - Justification: "Better team communication"

3. **Debatable:**
   - Amount: $2000
   - Purpose: "Anthropic Claude Enterprise"
   - Justification: "Competitive advantage, potential $50K revenue"

## 📝 Notes

- Make sure both servers are running (Flask on 5001, Next.js on 3000)
- The consensus.py file must be in the parent directory of the backend folder
- All agent votes display sequentially for dramatic effect
- Results are stored in the Flask server's memory (resets on restart)

## 🐛 Troubleshooting

**"Cannot connect to API"**
- Check that Flask is running on port 5001
- Check for CORS errors in browser console

**"Module not found: consensus"**
- Make sure consensus.py is in the correct location
- Check the sys.path.append in api.py

**"API Keys not working"**
- Verify all keys are in your .env file
- Make sure .env is in the same directory as consensus.py

## 🎉 Ready for Demo!

This is production-ready for your HackPrinceton demo. The UI is polished, animations are smooth, and the visualization clearly shows the multi-agent consensus process.