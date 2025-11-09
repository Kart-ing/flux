export interface Agent {
  id: string;
  name: string;
  displayName: string;
  type: 'spender' | 'earner' | 'both';
  balance: number;  // in cents
  hold: number;  // in cents (escrow)
  totalSpent: number;
  totalEarned: number;
  transactionCount: number;
  avgTransactionSize: number;
  status: 'active' | 'paused';
  rating?: number;  // for earners
  completionRate?: number;  // for earners
  approvalRate?: number;  // for spenders
  categories?: string[];  // what they spend on or offer
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'escrow' | 'stream' | 'top_up' | 'card_request' | 'card_charge';
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  amount: number;  // in cents
  purpose: string;
  memo?: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'pending_approval' | 'approved' | 'denied';
  consensusRequired: boolean;
  consensusResult?: {
    approved: boolean;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    averageRiskScore: number;
    agentVotes: Array<{
      agentName: string;
      emoji: string;
      vote: 'YES' | 'NO' | 'ABSTAIN';
      reasoning: string;
      riskScore: number;
      conditions?: string;
      model: string;
    }>;
  };
  timestamp: string;
  ledgerEntries?: any[];
}

export interface VirtualCard {
  id: string;
  cardNumber: string;
  cvv: string;
  expiryDate: string;
  cardHolderName: string;
  agentId: string;
  userId: string;
  amountLimit: number;  // in cents
  status: 'active' | 'used' | 'expired' | 'cancelled';
  purpose?: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  transactionId?: string;
}

export interface ApprovalResult {
  approved: boolean;
  card?: VirtualCard;
  consensusResult?: Transaction['consensusResult'];
  transactionId: string;
  denialReason?: string;
}

export interface EconomyStats {
  totalVolume: number;
  totalSpending: number;
  totalRevenue: number;
  activeAgents: number;
  transactionCount: number;
}

export type TimeRange = '24h' | '7d' | '30d' | 'all';
