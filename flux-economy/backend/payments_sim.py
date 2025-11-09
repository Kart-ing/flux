# Agent that has access to your consensus system as a TOOL
import asyncio
import json
from typing import Dict
from dedalus_labs import AsyncDedalus, DedalusRunner
from concensus import AgentConsensusSystem

class AutonomousTaskAgent:
    """
    An agent that tries to complete a task and uses the consensus
    payment system when it needs to make purchases.
    """
    
    def __init__(self, agent_name: str, goal: str, budget: int):
        self.client = AsyncDedalus()
        self.agent_name = agent_name
        self.goal = goal
        self.budget = budget
        self.consensus_system = AgentConsensusSystem()

    
    async def complete_task(self):
        """
        Agent attempts to complete its goal.
        It will autonomously decide when it needs to make purchases.
        """
        
        task_prompt = f"""
    You are {self.agent_name}. Your goal is: {self.goal}

    You have a budget of ${self.budget}.

    You have access to a PAYMENT TOOL that requires consensus approval.
    When you need to make a purchase, you must:
    1. Identify what you need to buy
    2. Justify why you need it
    3. Estimate the ROI
    4. Submit a purchase request

    Available actions:
    - REQUEST_PURCHASE: Submit a purchase for consensus approval
    - HIRE_AGENT: Hire another specialized agent for help
    - COMPLETE: Task is done

    Think step by step about what you need to accomplish this goal.
    What purchases or agent hires do you need to make?

    Respond in JSON format:
    {{
        "reasoning": "your thinking process",
        "actions": [
            {{
                "type": "REQUEST_PURCHASE",
                "amount": 500,
                "purpose": "OpenAI API credits",
                "justification": "Need AI capabilities for feature",
                "expected_roi": "10x ROI from new customers"
            }},
            {{
                "type": "HIRE_AGENT",
                "agent_type": "Design Agent",
                "amount": 300,
                "task": "Create landing page",
                "justification": "Need professional design",
                "expected_roi": "Better conversion rates"
            }}
        ]
    }}
    """
        
        runner = DedalusRunner(self.client)
        response = await runner.run(
            input=task_prompt,
            model="openai/gpt-4.1"
        )
        
        # Parse agent's planned actions
        parsed = self._parse_actions(response.final_output)
        reasoning = parsed.get('reasoning', 'No reasoning provided')
        actions = parsed.get('actions', [])
        
        # Execute each action through consensus
        results = []
        for action in actions:
            if action['type'] == 'REQUEST_PURCHASE':
                result = await self._request_purchase(action)
                results.append(result)
            elif action['type'] == 'HIRE_AGENT':
                result = await self._hire_agent(action)
                results.append(result)
        
        return {
            "agent": self.agent_name,
            "goal": self.goal,
            "reasoning": reasoning,
            "actions_taken": results,
            "total_spent": sum(r['amount'] for r in results if r['approved']),
            "budget_remaining": self.budget - sum(r['amount'] for r in results if r['approved'])
        }

    async def _request_purchase(self, action: Dict) -> Dict:
        """
        Submit purchase request to consensus system
        """
        purchase_request = {
            "amount": action['amount'],
            "purpose": action['purpose'],
            "requesting_agent": self.agent_name,
            "justification": action['justification'],
            "expected_roi": action['expected_roi'],
            "urgency": action.get('urgency', 'Medium'),
            "budget_remaining": self.budget
        }
        
        result = await self.consensus_system.evaluate_purchase(purchase_request)
        
        return {
            "type": "purchase",
            "approved": result['approved'],
            "amount": action['amount'] if result['approved'] else 0,
            "purpose": action['purpose'],
            "votes": result
        }
    
    async def _hire_agent(self, action: Dict) -> Dict:
        """
        Hire another agent (also goes through consensus)
        """
        purchase_request = {
            "amount": action['amount'],
            "purpose": f"Hire {action['agent_type']} for {action['task']}",
            "requesting_agent": self.agent_name,
            "justification": action['justification'],
            "expected_roi": action['expected_roi'],
            "urgency": "Medium",
            "budget_remaining": self.budget
        }
        
        result = await self.consensus_system.evaluate_purchase(purchase_request)
        
        return {
            "type": "agent_hire",
            "approved": result['approved'],
            "amount": action['amount'] if result['approved'] else 0,
            "agent_hired": action['agent_type'],
            "task": action['task'],
            "votes": result
        }
    
    def _parse_actions(self, response: str) -> Dict:
        """Parse agent's planned actions from response"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                parsed = json.loads(json_str)
                return parsed
        except Exception as e:
            print(f"Error parsing actions: {e}")
            print(f"Response was: {response[:500]}")
        
        # Fallback if parsing fails
        return {
            "reasoning": response[:200],
            "actions": []
        }


async def run_simulation():
    """
    Run multiple autonomous agents trying to complete different goals.
    They all use the payment system autonomously.
    """
    
    # Scenario 1: Marketing Agent launching new campaign
    marketing_agent = AutonomousTaskAgent(
        agent_name="Marketing Agent Alpha",
        goal="Launch a new product landing page and ad campaign to acquire 1000 users",
        budget=5000
    )
    
    # Scenario 2: Product Agent building new feature
    product_agent = AutonomousTaskAgent(
        agent_name="Product Agent Beta",
        goal="Build and deploy an AI-powered search feature for our app",
        budget=3000
    )
    
    # Scenario 3: Customer Success Agent improving support
    cs_agent = AutonomousTaskAgent(
        agent_name="Customer Success Agent Gamma",
        goal="Reduce support ticket response time from 4 hours to under 1 hour",
        budget=2000
    )
    
    print("\n" + "="*60)
    print("🤖 AUTONOMOUS AGENT SIMULATION")
    print("="*60)
    print("\nThree agents are attempting to complete their goals...")
    print("They will autonomously request purchases and hire other agents.")
    print("All requests go through 5-agent consensus approval.\n")
    
    # Run all agents in parallel
    results = await asyncio.gather(
        marketing_agent.complete_task(),
        product_agent.complete_task(),
        cs_agent.complete_task()
    )
    
    # Print summary
    print("\n" + "="*60)
    print("📊 SIMULATION COMPLETE")
    print("="*60)
    
    for result in results:
        print(f"\n{result['agent']}:")
        print(f"  Goal: {result['goal']}")
        print(f"  Actions Taken: {len(result['actions_taken'])}")
        print(f"  Total Spent: ${result['total_spent']}")
        print(f"  Budget Remaining: ${result['budget_remaining']}")
        
        approved = sum(1 for a in result['actions_taken'] if a['approved'])
        denied = len(result['actions_taken']) - approved
        print(f"  Approved: {approved}, Denied: {denied}")
    
    return results


if __name__ == "__main__":
    results = asyncio.run(run_simulation())
    
    # Save full results
    with open('simulation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n💾 Full results saved to simulation_results.json")