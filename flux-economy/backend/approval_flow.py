"""
Approval Flow Module
Integrates with AgentConsensusSystem for payment approvals
Handles the full approval workflow from submission to card generation
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, Optional
import os
from concensus import AgentConsensusSystem
from card_generator import create_virtual_card

# Import database module based on environment
USE_SUPABASE = os.getenv('USE_SUPABASE', 'false').lower() == 'true'

if USE_SUPABASE:
    import database_supabase as db
else:
    import database as db


def get_or_create_agent(agent_id: str, user_id: str, display_name: str = None) -> Optional[Dict]:
    """
    Get existing agent or create new one if it doesn't exist.
    Links agent to the user who owns the API key.
    
    Args:
        agent_id: Unique identifier for the agent (e.g., "marketing-agent-001")
        user_id: UUID of the user who owns this agent
        display_name: Optional display name for the agent
        
    Returns:
        Agent data dictionary or None if failed
    """
    if USE_SUPABASE:
        client = db.get_supabase_client()
        
        try:
            # First, try to find existing agent by name
            result = client.table('agents').select('*').eq('name', agent_id).execute()
            
            if result.data and len(result.data) > 0:
                print(f"   ✓ Found existing agent: {agent_id}")
                return result.data[0]
            
            # Agent doesn't exist, create new one
            print(f"   ℹ️  Creating new agent: {agent_id}")
            
            agent_data = {
                'name': agent_id,
                'display_name': display_name or agent_id.replace('-', ' ').replace('_', ' ').title(),
                'type': 'spender',  # SDK agents are typically spenders
                'balance': 0,
                'hold': 0,
                'total_spent': 0,
                'total_earned': 0,
                'transaction_count': 0,
                'avg_transaction_size': 0,
                'status': 'active',
                'categories': ['SDK', 'Autonomous']
            }
            
            create_result = client.table('agents').insert(agent_data).execute()
            
            if create_result.data and len(create_result.data) > 0:
                new_agent = create_result.data[0]
                print(f"   ✓ Created new agent: {new_agent['id']} ({agent_id})")
                return new_agent
            else:
                print(f"   ✗ Failed to create agent: {create_result}")
                return None
                
        except Exception as e:
            print(f"   ✗ Error getting/creating agent: {e}")
            import traceback
            traceback.print_exc()
            return None
    else:
        # SQLite implementation (optional)
        return None


class ApprovalFlow:
    """
    Manages the complete approval workflow for agent payment requests
    """
    
    def __init__(self):
        self.consensus_system = AgentConsensusSystem()
    
    async def submit_for_approval(
        self,
        agent_id: str,
        user_id: str,
        amount: int,
        purpose: str,
        justification: str,
        expected_roi: Optional[str] = None,
        urgency: str = "Medium",
        budget_remaining: Optional[int] = None
    ) -> Dict:
        """
        Submit a payment request for quorum approval
        
        Args:
            agent_id: ID of the agent making the request
            user_id: ID of the user who owns the agent
            amount: Amount requested (in cents)
            purpose: What the money is for
            justification: Detailed explanation
            expected_roi: Expected return on investment
            urgency: "Low", "Medium", or "High"
            budget_remaining: Optional budget context
        
        Returns:
            Dict containing:
                - approved: bool
                - card: Optional[Dict] - card details if approved
                - consensus_result: Dict - full voting results
                - transaction_id: str - transaction record ID
                - denial_reason: Optional[str] - if denied
        """
        
        print(f"\n🔄 Starting approval flow for {agent_id}")
        print(f"   Amount: ${amount / 100:.2f}")
        print(f"   Purpose: {purpose}")
        
        # Step 1: Get or create agent in database
        agent = get_or_create_agent(agent_id, user_id, display_name=f"{agent_id.replace('-', ' ').replace('_', ' ').title()}")
        
        if not agent:
            return {
                'approved': False,
                'card': None,
                'consensus_result': None,
                'error': 'Failed to get or create agent in database'
            }
        
        agent_uuid = agent['id']  # Get the actual UUID
        
        # Step 2: Create pending transaction record
        transaction_data = {
            'type': 'payment',
            'from_agent_id': agent_uuid,  # Use UUID instead of None
            'from_agent_name': agent_id,
            'to_agent_id': None,
            'to_agent_name': purpose,
            'amount': amount,
            'purpose': purpose,
            'memo': justification,
            'status': 'pending',
            'consensus_required': True,
            'consensus_result': None
        }
        
        try:
            if USE_SUPABASE:
                client = db.get_supabase_client()
                tx_result = client.table('transactions').insert(transaction_data).execute()
                transaction = tx_result.data[0] if tx_result.data else None
            else:
                import uuid
                transaction_data['id'] = str(uuid.uuid4())
                transaction_data['timestamp'] = datetime.now().isoformat() + 'Z'
                conn = db.get_db_connection()
                cursor = conn.cursor()
                
                # Convert consensus_result to JSON string if it's a dict
                consensus_json = None
                
                cursor.execute('''
                    INSERT INTO transactions (
                        id, type, from_agent_id, from_agent_name,
                        to_agent_id, to_agent_name, amount, purpose,
                        memo, status, consensus_required, consensus_result, timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    transaction_data['id'], transaction_data['type'],
                    transaction_data['from_agent_id'], transaction_data['from_agent_name'],
                    transaction_data['to_agent_id'], transaction_data['to_agent_name'],
                    transaction_data['amount'], transaction_data['purpose'],
                    transaction_data['memo'], transaction_data['status'],
                    1 if transaction_data['consensus_required'] else 0,
                    consensus_json, transaction_data['timestamp']
                ))
                conn.commit()
                conn.close()
                transaction = transaction_data
            
            transaction_id = transaction['id']
            print(f"   ✓ Created transaction record: {transaction_id}")
            
        except Exception as e:
            print(f"   ✗ Failed to create transaction: {e}")
            return {
                'approved': False,
                'error': f"Failed to create transaction: {str(e)}"
            }
        
        # Step 2: Submit to consensus system
        purchase_request = {
            'amount': amount / 100,  # Convert cents to dollars for readability
            'purpose': purpose,
            'requesting_agent': agent_id,
            'justification': justification,
            'expected_roi': expected_roi or 'Not specified',
            'urgency': urgency,
            'budget_remaining': budget_remaining or 'Unknown'
        }
        
        try:
            print(f"   📊 Submitting to quorum consensus...")
            consensus_result = await self.consensus_system.evaluate_purchase(purchase_request)
            
        except Exception as e:
            print(f"   ✗ Consensus evaluation failed: {e}")
            # Update transaction to failed
            self._update_transaction_status(
                transaction_id,
                'failed',
                {'error': str(e)}
            )
            return {
                'approved': False,
                'error': f"Consensus evaluation failed: {str(e)}",
                'transaction_id': transaction_id
            }
        
        # Step 3: Process consensus result
        approved = consensus_result['approved']
        
        if approved:
            print(f"   ✅ Request approved ({consensus_result['yes_votes']}/{len(consensus_result['agent_votes'])} votes)")
            
            # Generate virtual card
            try:
                card_data = create_virtual_card(
                    agent_id=agent_id,
                    user_id=user_id,
                    amount_limit=amount,
                    purpose=purpose
                )
                
                # Save card to database
                card_id = self._save_card(card_data)
                print(f"   💳 Generated virtual card: {card_id}")
                
                # Update transaction
                self._update_transaction_status(
                    transaction_id,
                    'completed',  # Changed from 'approved' to 'completed'
                    consensus_result,
                    card_id=card_id
                )
                
                return {
                    'approved': True,
                    'card': card_data,
                    'consensus_result': consensus_result,
                    'transaction_id': transaction_id,
                    'card_id': card_id,
                    'agent': agent  # Return agent data
                }
                
            except Exception as e:
                print(f"   ✗ Failed to generate card: {e}")
                self._update_transaction_status(
                    transaction_id,
                    'failed',
                    consensus_result
                )
                return {
                    'approved': True,  # Was approved, but card generation failed
                    'error': f"Card generation failed: {str(e)}",
                    'consensus_result': consensus_result,
                    'transaction_id': transaction_id,
                    'agent': agent
                }
        else:
            print(f"   ❌ Request denied ({consensus_result['no_votes']}/{len(consensus_result['agent_votes'])} votes)")
            
            # Compile denial reasoning
            denial_reasons = [
                f"{vote['agent_name']}: {vote['reasoning']}"
                for vote in consensus_result['agent_votes']
                if vote['vote'] == 'NO'
            ]
            denial_reason = " | ".join(denial_reasons)
            
            # Update transaction
            self._update_transaction_status(
                transaction_id,
                'denied',
                consensus_result
            )
            
            return {
                'approved': False,
                'consensus_result': consensus_result,
                'transaction_id': transaction_id,
                'denial_reason': denial_reason,
                'agent': agent
            }
    
    def _save_card(self, card_data: Dict) -> str:
        """Save virtual card to database"""
        import json
        
        if USE_SUPABASE:
            client = db.get_supabase_client()
            result = client.table('virtual_cards').insert(card_data).execute()
            return result.data[0]['id'] if result.data else None
        else:
            conn = db.get_db_connection()
            cursor = conn.cursor()
            
            # Ensure table exists
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS virtual_cards (
                    id TEXT PRIMARY KEY,
                    card_number TEXT NOT NULL,
                    cvv TEXT NOT NULL,
                    expiry_date TEXT NOT NULL,
                    card_holder_name TEXT NOT NULL,
                    agent_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    amount_limit INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    purpose TEXT,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    used_at TEXT,
                    transaction_id TEXT
                )
            ''')
            
            cursor.execute('''
                INSERT INTO virtual_cards (
                    id, card_number, cvv, expiry_date, card_holder_name,
                    agent_id, user_id, amount_limit, status, purpose,
                    created_at, expires_at, used_at, transaction_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                card_data['id'],
                card_data['card_number'],
                card_data['cvv'],
                card_data['expiry_date'],
                card_data['card_holder_name'],
                card_data['agent_id'],
                card_data['user_id'],
                card_data['amount_limit'],
                card_data['status'],
                card_data.get('purpose', ''),
                card_data['created_at'],
                card_data['expires_at'],
                card_data.get('used_at'),
                card_data.get('transaction_id')
            ))
            
            conn.commit()
            conn.close()
            return card_data['id']
    
    def _update_transaction_status(
        self,
        transaction_id: str,
        status: str,
        consensus_result: Optional[Dict] = None,
        card_id: Optional[str] = None
    ):
        """Update transaction status and consensus result"""
        import json
        
        try:
            if USE_SUPABASE:
                client = db.get_supabase_client()
                update_data = {'status': status}
                
                if consensus_result:
                    update_data['consensus_result'] = consensus_result
                
                if card_id:
                    # Store card_id in memo for now (can add dedicated field later)
                    update_data['memo'] = f"card_id:{card_id}"
                
                client.table('transactions').update(update_data).eq('id', transaction_id).execute()
                
            else:
                conn = db.get_db_connection()
                cursor = conn.cursor()
                
                consensus_json = json.dumps(consensus_result) if consensus_result else None
                
                if card_id:
                    cursor.execute('''
                        UPDATE transactions
                        SET status = ?, consensus_result = ?, memo = ?
                        WHERE id = ?
                    ''', (status, consensus_json, f"card_id:{card_id}", transaction_id))
                else:
                    cursor.execute('''
                        UPDATE transactions
                        SET status = ?, consensus_result = ?
                        WHERE id = ?
                    ''', (status, consensus_json, transaction_id))
                
                conn.commit()
                conn.close()
                
        except Exception as e:
            print(f"Warning: Failed to update transaction status: {e}")


# Synchronous wrapper for use in Flask endpoints
def submit_for_approval_sync(
    agent_id: str,
    user_id: str,
    amount: int,
    purpose: str,
    justification: str,
    expected_roi: Optional[str] = None,
    urgency: str = "Medium",
    budget_remaining: Optional[int] = None
) -> Dict:
    """
    Synchronous wrapper for submit_for_approval
    Use this in Flask endpoints
    """
    flow = ApprovalFlow()
    
    # Run async function in new event loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(
        flow.submit_for_approval(
            agent_id=agent_id,
            user_id=user_id,
            amount=amount,
            purpose=purpose,
            justification=justification,
            expected_roi=expected_roi,
            urgency=urgency,
            budget_remaining=budget_remaining
        )
    )
    
    return result


# Test function
async def test_approval_flow():
    """Test the approval flow with a sample request"""
    flow = ApprovalFlow()
    
    # Test with a reasonable request (should approve)
    result = await flow.submit_for_approval(
        agent_id="test-marketing-agent",
        user_id="test-user-001",
        amount=10000,  # $100
        purpose="OpenAI API Credits",
        justification="Need GPT-4 to generate ad copy for Q4 campaign. Current manual copywriting costs $500/week.",
        expected_roi="Expected $5K revenue from improved ad performance",
        urgency="High",
        budget_remaining=50000
    )
    
    print("\n" + "="*60)
    print("APPROVAL FLOW TEST RESULT")
    print("="*60)
    print(f"Approved: {result.get('approved')}")
    
    if result.get('approved') and result.get('card'):
        card = result['card']
        print(f"\n💳 Virtual Card Generated:")
        print(f"   Card Number: {card['card_number']}")
        print(f"   CVV: {card['cvv']}")
        print(f"   Expiry: {card['expiry_date']}")
        print(f"   Limit: ${card['amount_limit'] / 100:.2f}")
        print(f"   Expires At: {card['expires_at']}")
    elif not result.get('approved'):
        print(f"\n❌ Denial Reason: {result.get('denial_reason', 'Unknown')}")
    
    print(f"\nTransaction ID: {result.get('transaction_id')}")
    print("="*60)


if __name__ == "__main__":
    # Run test
    asyncio.run(test_approval_flow())
