"""
Flask API for AgentPay Economy - Supabase Version
Supports both SQLite (dev) and Supabase (production)
"""

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import hashlib
import secrets
import os
from dotenv import load_dotenv
from auth_middleware import require_api_key, get_authenticated_user, get_api_key_info

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Configure session for cross-domain cookies
app.config.update(
    SESSION_COOKIE_SECURE=True,  # Only send over HTTPS
    SESSION_COOKIE_HTTPONLY=True,  # Prevent JavaScript access
    SESSION_COOKIE_SAMESITE='None',  # Allow cross-site requests
)

# Enable CORS
CORS(app, supports_credentials=True)

# Allowed origins for CORS
ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://flux-production-1c77.up.railway.app',
    'https://*.vercel.app',
    'https://flux-economy-g792nhjm0-kartikey-pandeys-projects-e286300c.vercel.app',
    'https://flux-economy-jsc0bvx8i-kartikey-pandeys-projects-e286300c.vercel.app',
    'https://flux-economy-ezyft1a0g-kartikey-pandeys-projects-e286300c.vercel.app',
    'https://flux-economy.vercel.app'  # Main production domain
]

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    # Allow localhost and Vercel domains
    if origin and (origin in ALLOWED_ORIGINS or origin.startswith('http://localhost') or '.vercel.app' in origin):
        response.headers.add('Access-Control-Allow-Origin', origin)
    else:
        response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Import database module based on environment
USE_SUPABASE = os.getenv('USE_SUPABASE', 'false').lower() == 'true'

if USE_SUPABASE:
    print("🚀 Using Supabase database")
    import database_supabase as db
else:
    print("💾 Using SQLite database")
    import database as db

# Health check route
@app.route('/')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AgentPay Economy API',
        'database': 'supabase' if USE_SUPABASE else 'sqlite',
        'version': '1.0.0'
    })

@app.route('/api/health')
def api_health():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'database': 'connected'
    })

def format_agent(agent_row: Dict) -> Dict:
    """Format agent from database to API format"""
    categories = agent_row.get('categories', [])
    if isinstance(categories, str):
        try:
            import json
            categories = json.loads(categories)
        except:
            categories = []

    return {
        'id': str(agent_row['id']),
        'name': agent_row['name'],
        'displayName': agent_row['display_name'],
        'type': agent_row['type'],
        'balance': agent_row['balance'],
        'hold': agent_row.get('hold', 0),
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
    consensus_result = tx_row.get('consensus_result')
    if isinstance(consensus_result, str):
        try:
            import json
            consensus_result = json.loads(consensus_result)
        except:
            pass

    return {
        'id': str(tx_row['id']),
        'type': tx_row['type'],
        'fromAgentId': str(tx_row['from_agent_id']) if tx_row['from_agent_id'] else None,
        'fromAgentName': tx_row['from_agent_name'],
        'toAgentId': str(tx_row['to_agent_id']) if tx_row['to_agent_id'] else None,
        'toAgentName': tx_row['to_agent_name'],
        'amount': tx_row['amount'],
        'purpose': tx_row['purpose'],
        'memo': tx_row.get('memo'),
        'status': tx_row['status'],
        'consensusRequired': bool(tx_row.get('consensus_required', False)),
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

    try:
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        # Verify credentials
        if USE_SUPABASE:
            user = db.verify_user_credentials(username, password_hash)
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user_row = cursor.fetchone()
            conn.close()

            if not user_row:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

            user = dict(user_row)
            if user['password_hash'] != password_hash:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        if not user:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        # Set session
        session['user_id'] = str(user['id'])
        session['username'] = user['username']

        return jsonify({
            'success': True,
            'user': {
                'id': str(user['id']),
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
        if USE_SUPABASE:
            # Get user from Supabase
            client = db.get_supabase_client()
            result = client.table('users').select('*').eq('id', session['user_id']).execute()
            user = result.data[0] if result.data else None
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],))
            user_row = cursor.fetchone()
            conn.close()
            user = dict(user_row) if user_row else None

        if not user:
            return jsonify({'authenticated': False}), 401

        return jsonify({
            'authenticated': True,
            'user': {
                'id': str(user['id']),
                'username': user['username'],
                'email': user.get('email')
            }
        })
    except Exception as e:
        return jsonify({'authenticated': False, 'error': str(e)}), 500

# Economy Stats
@app.route('/api/economy/stats', methods=['GET'])
def get_economy_stats():
    """Get overall economy statistics"""
    time_range = request.args.get('timeRange', '7d')

    try:
        if USE_SUPABASE:
            stats = db.get_economy_stats(time_range)
        else:
            # Calculate stats from SQLite
            transactions = db.get_transactions(filters={'time_range': time_range})
            agents = db.get_agents(filters={'status': 'active'})

            total_volume = sum(tx['amount'] for tx in transactions)
            total_spending = sum(tx['amount'] for tx in transactions if tx['type'] in ['payment', 'escrow', 'stream'])

            stats = {
                'totalVolume': total_volume,
                'totalSpending': total_spending,
                'totalRevenue': total_spending,
                'activeAgents': len(agents),
                'totalTransactions': len(transactions)
            }

        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# Agents
@app.route('/api/agents', methods=['GET'])
def get_all_agents():
    """Get all agents"""
    try:
        agents = db.get_agents()
        return jsonify({
            'success': True,
            'agents': [format_agent(a) for a in agents]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/agents/<agent_id>', methods=['GET'])
def get_agent_by_id(agent_id):
    """Get agent by ID"""
    try:
        agent = db.get_agent(agent_id)
        if not agent:
            return jsonify({'success': False, 'error': 'Agent not found'}), 404

        return jsonify({
            'success': True,
            'agent': format_agent(agent)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/agents/top/spenders', methods=['GET'])
def get_top_spenders():
    """Get top spending agents"""
    limit = int(request.args.get('limit', 10))
    time_range = request.args.get('timeRange', '7d')

    try:
        if USE_SUPABASE:
            agents = db.get_top_spenders(limit, time_range)
        else:
            agents = db.get_agents(filters={'type': 'spender'})
            agents.extend(db.get_agents(filters={'type': 'both'}))
            agents = sorted(agents, key=lambda x: x['total_spent'], reverse=True)[:limit]

        return jsonify({
            'success': True,
            'agents': [format_agent(a) for a in agents]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/agents/top/earners', methods=['GET'])
def get_top_earners():
    """Get top earning agents"""
    limit = int(request.args.get('limit', 10))
    time_range = request.args.get('timeRange', '7d')

    try:
        if USE_SUPABASE:
            agents = db.get_top_earners(limit, time_range)
        else:
            agents = db.get_agents(filters={'type': 'earner'})
            agents.extend(db.get_agents(filters={'type': 'both'}))
            agents = sorted(agents, key=lambda x: x['total_earned'], reverse=True)[:limit]

        return jsonify({
            'success': True,
            'agents': [format_agent(a) for a in agents]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Transactions
@app.route('/api/transactions', methods=['GET'])
def get_all_transactions():
    """Get all transactions with optional filters"""
    limit = request.args.get('limit', type=int)
    agent_id = request.args.get('agentId')
    status = request.args.get('status')
    time_range = request.args.get('timeRange')

    try:
        filters = {}
        if agent_id:
            filters['agent_id'] = agent_id
        if status:
            filters['status'] = status
        if time_range:
            filters['time_range'] = time_range

        transactions = db.get_transactions(filters=filters, limit=limit)

        return jsonify({
            'success': True,
            'transactions': [format_transaction(tx) for tx in transactions]
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/agents/<agent_id>/transactions', methods=['GET'])
def get_agent_transactions(agent_id):
    """Get transactions for a specific agent"""
    try:
        print(f"🔍 Fetching transactions for agent: {agent_id}")
        transactions = db.get_transactions(filters={'agent_id': agent_id})
        print(f"✅ Found {len(transactions)} transactions")

        return jsonify({
            'success': True,
            'transactions': [format_transaction(tx) for tx in transactions]
        })
    except Exception as e:
        print(f"❌ Error fetching agent transactions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/agents/<agent_id>/cards', methods=['GET'])
def get_agent_cards(agent_id):
    """Get virtual cards for a specific agent"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        if USE_SUPABASE:
            cards = db.get_virtual_cards(user_id=session['user_id'], agent_id=agent_id)
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM virtual_cards 
                WHERE user_id = ? AND agent_id = ? 
                ORDER BY created_at DESC
            ''', (session['user_id'], agent_id))
            rows = cursor.fetchall()
            conn.close()
            cards = [dict(row) for row in rows]
        
        return jsonify({
            'success': True,
            'cards': cards
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/cards', methods=['GET'])
def get_user_cards():
    """Get all virtual cards for the current user"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        if USE_SUPABASE:
            cards = db.get_virtual_cards(user_id=session['user_id'])
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM virtual_cards 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            ''', (session['user_id'],))
            rows = cursor.fetchall()
            conn.close()
            cards = [dict(row) for row in rows]
        
        return jsonify({
            'success': True,
            'cards': cards
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Additional convenience endpoints for frontend compatibility
@app.route('/api/virtual-cards', methods=['GET'])
def get_all_virtual_cards():
    """Get all virtual cards (public endpoint for stats)"""
    try:
        if USE_SUPABASE:
            client = db.get_supabase_client()
            result = client.table('virtual_cards').select('*').order('created_at', desc=True).limit(1000).execute()
            cards = result.data
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM virtual_cards ORDER BY created_at DESC LIMIT 1000')
            rows = cursor.fetchall()
            conn.close()
            cards = [dict(row) for row in rows]
        
        return jsonify({
            'success': True,
            'cards': cards
        })
    except Exception as e:
        print(f"❌ Error fetching virtual cards: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/economy/top-spenders', methods=['GET'])
def get_economy_top_spenders():
    """Alias for /api/agents/top/spenders"""
    return get_top_spenders()

@app.route('/api/economy/top-earners', methods=['GET'])
def get_economy_top_earners():
    """Alias for /api/agents/top/earners"""
    return get_top_earners()

@app.route('/api/economy/recent', methods=['GET'])
def get_recent_transactions():
    """Get recent transactions"""
    limit = int(request.args.get('limit', 10))
    try:
        transactions = db.get_transactions(limit=limit)
        return jsonify({
            'success': True,
            'transactions': [format_transaction(tx) for tx in transactions]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# API Keys Management
@app.route('/api/keys', methods=['GET'])
def get_api_keys():
    """Get all API keys for the current user"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        if USE_SUPABASE:
            client = db.get_supabase_client()
            result = client.table('api_keys').select('id, key_name, key_hash, last_used_at, created_at').eq('user_id', session['user_id']).execute()
            keys = result.data
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT id, key_name, key_hash, last_used_at, created_at FROM api_keys WHERE user_id = ?', (session['user_id'],))
            rows = cursor.fetchall()
            conn.close()
            keys = [dict(row) for row in rows]

        # Mask the keys for security
        for key in keys:
            if key['key_hash']:
                # Show first 8 and last 4 characters
                full_key = key['key_hash']
                if len(full_key) > 12:
                    key['masked_key'] = full_key[:8] + '•' * (len(full_key) - 12) + full_key[-4:]
                else:
                    key['masked_key'] = '•' * len(full_key)

        return jsonify({
            'success': True,
            'keys': keys
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/keys', methods=['POST'])
def create_api_key():
    """Create a new API key"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    data = request.json
    key_name = data.get('name')

    if not key_name:
        return jsonify({'success': False, 'error': 'Key name required'}), 400

    try:
        # Generate a secure API key
        import secrets as sec
        api_key = 'sk_' + ('live_' if data.get('type') == 'live' else 'test_') + sec.token_hex(20)

        if USE_SUPABASE:
            client = db.get_supabase_client()
            result = client.table('api_keys').insert({
                'user_id': session['user_id'],
                'key_name': key_name,
                'key_hash': api_key  # In production, store only the hash
            }).execute()

            key_data = result.data[0] if result.data else None
        else:
            import uuid
            conn = db.get_db_connection()
            cursor = conn.cursor()
            key_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO api_keys (id, user_id, key_name, key_hash, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (key_id, session['user_id'], key_name, api_key, datetime.now().isoformat() + 'Z'))
            conn.commit()
            conn.close()

            key_data = {
                'id': key_id,
                'key_name': key_name,
                'created_at': datetime.now().isoformat() + 'Z'
            }

        return jsonify({
            'success': True,
            'key': key_data,
            'api_key': api_key  # Return the full key ONLY on creation
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/keys/<key_id>', methods=['DELETE'])
def delete_api_key(key_id):
    """Delete an API key"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401

    try:
        if USE_SUPABASE:
            client = db.get_supabase_client()
            client.table('api_keys').delete().eq('id', key_id).eq('user_id', session['user_id']).execute()
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM api_keys WHERE id = ? AND user_id = ?', (key_id, session['user_id']))
            conn.commit()
            conn.close()

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# SDK Endpoints (require API key authentication)
@app.route('/api/sdk/ping', methods=['GET'])
@require_api_key
def sdk_ping():
    """Test endpoint to verify SDK authentication"""
    key_info = get_api_key_info()
    return jsonify({
        'success': True,
        'message': 'Authentication successful',
        'authenticated_as': {
            'user_id': key_info['user_id'],
            'key_name': key_info['key_name']
        }
    })

@app.route('/api/sdk/cards/request', methods=['POST'])
@require_api_key
def request_payment_card():
    """
    Request a virtual card with quorum approval
    Triggers the full approval flow
    """
    from approval_flow import submit_for_approval_sync
    
    key_info = get_api_key_info()
    data = request.json
    
    # Validate required fields
    required_fields = ['amount', 'purpose', 'justification']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    try:
        # Submit for approval (runs consensus)
        result = submit_for_approval_sync(
            agent_id=data.get('agent_id', 'sdk-agent'),
            user_id=key_info['user_id'],
            amount=data['amount'],
            purpose=data['purpose'],
            justification=data['justification'],
            expected_roi=data.get('expected_roi'),
            urgency=data.get('urgency', 'Medium'),
            budget_remaining=data.get('budget_remaining')
        )
        
        if result.get('approved'):
            return jsonify({
                'success': True,
                'approved': True,
                'card': result.get('card'),
                'transaction_id': result.get('transaction_id'),
                'consensus_result': result.get('consensus_result')
            })
        else:
            return jsonify({
                'success': True,
                'approved': False,
                'denial_reason': result.get('denial_reason'),
                'transaction_id': result.get('transaction_id'),
                'consensus_result': result.get('consensus_result')
            })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sdk/cards/<card_id>', methods=['GET'])
@require_api_key
def get_card_details(card_id):
    """Get details of a virtual card"""
    key_info = get_api_key_info()
    
    try:
        if USE_SUPABASE:
            client = db.get_supabase_client()
            result = client.table('virtual_cards').select('*').eq('id', card_id).eq('user_id', key_info['user_id']).execute()
            card = result.data[0] if result.data else None
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM virtual_cards WHERE id = ? AND user_id = ?', (card_id, key_info['user_id']))
            row = cursor.fetchone()
            conn.close()
            card = dict(row) if row else None
        
        if not card:
            return jsonify({'success': False, 'error': 'Card not found'}), 404
        
        return jsonify({
            'success': True,
            'card': card
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sdk/cards/<card_id>/cancel', methods=['POST'])
@require_api_key
def cancel_card(card_id):
    """Cancel a virtual card"""
    key_info = get_api_key_info()
    
    try:
        if USE_SUPABASE:
            client = db.get_supabase_client()
            # Verify ownership
            result = client.table('virtual_cards').select('*').eq('id', card_id).eq('user_id', key_info['user_id']).execute()
            if not result.data:
                return jsonify({'success': False, 'error': 'Card not found'}), 404
            
            # Update status
            client.table('virtual_cards').update({'status': 'cancelled'}).eq('id', card_id).execute()
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM virtual_cards WHERE id = ? AND user_id = ?', (card_id, key_info['user_id']))
            if not cursor.fetchone():
                conn.close()
                return jsonify({'success': False, 'error': 'Card not found'}), 404
            
            cursor.execute('UPDATE virtual_cards SET status = ? WHERE id = ?', ('cancelled', card_id))
            conn.commit()
            conn.close()
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Mock Merchant Endpoint
@app.route('/api/mock-merchant/charge', methods=['POST'])
def mock_merchant_charge():
    """
    Mock merchant endpoint for testing virtual card charges
    Validates card and processes charge
    """
    from card_generator import validate_luhn
    from datetime import datetime
    
    data = request.json
    
    # Validate required fields
    required = ['card_number', 'cvv', 'expiry_date', 'amount', 'merchant_name']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    card_number = data['card_number']
    cvv = data['cvv']
    expiry_date = data['expiry_date']
    amount = data['amount']
    merchant_name = data['merchant_name']
    
    try:
        # Step 1: Validate Luhn algorithm
        if not validate_luhn(card_number):
            return jsonify({
                'success': False,
                'error': 'Invalid card number (Luhn check failed)'
            }), 400
        
        # Step 2: Find card in database
        if USE_SUPABASE:
            client = db.get_supabase_client()
            result = client.table('virtual_cards').select('*').eq('card_number', card_number).execute()
            card = result.data[0] if result.data else None
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM virtual_cards WHERE card_number = ?', (card_number,))
            row = cursor.fetchone()
            card = dict(row) if row else None
            conn.close()
        
        if not card:
            return jsonify({
                'success': False,
                'error': 'Card not found'
            }), 404
        
        # Step 3: Validate CVV
        if card['cvv'] != cvv:
            return jsonify({
                'success': False,
                'error': 'Invalid CVV'
            }), 400
        
        # Step 4: Check card status
        if card['status'] != 'active':
            return jsonify({
                'success': False,
                'error': f'Card is {card["status"]}'
            }), 400
        
        # Step 5: Check expiry
        expires_at = datetime.fromisoformat(card['expires_at'].replace('Z', '+00:00'))
        now = datetime.now(expires_at.tzinfo)
        
        if now > expires_at:
            # Auto-expire the card
            if USE_SUPABASE:
                client.table('virtual_cards').update({'status': 'expired'}).eq('id', card['id']).execute()
            else:
                conn = db.get_db_connection()
                cursor = conn.cursor()
                cursor.execute('UPDATE virtual_cards SET status = ? WHERE id = ?', ('expired', card['id']))
                conn.commit()
                conn.close()
            
            return jsonify({
                'success': False,
                'error': 'Card has expired'
            }), 400
        
        # Step 6: Check amount limit
        if amount > card['amount_limit']:
            return jsonify({
                'success': False,
                'error': f'Amount ${amount/100:.2f} exceeds card limit ${card["amount_limit"]/100:.2f}'
            }), 400
        
        # Step 7: Process charge - mark card as used
        used_at = datetime.now().isoformat() + 'Z'
        
        if USE_SUPABASE:
            client.table('virtual_cards').update({
                'status': 'used',
                'used_at': used_at
            }).eq('id', card['id']).execute()
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE virtual_cards 
                SET status = ?, used_at = ?
                WHERE id = ?
            ''', ('used', used_at, card['id']))
            conn.commit()
            conn.close()
        
        # Step 8: Create transaction record and update agent stats
        transaction_data = {
            'type': 'payment',  # Changed from 'card_charge' to 'payment'
            'from_agent_id': None,  # Will be updated if agent exists in DB
            'from_agent_name': card['agent_id'],
            'to_agent_id': None,
            'to_agent_name': merchant_name,
            'amount': amount,
            'purpose': f"Card charge at {merchant_name}",
            'memo': f"Card {card_number[-4:]} - {card['purpose']}",
            'status': 'completed',
            'consensus_required': False
        }
        
        if USE_SUPABASE:
            # Try to find agent by name to get UUID
            try:
                agent_result = client.table('agents').select('id, total_spent, transaction_count').eq('name', card['agent_id']).execute()
                if agent_result.data and len(agent_result.data) > 0:
                    agent = agent_result.data[0]
                    transaction_data['from_agent_id'] = agent['id']
                    
                    # Update agent statistics
                    new_total_spent = agent['total_spent'] + amount
                    new_transaction_count = agent['transaction_count'] + 1
                    
                    client.table('agents').update({
                        'total_spent': new_total_spent,
                        'transaction_count': new_transaction_count,
                        'avg_transaction_size': new_total_spent // new_transaction_count if new_transaction_count > 0 else 0
                    }).eq('id', agent['id']).execute()
                    
                    print(f"   ✓ Updated agent stats: {card['agent_id']} (spent: ${new_total_spent/100:.2f}, txs: {new_transaction_count})")
            except Exception as e:
                print(f"   Warning: Failed to update agent stats: {e}")
            
            tx_result = client.table('transactions').insert(transaction_data).execute()
            transaction_id = tx_result.data[0]['id'] if tx_result.data else None
        else:
            import uuid
            transaction_id = str(uuid.uuid4())
            transaction_data['id'] = transaction_id
            transaction_data['timestamp'] = datetime.now().isoformat() + 'Z'
            
            conn = db.get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO transactions (
                    id, type, from_agent_id, from_agent_name,
                    to_agent_id, to_agent_name, amount, purpose,
                    memo, status, consensus_required, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                transaction_data['id'], transaction_data['type'],
                transaction_data['from_agent_id'], transaction_data['from_agent_name'],
                transaction_data['to_agent_id'], transaction_data['to_agent_name'],
                transaction_data['amount'], transaction_data['purpose'],
                transaction_data['memo'], transaction_data['status'],
                0, transaction_data['timestamp']
            ))
            conn.commit()
            conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Charge successful',
            'transaction_id': transaction_id,
            'merchant': merchant_name,
            'amount': amount,
            'card_last_4': card_number[-4:]
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
