# Quorum Dashboard

A Next.js 14 frontend application for the Quorum AI-Native Financial Infrastructure platform.

## Project Structure

```
quorum-dashboard/
├── app/                    # Next.js App Router directory
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles with Tailwind CSS
├── backend/               # Python Flask backend (separate service)
│   ├── api.py            # Flask API endpoints
│   └── ...
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Node.js dependencies

```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for the backend)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup

The frontend expects the Flask backend to be running on `http://localhost:5001`.

To start the backend:
```bash
cd backend
# Activate your virtual environment if using one
python api.py
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Features

- Purchase request form
- Multi-agent consensus visualization
- Real-time vote tracking
- Animated UI with Framer Motion

