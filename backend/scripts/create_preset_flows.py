#!/usr/bin/env python
"""
Script to create preset flows in the MongoDB database.
This is used to initialize the system with default flow templates.
"""

import sys
import os

# Add the parent directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models.flow import Flow
from app.models.user import User
from bson import ObjectId

# Initialize the Flask app to get the database connection
app = create_app()

# Sample preset flows
PRESET_FLOWS = [
    {
        "name": "Welcome Message Flow",
        "description": "A simple flow to welcome new customers and collect basic information",
        "nodes": [
            {
                "id": "1",
                "type": "messageNode",
                "position": { "x": 250, "y": 100 },
                "data": { 
                    "label": "Welcome Message", 
                    "message": "Hello! Welcome to our service. How can we help you today?"
                }
            },
            {
                "id": "2",
                "type": "waitNode",
                "position": { "x": 250, "y": 250 },
                "data": { 
                    "label": "Wait for Response",
                    "duration": 2,
                    "timeUnit": "minutes"
                }
            },
            {
                "id": "3",
                "type": "messageNode",
                "position": { "x": 250, "y": 400 },
                "data": { 
                    "label": "Follow-up Message", 
                    "message": "Thanks for your response! We'll get back to you shortly."
                }
            }
        ],
        "edges": [
            { "id": "e1-2", "source": "1", "target": "2" },
            { "id": "e2-3", "source": "2", "target": "3" }
        ]
    },
    {
        "name": "Customer Support Flow",
        "description": "A flow to handle common customer support queries",
        "nodes": [
            {
                "id": "1",
                "type": "messageNode",
                "position": { "x": 250, "y": 100 },
                "data": { 
                    "label": "Support Greeting", 
                    "message": "Hello! Welcome to customer support. Please tell us what you need help with."
                }
            },
            {
                "id": "2",
                "type": "conditionNode",
                "position": { "x": 250, "y": 250 },
                "data": { 
                    "label": "Check Query Type",
                    "condition": "",
                    "variable": "message",
                    "operator": "contains",
                    "value": "billing"
                }
            },
            {
                "id": "3",
                "type": "messageNode",
                "position": { "x": 100, "y": 400 },
                "data": { 
                    "label": "Billing Support", 
                    "message": "For billing issues, please provide your account number and we'll help you."
                }
            },
            {
                "id": "4",
                "type": "messageNode",
                "position": { "x": 400, "y": 400 },
                "data": { 
                    "label": "General Support", 
                    "message": "I understand you need help. Please provide more details about your issue."
                }
            }
        ],
        "edges": [
            { "id": "e1-2", "source": "1", "target": "2" },
            { "id": "e2-3", "source": "2", "target": "3", "sourceHandle": "yes" },
            { "id": "e2-4", "source": "2", "target": "4", "sourceHandle": "no" }
        ]
    },
    {
        "name": "Order Confirmation Flow",
        "description": "A flow to confirm orders and provide status updates",
        "nodes": [
            {
                "id": "1",
                "type": "messageNode",
                "position": { "x": 250, "y": 100 },
                "data": { 
                    "label": "Order Confirmation", 
                    "message": "Thank you for your order! Your order #{{order_id}} has been received."
                }
            },
            {
                "id": "2",
                "type": "waitNode",
                "position": { "x": 250, "y": 250 },
                "data": { 
                    "label": "Processing Time",
                    "duration": 1,
                    "timeUnit": "hours"
                }
            },
            {
                "id": "3",
                "type": "messageNode",
                "position": { "x": 250, "y": 400 },
                "data": { 
                    "label": "Processing Update", 
                    "message": "Your order #{{order_id}} is now being processed."
                }
            },
            {
                "id": "4",
                "type": "waitNode",
                "position": { "x": 250, "y": 550 },
                "data": { 
                    "label": "Shipping Delay",
                    "duration": 24,
                    "timeUnit": "hours"
                }
            },
            {
                "id": "5",
                "type": "messageNode",
                "position": { "x": 250, "y": 700 },
                "data": { 
                    "label": "Shipping Confirmation", 
                    "message": "Great news! Your order #{{order_id}} has been shipped and should arrive in 2-3 business days."
                }
            }
        ],
        "edges": [
            { "id": "e1-2", "source": "1", "target": "2" },
            { "id": "e2-3", "source": "2", "target": "3" },
            { "id": "e3-4", "source": "3", "target": "4" },
            { "id": "e4-5", "source": "4", "target": "5" }
        ]
    }
]


def create_preset_flows():
    """Create preset flows in the database"""
    
    # Find or create an admin user
    admin_user = User.find_by_email("admin@flowchat.com")
    if not admin_user:
        print("Creating admin user...")
        admin_user = User(
            email="admin@flowchat.com",
            name="System Admin",
            password="admin123",  # This should be changed in production
            role="admin"
        )
        admin_user.save()
        print(f"Admin user created with ID: {admin_user._id}")
    
    # Create preset flows
    print("Creating preset flows...")
    created_count = 0
    updated_count = 0
    
    for preset_data in PRESET_FLOWS:
        # Check if a preset with this name already exists
        existing_flows = list(Flow.collection.find({"name": preset_data["name"], "is_preset": True}))
        
        if existing_flows:
            # Update existing preset
            flow_id = existing_flows[0]["_id"]
            Flow.collection.update_one(
                {"_id": flow_id},
                {"$set": {
                    "description": preset_data["description"],
                    "nodes": preset_data["nodes"],
                    "edges": preset_data["edges"],
                    "is_preset": True,
                    "is_active": False,
                    "user_id": admin_user._id,
                    "updated_at": Flow().updated_at
                }}
            )
            updated_count += 1
            print(f"Updated preset flow: {preset_data['name']}")
        else:
            # Create new preset
            flow = Flow(
                name=preset_data["name"],
                description=preset_data["description"],
                nodes=preset_data["nodes"],
                edges=preset_data["edges"],
                is_preset=True,
                is_active=False,
                user_id=admin_user._id
            )
            flow.save()
            created_count += 1
            print(f"Created preset flow: {preset_data['name']} with ID: {flow._id}")
    
    print(f"Preset flows: {created_count} created, {updated_count} updated")


if __name__ == "__main__":
    with app.app_context():
        create_preset_flows() 