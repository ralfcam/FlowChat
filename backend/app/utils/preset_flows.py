"""
Preset Flow Templates

This module provides utility functions for creating preset flow templates
that users can use as starting points for their own flows.
"""

from app.models.flow import Flow
import uuid

def create_default_presets():
    """
    Create default preset flows if they don't already exist.
    Returns the list of created preset flows.
    """
    print("Creating default preset flows...")
    presets = []
    
    # Simple Welcome Flow
    welcome_flow = create_welcome_flow()
    presets.append(welcome_flow)
    
    # Customer Support Flow
    support_flow = create_support_flow()
    presets.append(support_flow)
    
    # Order Status Flow
    order_flow = create_order_status_flow()
    presets.append(order_flow)
    
    print(f"Created {len(presets)} preset flows")
    return presets

def create_welcome_flow():
    """Create a simple welcome flow template."""
    
    # Define nodes for the welcome flow
    nodes = [
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 250, "y": 100},
            "data": {
                "label": "Welcome Message",
                "content": "Hello {{name}}! Welcome to our service. How can we help you today?",
                "type": "text"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "waitNode",
            "position": {"x": 250, "y": 250},
            "data": {
                "label": "Wait for Response",
                "waitTime": 0,
                "waitUnit": "minutes"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 250, "y": 400},
            "data": {
                "label": "Help Message",
                "content": "Here are some ways we can help you...",
                "type": "text"
            }
        }
    ]
    
    # Define edges connecting the nodes
    edges = [
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[0]["id"],
            "target": nodes[1]["id"]
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[1]["id"],
            "target": nodes[2]["id"]
        }
    ]
    
    # Create and save the flow
    flow = Flow(
        name="Welcome Flow Template",
        description="A simple welcome flow to get started",
        nodes=nodes,
        edges=edges,
        is_preset=True
    )
    
    flow.save()
    return flow

def create_support_flow():
    """Create a customer support flow template."""
    
    # Define nodes for the support flow
    nodes = [
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 250, "y": 100},
            "data": {
                "label": "Support Greeting",
                "content": "Hello {{name}}! Welcome to customer support. Please let us know what issue you're experiencing.",
                "type": "text"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "waitNode",
            "position": {"x": 250, "y": 250},
            "data": {
                "label": "Wait for Description",
                "waitTime": 0,
                "waitUnit": "minutes"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "conditionNode",
            "position": {"x": 250, "y": 400},
            "data": {
                "label": "Check Issue Type",
                "conditions": [
                    {"value": "technical", "label": "Technical Issue"},
                    {"value": "billing", "label": "Billing Issue"},
                    {"value": "other", "label": "Other"}
                ]
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 100, "y": 550},
            "data": {
                "label": "Technical Support",
                "content": "I understand you're having a technical issue. Let me help you troubleshoot that...",
                "type": "text"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 250, "y": 550},
            "data": {
                "label": "Billing Support",
                "content": "I understand you have a billing question. Let me check your account details...",
                "type": "text"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 400, "y": 550},
            "data": {
                "label": "General Support",
                "content": "Thank you for your message. A support agent will be with you shortly.",
                "type": "text"
            }
        }
    ]
    
    # Define edges connecting the nodes
    edges = [
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[0]["id"],
            "target": nodes[1]["id"]
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[1]["id"],
            "target": nodes[2]["id"]
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[2]["id"],
            "target": nodes[3]["id"],
            "sourceHandle": "technical",
            "targetHandle": null
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[2]["id"],
            "target": nodes[4]["id"],
            "sourceHandle": "billing",
            "targetHandle": null
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[2]["id"],
            "target": nodes[5]["id"],
            "sourceHandle": "other",
            "targetHandle": null
        }
    ]
    
    # Create and save the flow
    flow = Flow(
        name="Customer Support Template",
        description="A flow template for customer support interactions",
        nodes=nodes,
        edges=edges,
        is_preset=True
    )
    
    flow.save()
    return flow

def create_order_status_flow():
    """Create an order status flow template."""
    
    # Define nodes for the order status flow
    nodes = [
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 250, "y": 100},
            "data": {
                "label": "Order Status Inquiry",
                "content": "Hello {{name}}! To check your order status, please provide your order number.",
                "type": "text"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "waitNode",
            "position": {"x": 250, "y": 250},
            "data": {
                "label": "Wait for Order Number",
                "waitTime": 0,
                "waitUnit": "minutes"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 250, "y": 400},
            "data": {
                "label": "Order Status",
                "content": "Thank you! Your order #{{order_number}} is currently {{status}}. Expected delivery date: {{delivery_date}}.",
                "type": "text"
            }
        },
        {
            "id": f"node-{uuid.uuid4()}",
            "type": "messageNode",
            "position": {"x": 250, "y": 550},
            "data": {
                "label": "Follow-up",
                "content": "Do you have any other questions about your order?",
                "type": "text"
            }
        }
    ]
    
    # Define edges connecting the nodes
    edges = [
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[0]["id"],
            "target": nodes[1]["id"]
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[1]["id"],
            "target": nodes[2]["id"]
        },
        {
            "id": f"edge-{uuid.uuid4()}",
            "source": nodes[2]["id"],
            "target": nodes[3]["id"]
        }
    ]
    
    # Create and save the flow
    flow = Flow(
        name="Order Status Template",
        description="A flow template for checking order status",
        nodes=nodes,
        edges=edges,
        is_preset=True
    )
    
    flow.save()
    return flow 