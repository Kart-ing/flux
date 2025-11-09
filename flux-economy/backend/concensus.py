import asyncio
from dotenv import load_dotenv
from dedalus_labs import AsyncDedalus, DedalusRunner
from dedalus_labs import * 
from typing import List, Dict
import json

load_dotenv()

class AgentConsensusSystem:
    """
    Multi-agent consensus system for evaluating spending requests.
    5 agents with different roles vote on whether to approve purchases.
    """
    
    def __init__(self):
        self.client = AsyncDedalus()
        
        # Define 5 agents with different roles and optimal models
        self.agents = [
            {
                "name": "CFO Agent",
                "role": "Conservative financial oversight",
                "model": "anthropic/claude-sonnet-4-20250514",  # Best for careful analysis
                "persona": "You are a conservative CFO focused on cost control and ROI. You scrutinize every expense and require clear business justification. You vote YES only when the ROI is crystal clear.",
                "emoji": "💼"
            },
            {
                "name": "Growth Agent",
                "role": "Aggressive expansion focus",
                "model": "openai/gpt-4.1",  # Best for creative/growth thinking
                "persona": "You are a growth-obsessed executive who believes in aggressive investment. You vote YES when you see potential for scale and market capture, even if ROI isn't immediate.",
                "emoji": "🚀"
            },
            {
                "name": "Risk Assessment Agent",
                "role": "Risk analysis and mitigation",
                "model": "xai/grok-2-1212",
                "persona": "You are a risk management specialist. You evaluate potential downsides, security concerns, and vendor reliability. You vote based on risk-adjusted returns.",
                "emoji": "🛡️"
            },
            {
                "name": "Operations Agent",
                "role": "Practical implementation focus",
                "model": "openai/gpt-4o-mini",  # Fast and practical
                "persona": "You are an operations manager focused on practicality and execution. You vote YES when the purchase solves a real operational problem and is easy to implement.",
                "emoji": "⚙️"
            },
            {
                "name": "Data Agent",
                "role": "Evidence-based decision making",
                "model": "openai/o1",  # Best for analytical reasoning
                "persona": "You are a data scientist who makes decisions based purely on metrics and evidence. You vote YES only when data supports the decision.",
                "emoji": "📊"
            }
        ]
    
    async def get_agent_vote(self, agent: Dict, purchase_request: Dict) -> Dict:
        """
        Get a single agent's vote on a purchase request.
        """
        runner = DedalusRunner(self.client)
        
        # Format the purchase request for the agent
        request_context = f"""
PURCHASE REQUEST:
Amount: ${purchase_request['amount']}
Purpose: {purchase_request['purpose']}
Requesting Agent: {purchase_request['requesting_agent']}
Justification: {purchase_request['justification']}
Expected ROI: {purchase_request.get('expected_roi', 'Not specified')}
Urgency: {purchase_request.get('urgency', 'Medium')}
Current Budget Remaining: ${purchase_request.get('budget_remaining', 'Unknown')}

YOUR ROLE: {agent['role']}
YOUR PERSONA: {agent['persona']}

Analyze this purchase request and provide:
1. Your vote (YES or NO)
2. Your reasoning (2-3 sentences)
3. A risk score from 1-10 (1 = very safe, 10 = very risky)
4. Any conditions for approval

Format your response as JSON:
{{
    "vote": "YES" or "NO",
    "reasoning": "your detailed reasoning here",
    "risk_score": 5,
    "conditions": "any conditions or empty string"
}}
"""
        
        try:
            response = await runner.run(
                input=request_context,
                model=agent['model']
            )
            
            # Parse the response
            result = self._parse_agent_response(response.final_output, agent)
            return result
            
        except Exception as e:
            print(f"Error getting vote from {agent['name']}: {e}")
            return {
                "agent_name": agent['name'],
                "emoji": agent['emoji'],
                "vote": "ABSTAIN",
                "reasoning": f"Error occurred: {str(e)}",
                "risk_score": 0,
                "conditions": "",
                "model": agent['model']
            }
    
    def _parse_agent_response(self, response: str, agent: Dict) -> Dict:
        """
        Parse agent response and extract structured data.
        """
        try:
            # Try to find JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            
            if start != -1 and end > start:
                json_str = response[start:end]
                parsed = json.loads(json_str)
                
                return {
                    "agent_name": agent['name'],
                    "emoji": agent['emoji'],
                    "vote": parsed.get('vote', 'ABSTAIN'),
                    "reasoning": parsed.get('reasoning', 'No reasoning provided'),
                    "risk_score": parsed.get('risk_score', 5),
                    "conditions": parsed.get('conditions', ''),
                    "model": agent['model']
                }
            else:
                # Fallback parsing
                vote = "YES" if "YES" in response.upper() else "NO" if "NO" in response.upper() else "ABSTAIN"
                return {
                    "agent_name": agent['name'],
                    "emoji": agent['emoji'],
                    "vote": vote,
                    "reasoning": response[:200],
                    "risk_score": 5,
                    "conditions": "",
                    "model": agent['model']
                }
                
        except Exception as e:
            return {
                "agent_name": agent['name'],
                "emoji": agent['emoji'],
                "vote": "ABSTAIN",
                "reasoning": response[:200],
                "risk_score": 5,
                "conditions": "",
                "model": agent['model']
            }
    
    async def evaluate_purchase(self, purchase_request: Dict) -> Dict:
        """
        Main function: Get all 5 agents to vote on a purchase request.
        Returns consensus decision and all agent votes.
        """
        print(f"\n{'='*60}")
        print(f"🔍 EVALUATING PURCHASE REQUEST")
        print(f"{'='*60}")
        print(f"Amount: ${purchase_request['amount']}")
        print(f"Purpose: {purchase_request['purpose']}")
        print(f"\n⏳ Gathering votes from 5 agents...\n")
        
        # Get votes from all agents in parallel
        tasks = [self.get_agent_vote(agent, purchase_request) for agent in self.agents]
        agent_votes = await asyncio.gather(*tasks)
        
        # Print each agent's vote
        for vote in agent_votes:
            print(f"\n{vote['emoji']} {vote['agent_name']} ({vote['model']})")
            print(f"   Vote: {vote['vote']}")
            print(f"   Risk Score: {vote['risk_score']}/10")
            print(f"   Reasoning: {vote['reasoning']}")
            if vote['conditions']:
                print(f"   Conditions: {vote['conditions']}")
        
        # Calculate consensus
        yes_votes = sum(1 for v in agent_votes if v['vote'] == 'YES')
        no_votes = sum(1 for v in agent_votes if v['vote'] == 'NO')
        abstain_votes = sum(1 for v in agent_votes if v['vote'] == 'ABSTAIN')
        
        # Decision requires majority (3+ YES votes)
        approved = yes_votes >= 3
        
        # Calculate average risk score
        risk_scores = [v['risk_score'] for v in agent_votes if v['risk_score'] > 0]
        avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 0
        
        result = {
            "approved": approved,
            "yes_votes": yes_votes,
            "no_votes": no_votes,
            "abstain_votes": abstain_votes,
            "average_risk_score": round(avg_risk, 2),
            "agent_votes": agent_votes,
            "purchase_request": purchase_request
        }
        
        # Print final decision
        print(f"\n{'='*60}")
        if approved:
            print(f"✅ PURCHASE APPROVED")
        else:
            print(f"❌ PURCHASE DENIED")
        print(f"{'='*60}")
        print(f"Votes: {yes_votes} YES, {no_votes} NO, {abstain_votes} ABSTAIN")
        print(f"Average Risk Score: {avg_risk:.2f}/10")
        print(f"{'='*60}\n")
        
        return result


async def main():
    """
    Example usage of the agent consensus system.
    """
    
    # Initialize the system
    consensus_system = AgentConsensusSystem()
    
    # Example purchase request 1: Reasonable API subscription
    purchase_request_1 = {
        "amount": 500,
        "purpose": "OpenAI API credits for customer support chatbot",
        "requesting_agent": "Customer Service Agent",
        "justification": "Our support tickets have increased 300% this month. An AI chatbot could handle 70% of common questions, reducing response time from 4 hours to instant.",
        "expected_roi": "Save $3,000/month in support costs, improve customer satisfaction scores",
        "urgency": "High",
        "budget_remaining": 10000
    }
    
    # Example purchase request 2: Questionable expense
    purchase_request_2 = {
        "amount": 5000,
        "purpose": "Premium Slack workspace with all add-ons",
        "requesting_agent": "Internal Comms Agent",
        "justification": "Team communication could be better. Premium features include better search and more integrations.",
        "expected_roi": "Improved team communication",
        "urgency": "Low",
        "budget_remaining": 10000
    }
    
    # Example purchase request 3: High-value strategic investment
    purchase_request_3 = {
        "amount": 2000,
        "purpose": "Anthropic Claude API Enterprise plan",
        "requesting_agent": "Product Development Agent",
        "justification": "Need advanced AI capabilities for new product feature that competitors don't have. Early access to latest models could give us 6-month competitive advantage.",
        "expected_roi": "Potential $50K+ in new customer revenue if feature succeeds",
        "urgency": "Medium",
        "budget_remaining": 10000
    }
    
    # Run evaluations
    print("\n🎯 SCENARIO 1: Reasonable API Subscription")
    result_1 = await consensus_system.evaluate_purchase(purchase_request_1)
    
    print("\n\n🎯 SCENARIO 2: Questionable Expense")
    result_2 = await consensus_system.evaluate_purchase(purchase_request_2)
    
    print("\n\n🎯 SCENARIO 3: Strategic Investment")
    result_3 = await consensus_system.evaluate_purchase(purchase_request_3)
    
    # Return results for further processing
    return {
        "scenario_1": result_1,
        "scenario_2": result_2,
        "scenario_3": result_3
    }


if __name__ == "__main__":
    results = asyncio.run(main())
    
    # Optional: Save results to JSON file
    with open('consensus_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n💾 Results saved to consensus_results.json")


