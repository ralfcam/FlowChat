#!/usr/bin/env python
"""
Initialize the database with preset flows and admin user.
This script should be run once when setting up the application.
"""

import sys
import os
import subprocess
import time
from datetime import datetime
from bson import ObjectId

# Add the parent directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, get_db
from app.models.user import User
from app.models.flow import Flow

# Import preset flow data
from scripts.create_preset_flows import PRESET_FLOWS

def init_db():
    """Initialize the database with required data"""
    print("Initializing database...")
    
    # Create the Flask app context
    app = create_app()
    
    with app.app_context():
        # Get database connection
        db = get_db()
        
        # Check if MongoDB is accessible
        try:
            # Try to get a user count to test connection
            user_count = db.users.count_documents({})
            print(f"Database connection successful. Found {user_count} users.")
        except Exception as e:
            print(f"Error connecting to database: {e}")
            print("Make sure MongoDB is running and accessible.")
            sys.exit(1)
        
        # Create admin user if it doesn't exist
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
        else:
            print(f"Admin user already exists with ID: {admin_user._id}")
        
        # Create preset flows directly using the database
        print("Creating preset flows...")
        try:
            created_count = 0
            updated_count = 0
            
            for preset_data in PRESET_FLOWS:
                # Check if a preset with this name already exists
                existing_flows = list(db.flows.find({"name": preset_data["name"], "is_preset": True}))
                
                if existing_flows:
                    # Update existing preset
                    flow_id = existing_flows[0]["_id"]
                    db.flows.update_one(
                        {"_id": flow_id},
                        {"$set": {
                            "description": preset_data["description"],
                            "nodes": preset_data["nodes"],
                            "edges": preset_data["edges"],
                            "is_preset": True,
                            "is_active": False,
                            "user_id": admin_user._id,
                            "updated_at": datetime.utcnow()
                        }}
                    )
                    updated_count += 1
                    print(f"Updated preset flow: {preset_data['name']}")
                else:
                    # Create new preset
                    result = db.flows.insert_one({
                        "name": preset_data["name"],
                        "description": preset_data["description"],
                        "nodes": preset_data["nodes"],
                        "edges": preset_data["edges"],
                        "is_preset": True,
                        "is_active": False,
                        "user_id": admin_user._id,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    })
                    created_count += 1
                    print(f"Created preset flow: {preset_data['name']} with ID: {result.inserted_id}")
            
            print(f"Preset flows: {created_count} created, {updated_count} updated")
            
        except Exception as e:
            print(f"Error creating preset flows: {e}")
            print("Preset flows could not be created.")
    
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db() 