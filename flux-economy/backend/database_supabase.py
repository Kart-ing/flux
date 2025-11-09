"""
Supabase Database Module for AgentPay Economy
Uses PostgreSQL via Supabase for production-ready storage
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')

# Initialize Supabase client
supabase: Client = None

def init_supabase():
    """Initialize Supabase client"""
    global supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"✅ Connected to Supabase at {SUPABASE_URL}")
    return supabase

def get_supabase_client() -> Client:
    """Get Supabase client, initializing if needed"""
    global supabase
    if supabase is None:
        init_supabase()
    return supabase

def get_agents(filters: Optional[Dict] = None) -> List[Dict]:
    """Get all agents with optional filters"""
    client = get_supabase_client()
    query = client.table('agents').select('*')

    if filters:
        if 'type' in filters:
            query = query.eq('type', filters['type'])
        if 'status' in filters:
            query = query.eq('status', filters['status'])

    result = query.execute()
    return result.data

def get_agent(agent_id: str) -> Optional[Dict]:
    """Get a single agent by ID"""
    client = get_supabase_client()
    result = client.table('agents').select('*').eq('id', agent_id).execute()
    return result.data[0] if result.data else None

def get_transactions(filters: Optional[Dict] = None, limit: Optional[int] = None) -> List[Dict]:
    """Get transactions with optional filters"""
    client = get_supabase_client()
    
    # Handle agent_id filter specially since we need OR logic
    if filters and 'agent_id' in filters:
        agent_id = filters['agent_id']
        
        # Build the query with proper OR syntax
        # Fetch all transactions and filter in Python for now
        # TODO: Optimize with proper Supabase OR query
        query = client.table('transactions').select('*')
        
        # Apply other filters first
        if 'status' in filters:
            query = query.eq('status', filters['status'])
        if 'type' in filters:
            query = query.eq('type', filters['type'])
        if 'time_range' in filters:
            now = datetime.now()
            if filters['time_range'] == '24h':
                cutoff = now - timedelta(days=1)
            elif filters['time_range'] == '7d':
                cutoff = now - timedelta(days=7)
            elif filters['time_range'] == '30d':
                cutoff = now - timedelta(days=30)
            else:
                cutoff = None
            if cutoff:
                query = query.gte('timestamp', cutoff.isoformat())
        
        query = query.order('timestamp', desc=True)
        
        if limit:
            # Get more than needed since we'll filter
            query = query.limit(limit * 10 if limit < 100 else 1000)
        
        try:
            result = query.execute()
            # Filter in Python for OR condition
            transactions = [
                tx for tx in result.data 
                if tx.get('from_agent_id') == agent_id or tx.get('to_agent_id') == agent_id
            ]
            # Apply limit after filtering
            if limit and len(transactions) > limit:
                transactions = transactions[:limit]
            return transactions
        except Exception as e:
            print(f"❌ Error in get_transactions (agent_id filter): {e}")
            import traceback
            traceback.print_exc()
            return []
    
    # Normal query without agent_id filter
    query = client.table('transactions').select('*')

    if filters:
        if 'status' in filters:
            query = query.eq('status', filters['status'])
        if 'type' in filters:
            query = query.eq('type', filters['type'])
        if 'time_range' in filters:
            # Calculate cutoff date
            now = datetime.now()
            if filters['time_range'] == '24h':
                cutoff = now - timedelta(days=1)
            elif filters['time_range'] == '7d':
                cutoff = now - timedelta(days=7)
            elif filters['time_range'] == '30d':
                cutoff = now - timedelta(days=30)
            else:
                cutoff = None
            if cutoff:
                query = query.gte('timestamp', cutoff.isoformat())

    query = query.order('timestamp', desc=True)

    if limit:
        query = query.limit(limit)

    try:
        result = query.execute()
        return result.data
    except Exception as e:
        print(f"❌ Error in get_transactions: {e}")
        import traceback
        traceback.print_exc()
        return []

def get_top_spenders(limit: int = 10, time_range: Optional[str] = None) -> List[Dict]:
    """Get top spending agents"""
    client = get_supabase_client()

    # For time-based queries, we'd need to aggregate transactions
    # For now, using total_spent from agents table
    query = client.table('agents').select('*').in_('type', ['spender', 'both']).order('total_spent', desc=True).limit(limit)
    result = query.execute()
    return result.data

def get_top_earners(limit: int = 10, time_range: Optional[str] = None) -> List[Dict]:
    """Get top earning agents"""
    client = get_supabase_client()

    query = client.table('agents').select('*').in_('type', ['earner', 'both']).order('total_earned', desc=True).limit(limit)
    result = query.execute()
    return result.data

def get_economy_stats(time_range: str = '7d') -> Dict:
    """Get overall economy statistics"""
    client = get_supabase_client()

    # Get all agents
    agents_result = client.table('agents').select('*').execute()
    agents = agents_result.data

    # Get transactions for time range
    transactions = get_transactions(filters={'time_range': time_range})

    # Calculate stats
    total_volume = sum(tx['amount'] for tx in transactions)
    total_spending = sum(tx['amount'] for tx in transactions if tx['type'] in ['payment', 'escrow', 'stream'])
    total_revenue = total_spending  # Revenue = spending in this economy
    active_agents = len([a for a in agents if a['status'] == 'active'])

    return {
        'totalVolume': total_volume,
        'totalSpending': total_spending,
        'totalRevenue': total_revenue,
        'activeAgents': active_agents,
        'totalTransactions': len(transactions)
    }

def create_agent(agent_data: Dict) -> Dict:
    """Create a new agent"""
    client = get_supabase_client()

    data = {
        'name': agent_data['name'],
        'display_name': agent_data['display_name'],
        'type': agent_data['type'],
        'balance': agent_data.get('balance', 0),
        'categories': agent_data.get('categories', []),
    }

    result = client.table('agents').insert(data).execute()
    return result.data[0] if result.data else None

def create_transaction(tx_data: Dict) -> Dict:
    """Create a new transaction"""
    client = get_supabase_client()

    data = {
        'type': tx_data['type'],
        'from_agent_id': tx_data.get('from_agent_id'),
        'from_agent_name': tx_data.get('from_agent_name'),
        'to_agent_id': tx_data.get('to_agent_id'),
        'to_agent_name': tx_data.get('to_agent_name'),
        'amount': tx_data['amount'],
        'purpose': tx_data['purpose'],
        'memo': tx_data.get('memo'),
        'status': tx_data.get('status', 'completed'),
        'consensus_required': tx_data.get('consensus_required', False),
        'consensus_result': tx_data.get('consensus_result'),
    }

    result = client.table('transactions').insert(data).execute()
    return result.data[0] if result.data else None

def update_agent_balance(agent_id: str, balance: int, total_spent: int = None, total_earned: int = None) -> Dict:
    """Update agent balance and totals"""
    client = get_supabase_client()

    data = {'balance': balance}
    if total_spent is not None:
        data['total_spent'] = total_spent
    if total_earned is not None:
        data['total_earned'] = total_earned

    result = client.table('agents').update(data).eq('id', agent_id).execute()
    return result.data[0] if result.data else None

def verify_user_credentials(username: str, password_hash: str) -> Optional[Dict]:
    """Verify user login credentials"""
    client = get_supabase_client()

    result = client.table('users').select('*').eq('username', username).eq('password_hash', password_hash).execute()
    return result.data[0] if result.data else None

def get_user_by_username(username: str) -> Optional[Dict]:
    """Get user by username"""
    client = get_supabase_client()

    result = client.table('users').select('*').eq('username', username).execute()
    return result.data[0] if result.data else None

def get_virtual_cards(user_id: str, agent_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict]:
    """Get virtual cards for a user, optionally filtered by agent or status"""
    client = get_supabase_client()
    
    query = client.table('virtual_cards').select('*').eq('user_id', user_id)
    
    if agent_id:
        query = query.eq('agent_id', agent_id)
    if status:
        query = query.eq('status', status)
    
    query = query.order('created_at', desc=True)
    result = query.execute()
    return result.data

def get_virtual_card(card_id: str) -> Optional[Dict]:
    """Get a single virtual card by ID"""
    client = get_supabase_client()
    
    result = client.table('virtual_cards').select('*').eq('id', card_id).execute()
    return result.data[0] if result.data else None

def get_virtual_card_by_number(card_number: str) -> Optional[Dict]:
    """Get a virtual card by card number"""
    client = get_supabase_client()
    
    result = client.table('virtual_cards').select('*').eq('card_number', card_number).execute()
    return result.data[0] if result.data else None

def update_virtual_card_status(card_id: str, status: str, used_at: Optional[str] = None) -> Dict:
    """Update virtual card status"""
    client = get_supabase_client()
    
    update_data = {'status': status}
    if used_at:
        update_data['used_at'] = used_at
    
    result = client.table('virtual_cards').update(update_data).eq('id', card_id).execute()
    return result.data[0] if result.data else None

# Initialize on import (but won't fail if env vars not set - will fail on first query)
try:
    init_supabase()
except ValueError as e:
    print(f"⚠️  Supabase not initialized: {e}")
    print("Set SUPABASE_URL and SUPABASE_KEY environment variables to use Supabase")
