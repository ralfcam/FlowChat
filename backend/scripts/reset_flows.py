"""
Reset Flows Script

This script deletes all flows in the database and creates a single simple preset flow.
Useful for development and testing purposes.
"""

import os
import sys
import uuid
import json
from datetime import datetime

print("===== RESET FLOWS SCRIPT =====")
print(f"Current directory: {os.getcwd()}")
print(f"Python version: {sys.version}")

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print(f"Added to Python path: {os.path.dirname(os.path.dirname(os.path.abspath(__file__)))}")

# Now we can import from the app
print("Importing required modules...")
try:
    from app import create_app, get_db
    from app.models.flow import Flow
    from app.utils.preset_flows import create_welcome_flow
    print("Successfully imported modules")
except Exception as e:
    print(f"ERROR importing modules: {e}")
    sys.exit(1)

def reset_flows():
    """Delete all flows and create a single preset flow."""
    print("\nCreating Flask application...")
    app = create_app()
    
    with app.app_context():
        # Get the database using the get_db function from the application
        print("Getting database connection...")
        db = get_db()
        print("Database connection obtained")
        
        # Delete all existing flows
        print("\nDeleting all existing flows...")
        result = db.flows.delete_many({})
        print(f"Deleted {result.deleted_count} flows")
        
        # Create a simple flow
        print("\nCreating simple preset flow...")
        try:
            # First try using the create_simple_flow function for proper structure
            flow = create_simple_flow()
            print(f"Successfully created flow with ID: {flow._id}")
        except Exception as e:
            print(f"Error with create_simple_flow: {e}")
            print("Falling back to preset flow creator...")
            try:
                # Fallback to the standard preset flow creator
                flow = create_welcome_flow()
                print(f"Successfully created flow with ID: {flow._id}")
            except Exception as e:
                print(f"ERROR creating flow: {e}")
                raise
        
        # Verify
        print("\nVerifying database contents...")
        flows = list(db.flows.find())
        print(f"Database now has {len(flows)} flows")
        for flow in flows:
            print(f"  - {flow['name']} (preset: {flow['is_preset']})")
            
            # Log node structure for verification
            if len(flow.get('nodes', [])) > 0:
                print(f"  - Sample node structure:")
                sample_node = flow['nodes'][0]
                print(f"    - id: {sample_node.get('id')}")
                print(f"    - type: {sample_node.get('type')}")
                print(f"    - data keys: {list(sample_node.get('data', {}).keys())}")
                
                # Check for proper property names
                if 'content' in sample_node.get('data', {}):
                    print("    - WARNING: Node uses 'content' instead of 'message'")
                if 'waitTime' in sample_node.get('data', {}):
                    print("    - WARNING: Node uses 'waitTime' instead of 'timeout'")
                if 'waitUnit' in sample_node.get('data', {}):
                    print("    - WARNING: Node uses 'waitUnit' instead of 'timeoutUnit'")

def create_simple_flow():
    """Create a simple flow with basic nodes and edges that match React Flow's expectations."""
    print("Creating nodes for simple flow...")
    
    # Generate unique IDs for nodes
    node_ids = [f"node-{uuid.uuid4()}" for _ in range(3)]
    
    # Define nodes for the simple flow with the correct structure for React Flow
    nodes = [
        {
            "id": node_ids[0],
            "type": "messageNode",
            "position": {"x": 250, "y": 100},
            "data": { 
                "label": "Welcome Message", 
                "message": "Hello! Welcome to our service. How can I help you today?",
                "type": "text"
            }
        },
        {
            "id": node_ids[1],
            "type": "waitNode",
            "position": {"x": 250, "y": 250},
            "data": {
                "label": "Wait for Response",
                "timeout": 5,
                "timeoutUnit": "minutes",
                "waitForReply": True
            }
        },
        {
            "id": node_ids[2],
            "type": "messageNode",
            "position": {"x": 250, "y": 400},
            "data": {
                "label": "Response Message",
                "message": "Thank you for your message. How else can I assist you?",
                "type": "text"
            }
        }
    ]
    
    print("Node structure:")
    print(json.dumps(nodes[0], indent=2))
    
    print("Creating edges for simple flow...")
    # Generate unique IDs for edges
    edges = [
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": node_ids[0],
            "target": node_ids[1],
            "sourceHandle": None,
            "targetHandle": None
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": node_ids[1],
            "target": node_ids[2],
            "sourceHandle": "reply",
            "targetHandle": None
        }
    ]
    
    print("Edge structure:")
    print(json.dumps(edges[0], indent=2))
    
    print("Creating flow object...")
    # Create and save the flow
    flow = Flow(
        name="Welcome Flow Template",
        description="A basic flow template with welcome message and response",
        nodes=nodes,
        edges=edges,
        is_active=False,
        is_preset=True,
    )
    
    print("Saving flow to database...")
    flow.save()
    print(f"Flow saved successfully. Name: {flow.name}, ID: {flow._id}")
    
    # Log the full flow structure for debugging
    flow_dict = flow.to_dict()
    print("\nComplete flow structure:")
    print(json.dumps({
        "name": flow_dict["name"],
        "description": flow_dict["description"],
        "is_preset": flow_dict["is_preset"],
        "node_count": len(flow_dict["nodes"]),
        "edge_count": len(flow_dict["edges"]),
        "sample_node": flow_dict["nodes"][0] if flow_dict["nodes"] else None,
        "sample_edge": flow_dict["edges"][0] if flow_dict["edges"] else None
    }, indent=2))
    
    return flow

if __name__ == "__main__":
    print("\n=== Starting reset_flows script execution ===")
    try:
        reset_flows()
        print("\n=== Flow reset completed successfully ===")
    except Exception as e:
        print(f"\n=== ERROR: Flow reset failed: {e} ===")
        sys.exit(1)