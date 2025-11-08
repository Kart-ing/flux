from flask import Flask, jsonify, request
from flask_cors import CORS
import asyncio
import sys
import os
from concensus import AgentConsensusSystem

# Try to import the simulation system
try:
    from payments_sim import AutonomousTaskAgent
    SIMULATION_AVAILABLE = True
except ImportError as e:
    SIMULATION_AVAILABLE = False
    print(f"Warning: payments_sim.py not found. Simulation features will be disabled. Error: {e}")

app = Flask(__name__)
CORS(app)

# Global state to store latest results
latest_results = []
simulation_results = []

@app.route('/api/evaluate', methods=['POST'])
def evaluate_purchase():
    """
    Endpoint to evaluate a purchase request through consensus
    """
    try:
        data = request.json
        
        purchase_request = {
            "amount": data.get('amount'),
            "purpose": data.get('purpose'),
            "requesting_agent": data.get('requesting_agent'),
            "justification": data.get('justification'),
            "expected_roi": data.get('expected_roi', 'Not specified'),
            "urgency": data.get('urgency', 'Medium'),
            "budget_remaining": data.get('budget_remaining', 10000)
        }
        
        # Run the consensus system
        consensus_system = AgentConsensusSystem()
        result = asyncio.run(consensus_system.evaluate_purchase(purchase_request))
        
        # Store in global state
        latest_results.append(result)
        
        return jsonify({
            "success": True,
            "result": result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/simulate', methods=['POST'])
def simulate_agent():
    """
    Endpoint to run an autonomous agent simulation
    """
    if not SIMULATION_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "Simulation system not available. Make sure payments_sim.py is in the parent directory."
        }), 500
    
    try:
        data = request.json
        
        agent_name = data.get('agent_name')
        goal = data.get('goal')
        budget = data.get('budget', 5000)
        
        if not agent_name or not goal:
            return jsonify({
                "success": False,
                "error": "agent_name and goal are required"
            }), 400
        
        # Create and run the autonomous agent
        agent = AutonomousTaskAgent(
            agent_name=agent_name,
            goal=goal,
            budget=budget
        )
        
        result = asyncio.run(agent.complete_task())
        
        # Store in global state
        simulation_results.append(result)
        
        return jsonify({
            "success": True,
            "result": result
        })
        
    except Exception as e:
        print(f"Error in simulation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/results', methods=['GET'])
def get_results():
    """
    Get all evaluation results
    """
    return jsonify({
        "success": True,
        "results": latest_results
    })

@app.route('/api/simulations', methods=['GET'])
def get_simulations():
    """
    Get all simulation results
    """
    return jsonify({
        "success": True,
        "simulations": simulation_results
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "healthy",
        "message": "Quorum API is running"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)