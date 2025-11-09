"""
Authentication middleware for AgentPay SDK API endpoints
Validates API keys from Authorization header
"""

from functools import wraps
from flask import request, jsonify
import os

# Import database module based on environment
USE_SUPABASE = os.getenv('USE_SUPABASE', 'false').lower() == 'true'

if USE_SUPABASE:
    import database_supabase as db
else:
    import database as db


def require_api_key(f):
    """
    Decorator to require valid API key for SDK endpoints
    Expects Authorization header with format: Bearer sk_test_xxx or Bearer sk_live_xxx
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get authorization header
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Missing Authorization header',
                'message': 'API key required. Format: Authorization: Bearer sk_test_xxx'
            }), 401

        # Parse Bearer token
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({
                'success': False,
                'error': 'Invalid Authorization header format',
                'message': 'Expected format: Authorization: Bearer sk_test_xxx'
            }), 401

        api_key = parts[1]

        # Validate API key format
        if not api_key.startswith('sk_'):
            return jsonify({
                'success': False,
                'error': 'Invalid API key format',
                'message': 'API key must start with sk_test_ or sk_live_'
            }), 401

        try:
            # Lookup API key in database
            if USE_SUPABASE:
                client = db.get_supabase_client()
                result = client.table('api_keys').select('*').eq('key_hash', api_key).execute()
                key_record = result.data[0] if result.data else None
            else:
                conn = db.get_db_connection()
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM api_keys WHERE key_hash = ?', (api_key,))
                row = cursor.fetchone()
                key_record = dict(row) if row else None
                conn.close()

            if not key_record:
                return jsonify({
                    'success': False,
                    'error': 'Invalid API key',
                    'message': 'API key not found or has been revoked'
                }), 401

            # Update last_used_at timestamp
            from datetime import datetime
            now = datetime.now().isoformat() + 'Z'

            if USE_SUPABASE:
                client.table('api_keys').update({
                    'last_used_at': now
                }).eq('id', key_record['id']).execute()
            else:
                conn = db.get_db_connection()
                cursor = conn.cursor()
                cursor.execute('UPDATE api_keys SET last_used_at = ? WHERE id = ?',
                             (now, key_record['id']))
                conn.commit()
                conn.close()

            # Attach user_id and api_key_id to request for use in endpoint
            request.api_key_user_id = key_record['user_id']
            request.api_key_id = key_record['id']
            request.api_key_name = key_record['key_name']

            # Call the actual endpoint
            return f(*args, **kwargs)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': 'Authentication error',
                'message': str(e)
            }), 500

    return decorated_function


def get_authenticated_user():
    """
    Get the user_id associated with the current API key
    Should only be called within endpoints decorated with @require_api_key
    """
    return getattr(request, 'api_key_user_id', None)


def get_api_key_info():
    """
    Get information about the current API key
    Returns dict with user_id, api_key_id, and key_name
    """
    return {
        'user_id': getattr(request, 'api_key_user_id', None),
        'api_key_id': getattr(request, 'api_key_id', None),
        'key_name': getattr(request, 'api_key_name', None)
    }
