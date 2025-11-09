import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
import json

DB_PATH = os.path.join(os.path.dirname(__file__), 'economy.db')

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with schema"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Agents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('spender', 'earner', 'both')),
            balance INTEGER NOT NULL DEFAULT 0,
            hold INTEGER NOT NULL DEFAULT 0,
            total_spent INTEGER NOT NULL DEFAULT 0,
            total_earned INTEGER NOT NULL DEFAULT 0,
            transaction_count INTEGER NOT NULL DEFAULT 0,
            avg_transaction_size INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused')),
            rating REAL,
            completion_rate REAL,
            approval_rate REAL,
            categories TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL CHECK(type IN ('payment', 'escrow', 'stream', 'top_up')),
            from_agent_id TEXT,
            from_agent_name TEXT,
            to_agent_id TEXT,
            to_agent_name TEXT,
            amount INTEGER NOT NULL,
            purpose TEXT NOT NULL,
            memo TEXT,
            status TEXT NOT NULL CHECK(status IN ('completed', 'pending', 'failed', 'cancelled')),
            consensus_required INTEGER NOT NULL DEFAULT 0,
            consensus_result TEXT,
            timestamp TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    # API Keys table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            key_name TEXT NOT NULL,
            key_hash TEXT NOT NULL,
            last_used_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Create default user if not exists
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        # Simple password hash for "welcome" (in production, use proper hashing)
        import hashlib
        password_hash = hashlib.sha256('welcome'.encode()).hexdigest()
        cursor.execute('''
            INSERT INTO users (id, username, password_hash, email, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            'user-1',
            'user',
            password_hash,
            'user@agentpay.com',
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DB_PATH}")

def get_agents(filters: Optional[Dict] = None) -> List[Dict]:
    """Get all agents with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM agents'
    params = []
    
    if filters:
        conditions = []
        if 'type' in filters:
            conditions.append('type = ?')
            params.append(filters['type'])
        if 'status' in filters:
            conditions.append('status = ?')
            params.append(filters['status'])
        if conditions:
            query += ' WHERE ' + ' AND '.join(conditions)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_agent(agent_id: str) -> Optional[Dict]:
    """Get a single agent by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM agents WHERE id = ?', (agent_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_transactions(filters: Optional[Dict] = None, limit: Optional[int] = None) -> List[Dict]:
    """Get transactions with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM transactions'
    params = []
    conditions = []
    
    if filters:
        if 'agent_id' in filters:
            conditions.append('(from_agent_id = ? OR to_agent_id = ?)')
            params.extend([filters['agent_id'], filters['agent_id']])
        if 'status' in filters:
            conditions.append('status = ?')
            params.append(filters['status'])
        if 'type' in filters:
            conditions.append('type = ?')
            params.append(filters['type'])
        if 'time_range' in filters:
            # Calculate cutoff date
            from datetime import timedelta
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
                conditions.append('timestamp >= ?')
                params.append(cutoff.isoformat() + 'Z')
    
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    
    query += ' ORDER BY timestamp DESC'
    
    if limit:
        query += f' LIMIT {limit}'
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def seed_sample_data():
    """Seed database with sample data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute('SELECT COUNT(*) FROM agents')
    if cursor.fetchone()[0] > 0:
        print("Sample data already exists, skipping seed")
        conn.close()
        return
    
    import random
    import uuid
    from datetime import timedelta
    
    now = datetime.now()
    
    # Sample spenders
    spender_names = [
        'Growth Agent', 'Marketing Bot', 'Sales Assistant', 'Content Creator',
        'Research Agent', 'Customer Service Bot', 'HR Assistant', 'Ops Manager'
    ]
    
    for i, name in enumerate(spender_names):
        agent_id = f"spender-{i+1}"
        total_spent = random.randint(5000000, 50000000)
        tx_count = random.randint(10, 100)
        
        cursor.execute('''
            INSERT INTO agents (id, name, display_name, type, balance, hold, total_spent, total_earned, 
                              transaction_count, avg_transaction_size, status, approval_rate, categories, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            agent_id,
            name.lower().replace(' ', '-'),
            name,
            'spender',
            random.randint(1000000, 10000000),
            0,
            total_spent,
            0,
            tx_count,
            total_spent // tx_count if tx_count > 0 else 0,
            'active',
            round(random.uniform(75, 95), 1),
            json.dumps(random.sample(['Marketing', 'Ads', 'Content', 'Research', 'Operations'], k=random.randint(1, 3))),
            (now - timedelta(days=random.randint(1, 90))).isoformat() + 'Z',
            now.isoformat() + 'Z'
        ))
    
    # Sample earners
    earner_names = [
        'API Service Provider', 'Data Processing Agent', 'ML Model Service',
        'Translation Service', 'Image Generation Service', 'Code Review Bot',
        'Security Scanner', 'Analytics Provider', 'Storage Service', 'Compute Service'
    ]
    
    for i, name in enumerate(earner_names):
        agent_id = f"earner-{i+1}"
        total_earned = random.randint(10000000, 80000000)
        tx_count = random.randint(20, 200)
        
        cursor.execute('''
            INSERT INTO agents (id, name, display_name, type, balance, hold, total_spent, total_earned,
                              transaction_count, avg_transaction_size, status, rating, completion_rate, categories, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            agent_id,
            name.lower().replace(' ', '-'),
            name,
            'earner',
            random.randint(5000000, 50000000),
            0,
            0,
            total_earned,
            tx_count,
            total_earned // tx_count if tx_count > 0 else 0,
            'active',
            round(random.uniform(4.0, 5.0), 1),
            round(random.uniform(85, 99), 1),
            json.dumps(random.sample(['API', 'Processing', 'ML', 'Storage', 'Compute'], k=random.randint(1, 3))),
            (now - timedelta(days=random.randint(1, 90))).isoformat() + 'Z',
            now.isoformat() + 'Z'
        ))
    
    # Commit agents before generating transactions
    conn.commit()
    
    # Generate transactions
    agent_ids = [f"spender-{i+1}" for i in range(len(spender_names))] + \
                [f"earner-{i+1}" for i in range(len(earner_names))]
    
    for i in range(200):
        from_agent = random.choice(agent_ids)
        to_agent = random.choice([aid for aid in agent_ids if aid != from_agent])
        
        # Get agent names
        cursor.execute('SELECT display_name FROM agents WHERE id = ?', (from_agent,))
        from_row = cursor.fetchone()
        from_name = from_row[0] if from_row else 'Unknown'
        cursor.execute('SELECT display_name FROM agents WHERE id = ?', (to_agent,))
        to_row = cursor.fetchone()
        to_name = to_row[0] if to_row else 'Unknown'
        
        amount = random.randint(10000, 500000)
        timestamp = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        
        cursor.execute('''
            INSERT INTO transactions (id, type, from_agent_id, from_agent_name, to_agent_id, to_agent_name,
                                    amount, purpose, memo, status, consensus_required, timestamp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            str(uuid.uuid4()),
            random.choice(['payment', 'escrow', 'stream']),
            from_agent,
            from_name,
            to_agent,
            to_name,
            amount,
            random.choice([
                'API Service Payment', 'Task Completion', 'Data Processing',
                'Compute Resources', 'Storage Fees', 'ML Model Inference',
                'Content Generation', 'Translation Service'
            ]),
            f'Transaction #{i+1}',
            random.choice(['completed', 'pending', 'completed', 'completed']),
            random.choice([0, 1]),
            timestamp.isoformat() + 'Z',
            timestamp.isoformat() + 'Z'
        ))
    
    conn.commit()
    conn.close()
    print("✅ Sample data seeded successfully")

# Initialize database on import
init_database()
seed_sample_data()

