"""
Virtual Card Generation Module
Generates one-time virtual cards with Luhn-valid card numbers
"""

import random
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
import uuid


def luhn_checksum(card_number: str) -> int:
    """Calculate Luhn checksum for a card number"""
    def digits_of(n):
        return [int(d) for d in str(n)]
    
    digits = digits_of(card_number)
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    
    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(digits_of(d * 2))
    
    return checksum % 10


def generate_card_number() -> str:
    """
    Generate a valid 16-digit test card number using Luhn algorithm
    Uses test BIN 4242 42 (commonly used for test cards)
    """
    # Start with test BIN (Bank Identification Number)
    # 4242 42 is a common test BIN (6 digits)
    bin_prefix = "424242"
    
    # Generate 9 random digits for the middle part
    middle_digits = ''.join([str(random.randint(0, 9)) for _ in range(9)])
    
    # Combine (15 digits so far)
    partial_number = bin_prefix + middle_digits
    
    # Calculate check digit using Luhn algorithm
    checksum = luhn_checksum(partial_number + "0")
    check_digit = (10 - checksum) % 10
    
    # Complete 16-digit card number
    card_number = partial_number + str(check_digit)
    
    return card_number


def generate_cvv() -> str:
    """Generate a random 3-digit CVV"""
    return f"{random.randint(0, 999):03d}"


def generate_expiry() -> str:
    """
    Generate expiry date in MM/YY format
    Set to current month + 1 year
    """
    now = datetime.now()
    expiry_date = now.replace(year=now.year + 1)
    return expiry_date.strftime("%m/%y")


def create_virtual_card(
    agent_id: str,
    user_id: str,
    amount_limit: int,
    purpose: str,
    card_holder_name: Optional[str] = None
) -> Dict:
    """
    Create a complete virtual card with all details
    
    Args:
        agent_id: ID of the agent requesting the card
        user_id: ID of the user who owns the agent
        amount_limit: Maximum amount that can be charged (in cents)
        purpose: Purpose of the card (e.g., "OpenAI API Credits")
        card_holder_name: Name on the card (defaults to "AGENTPAY USER")
    
    Returns:
        Dict with complete card details
    """
    card_id = str(uuid.uuid4())
    # Set timestamps
    created_at = datetime.now(timezone.utc)
    expires_at = created_at + timedelta(hours=24)  # 24-hour expiry for testing
    
    card_data = {
        'id': card_id,
        'card_number': generate_card_number(),
        'cvv': generate_cvv(),
        'expiry_date': generate_expiry(),
        'card_holder_name': card_holder_name or "AGENTPAY USER",
        'agent_id': agent_id,
        'user_id': user_id,
        'amount_limit': amount_limit,
        'status': 'active',
        'purpose': purpose,
        'created_at': created_at.isoformat().replace('+00:00', 'Z'),
        'expires_at': expires_at.isoformat().replace('+00:00', 'Z'),
        'used_at': None,
        'transaction_id': None
    }
    
    return card_data


def validate_luhn(card_number: str) -> bool:
    """
    Validate a card number using Luhn algorithm
    
    Args:
        card_number: 16-digit card number as string
    
    Returns:
        True if valid, False otherwise
    """
    try:
        # Remove spaces and dashes
        card_number = card_number.replace(' ', '').replace('-', '')
        
        # Must be 16 digits
        if len(card_number) != 16 or not card_number.isdigit():
            return False
        
        # Calculate checksum
        return luhn_checksum(card_number) == 0
    except:
        return False


# Test the generator
if __name__ == "__main__":
    print("Testing Virtual Card Generator\n")
    
    # Generate a test card
    card = create_virtual_card(
        agent_id="test-agent-001",
        user_id="test-user-001",
        amount_limit=10000,  # $100.00
        purpose="Test Card"
    )
    
    print("Generated Card:")
    print(f"  Card Number: {card['card_number']}")
    print(f"  CVV: {card['cvv']}")
    print(f"  Expiry: {card['expiry_date']}")
    print(f"  Holder: {card['card_holder_name']}")
    print(f"  Limit: ${card['amount_limit'] / 100:.2f}")
    print(f"  Status: {card['status']}")
    print(f"  Expires At: {card['expires_at']}")
    
    # Validate the card number
    is_valid = validate_luhn(card['card_number'])
    print(f"\n✓ Luhn validation: {'PASS' if is_valid else 'FAIL'}")
    
    # Generate multiple cards to test uniqueness
    print("\nGenerating 5 unique cards:")
    for i in range(5):
        test_card = create_virtual_card(
            agent_id=f"agent-{i}",
            user_id="test-user",
            amount_limit=5000,
            purpose="Test"
        )
        valid = validate_luhn(test_card['card_number'])
        print(f"  {i+1}. {test_card['card_number']} - {'✓' if valid else '✗'}")
