from flask import Flask, jsonify, request, session
from flask_cors import CORS
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import hashlib
import secrets
import database

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)  # For session management

# Enable CORS for all routes - simplest configuration
CORS(app, supports_credentials=True)

# Add CORS headers to all responses (backup)
@app.after_request
def after_request(response):
    # Get the origin from the request
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
    else:
        response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

def format_agent(agent_row: Dict) -> Dict:
    """Format agent from database to API format"""
    categories = []
    if agent_row.get('categories'):
        try:
            import json
            categories = json.loads(agent_row['categories'])
        except:
            categories = []
    
    return {
        'id': agent_row['id'],
        'name': agent_row['name'],
        'displayName': agent_row['display_name'],
        'type': agent_row['type'],
        'balance': agent_row['balance'],
        'hold': agent_row['hold'],
        'totalSpent': agent_row['total_spent'],
        'totalEarned': agent_row['total_earned'],
        'transactionCount': agent_row['transaction_count'],
        'avgTransactionSize': agent_row['avg_transaction_size'],
        'status': agent_row['status'],
        'rating': agent_row.get('rating'),
        'completionRate': agent_row.get('completion_rate'),
        'approvalRate': agent_row.get('approval_rate'),
        'categories': categories,
        'createdAt': agent_row['created_at']
    }

def format_transaction(tx_row: Dict) -> Dict:
    """Format transaction from database to API format"""
    consensus_result = None
    if tx_row.get('consensus_result'):
        try:
            import json
            consensus_result = json.loads(tx_row['consensus_result'])
        except:
            pass
    
    return {
        'id': tx_row['id'],
        'type': tx_row['type'],
        'fromAgentId': tx_row['from_agent_id'],
        'fromAgentName': tx_row['from_agent_name'],
        'toAgentId': tx_row['to_agent_id'],
        'toAgentName': tx_row['to_agent_name'],
        'amount': tx_row['amount'],
        'purpose': tx_row['purpose'],
        'memo': tx_row.get('memo'),
        'status': tx_row['status'],
        'consensusRequired': bool(tx_row.get('consensus_required', 0)),
        'consensusResult': consensus_result,
        'timestamp': tx_row['timestamp']
    }

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required'}), 400
    
    # Check credentials
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user_row = cursor.fetchone()
        conn.close()
        
        if not user_row:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # Convert Row to dict
        user = dict(user_row)
        
        # Simple password check (hash comparison)
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if user['password_hash'] != password_hash:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # Set session
        session['user_id'] = user['id']
        session['username'] = user['username']
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user.get('email')
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user"""
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 401
    
    try:
        conn = database.get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],))
        user_row = cursor.fetchone()
        conn.close()
        
        if not user_row:
            session.clear()
            return jsonify({'authenticated': False}), 401
        
        # Convert Row to dict
        user = dict(user_row)
        
        return jsonify({
            'authenticated': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user.get('email')
            }
        })
    except Exception as e:
        return jsonify({'authenticated': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM agents')
    agents_count = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM transactions')
    transactions_count = cursor.fetchone()[0]
    conn.close()
    
    return jsonify({
        'status': 'healthy',
        'message': 'AgentPay Economy API is running',
        'agents_count': agents_count,
        'transactions_count': transactions_count,
        'cors_enabled': True
    })

@app.route('/api/agents', methods=['GET'])
def get_agents():
    """Get all agents"""
    filters = {}
    if request.args.get('type'):
        filters['type'] = request.args.get('type')
    if request.args.get('status'):
        filters['status'] = request.args.get('status')
    
    agents = database.get_agents(filters)
    return jsonify({'agents': [format_agent(agent) for agent in agents]})

@app.route('/api/agents/<agent_id>', methods=['GET'])
def get_agent(agent_id: str):
    """Get a specific agent"""
    agent = database.get_agent(agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404
    return jsonify({'agent': format_agent(agent)})

@app.route('/api/agents/<agent_id>/transactions', methods=['GET'])
def get_agent_transactions(agent_id: str):
    """Get transactions for a specific agent"""
    agent = database.get_agent(agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404
    
    filters = {'agent_id': agent_id}
    if request.args.get('type'):
        filters['type'] = request.args.get('type')
    if request.args.get('status'):
        filters['status'] = request.args.get('status')
    if request.args.get('timeRange'):
        filters['time_range'] = request.args.get('timeRange')
    
    transactions = database.get_transactions(filters)
    return jsonify({'transactions': [format_transaction(tx) for tx in transactions]})

@app.route('/api/economy/stats', methods=['GET'])
def get_economy_stats():
    """Get economy statistics"""
    time_range = request.args.get('timeRange', '7d')
    
    filters = {'status': 'completed'}
    if time_range != 'all':
        filters['time_range'] = time_range
    
    transactions = database.get_transactions(filters)
    
    total_volume = sum(tx['amount'] for tx in transactions)
    
    # Get spending and revenue from agents
    spenders = database.get_agents({'type': 'spender'})
    both_spenders = database.get_agents({'type': 'both'})
    total_spending = sum(a['total_spent'] for a in spenders + both_spenders)
    
    earners = database.get_agents({'type': 'earner'})
    both_earners = database.get_agents({'type': 'both'})
    total_revenue = sum(a['total_earned'] for a in earners + both_earners)
    
    # Get active agents (have transactions in time range)
    active_agent_ids = set()
    for tx in transactions:
        if tx.get('from_agent_id'):
            active_agent_ids.add(tx['from_agent_id'])
        if tx.get('to_agent_id'):
            active_agent_ids.add(tx['to_agent_id'])
    
    stats = {
        'totalVolume': total_volume,
        'totalSpending': total_spending,
        'totalRevenue': total_revenue,
        'activeAgents': len(active_agent_ids),
        'transactionCount': len(transactions)
    }
    
    return jsonify(stats)

@app.route('/api/economy/top-spenders', methods=['GET'])
def get_top_spenders():
    """Get top spending agents"""
    limit = int(request.args.get('limit', 5))
    time_range = request.args.get('timeRange', '7d')
    
    spenders = database.get_agents({'type': 'spender'})
    both = database.get_agents({'type': 'both'})
    all_spenders = spenders + both
    
    # Sort by total_spent descending
    all_spenders.sort(key=lambda x: x['total_spent'], reverse=True)
    
    return jsonify({'agents': [format_agent(a) for a in all_spenders[:limit]]})

@app.route('/api/economy/top-earners', methods=['GET'])
def get_top_earners():
    """Get top earning agents"""
    limit = int(request.args.get('limit', 5))
    time_range = request.args.get('timeRange', '7d')
    
    earners = database.get_agents({'type': 'earner'})
    both = database.get_agents({'type': 'both'})
    all_earners = earners + both
    
    # Sort by total_earned descending
    all_earners.sort(key=lambda x: x['total_earned'], reverse=True)
    
    return jsonify({'agents': [format_agent(a) for a in all_earners[:limit]]})

@app.route('/api/economy/recent', methods=['GET'])
def get_recent_transactions():
    """Get recent transactions"""
    limit = int(request.args.get('limit', 10))
    
    filters = {'status': 'completed'}
    transactions = database.get_transactions(filters, limit=limit)
    
    return jsonify({'transactions': [format_transaction(tx) for tx in transactions]})

if __name__ == '__main__':
    print("=" * 50)
    print("Starting AgentPay Economy API on port 5001...")
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM agents')
    agents_count = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM transactions')
    transactions_count = cursor.fetchone()[0]
    conn.close()
    print(f"✅ Database ready with {agents_count} agents and {transactions_count} transactions")
    print("=" * 50)
    print("Backend is ready! CORS enabled for all origins.")
    print("=" * 50)
    app.run(debug=True, port=5001, host='0.0.0.0')
