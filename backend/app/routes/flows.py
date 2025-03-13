from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.models.flow import Flow
from bson import ObjectId
import json
import os
import time

flows_bp = Blueprint('flows', __name__)

@flows_bp.route('/flows', methods=['GET'])
@token_required
def get_flows():
    """Get all flows for the current user."""
    try:
        # Get query parameters
        include_presets = request.args.get('include_presets', 'false').lower() == 'true'
        
        # Get user flows
        flows = Flow.find_all_by_user(g.user._id)
        
        # Include presets if requested
        if include_presets:
            presets = Flow.find_presets()
            # Filter out presets that might belong to the user to avoid duplicates
            presets = [preset for preset in presets if not any(flow._id == preset._id for flow in flows)]
            flows.extend(presets)
        
        return jsonify({
            "success": True,
            "flows": [flow.to_dict() for flow in flows]
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@flows_bp.route('/flows/<flow_id>', methods=['GET'])
@token_required
def get_flow(flow_id):
    """Get a specific flow by ID."""
    try:
        flow = Flow.find_by_id(flow_id)
        if not flow:
            return jsonify({
                "success": False,
                "message": "Flow not found"
            }), 404
            
        # Check if flow belongs to the current user or is a preset
        if not flow.is_preset and str(flow.user_id) != str(g.user._id):
            return jsonify({
                "success": False,
                "message": "Unauthorized access to flow"
            }), 403
            
        return jsonify({
            "success": True,
            "flow": flow.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@flows_bp.route('/flows', methods=['POST'])
@token_required
def create_flow():
    """Create a new flow."""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({
                "success": False,
                "message": "Flow name is required"
            }), 400
            
        # Create new flow
        flow = Flow(
            name=data.get('name'),
            description=data.get('description', ''),
            nodes=data.get('nodes', []),
            edges=data.get('edges', []),
            is_active=data.get('is_active', False),
            is_preset=data.get('is_preset', False),
            user_id=g.user._id
        )
        
        # Only admins can create preset flows
        if flow.is_preset and not hasattr(g.user, 'role') or g.user.role != 'admin':
            flow.is_preset = False
            
        flow.save()
        
        return jsonify({
            "success": True,
            "message": "Flow created successfully",
            "flow": flow.to_dict()
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@flows_bp.route('/flows/<flow_id>', methods=['PUT'])
@token_required
def update_flow(flow_id):
    """Update an existing flow."""
    try:
        data = request.json
        flow = Flow.find_by_id(flow_id)
        
        if not flow:
            return jsonify({
                "success": False,
                "message": "Flow not found"
            }), 404
            
        # Check if flow belongs to the current user
        if str(flow.user_id) != str(g.user._id):
            return jsonify({
                "success": False,
                "message": "Unauthorized access to flow"
            }), 403
            
        # Don't allow regular users to change preset status
        is_preset = data.get('is_preset', flow.is_preset)
        if is_preset != flow.is_preset and not hasattr(g.user, 'role') or g.user.role != 'admin':
            is_preset = flow.is_preset
        
        # Update flow fields
        flow.name = data.get('name', flow.name)
        flow.description = data.get('description', flow.description)
        flow.nodes = data.get('nodes', flow.nodes)
        flow.edges = data.get('edges', flow.edges)
        flow.is_active = data.get('is_active', flow.is_active)
        flow.is_preset = is_preset
        
        flow.save()
        
        return jsonify({
            "success": True,
            "message": "Flow updated successfully",
            "flow": flow.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@flows_bp.route('/flows/<flow_id>', methods=['DELETE'])
@token_required
def delete_flow(flow_id):
    """Delete a flow."""
    try:
        flow = Flow.find_by_id(flow_id)
        
        if not flow:
            return jsonify({
                "success": False,
                "message": "Flow not found"
            }), 404
            
        # Check if flow belongs to the current user
        if str(flow.user_id) != str(g.user._id):
            return jsonify({
                "success": False,
                "message": "Unauthorized access to flow"
            }), 403
            
        # Don't allow deletion of preset flows by non-admin users
        if flow.is_preset and not hasattr(g.user, 'role') or g.user.role != 'admin':
            return jsonify({
                "success": False,
                "message": "Cannot delete preset flows"
            }), 403
            
        flow.delete()
        
        return jsonify({
            "success": True,
            "message": "Flow deleted successfully"
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@flows_bp.route('/flows/active', methods=['GET'])
@token_required
def get_active_flows():
    """Get all active flows."""
    try:
        # For admin users, return all active flows
        if hasattr(g.user, 'role') and g.user.role == 'admin':
            flows = Flow.find_active_flows()
        else:
            # For regular users, only return their active flows
            flows = [flow for flow in Flow.find_all_by_user(g.user._id) if flow.is_active]
            
        return jsonify({
            "success": True,
            "flows": [flow.to_dict() for flow in flows]
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@flows_bp.route('/flows/presets', methods=['GET'])
@token_required
def get_preset_flows():
    """Get all preset flows."""
    try:
        # Force preset creation in dev mode if none exist
        dev_mode = os.environ.get('FLASK_ENV') == 'development' and os.environ.get('DEV_AUTH_BYPASS', 'false').lower() == 'true'
        
        presets = Flow.find_presets()
        
        # If in dev mode and no presets found, attempt to create them directly
        if dev_mode and not presets:
            from app.utils.preset_flows import create_default_presets
            print("Development mode: Attempting to create default presets directly")
            presets = create_default_presets()
        
        return jsonify({
            "success": True,
            "flows": [flow.to_dict() for flow in presets]
        })
    except Exception as e:
        print(f"Error getting preset flows: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to get preset flows",
            "error": str(e)
        }), 500

# Special development endpoint that doesn't require authentication
@flows_bp.route('/dev/flows/presets', methods=['GET'])
def get_dev_preset_flows():
    """Get all preset flows for development mode - NO AUTHENTICATION REQUIRED.
    This endpoint should only be enabled in development mode."""
    # Check if we're in development mode - make this more robust
    is_dev_mode = os.environ.get('FLASK_ENV') == 'development'
    dev_bypass = os.environ.get('DEV_AUTH_BYPASS', 'false').lower() == 'true'
    
    print(f"DEV ENDPOINT ACCESS - Environment variables: FLASK_ENV={os.environ.get('FLASK_ENV')}, DEV_AUTH_BYPASS={os.environ.get('DEV_AUTH_BYPASS')}")
    
    # For development purposes, allow this endpoint if either condition is true
    if not (is_dev_mode or dev_bypass):
        print("DEV ENDPOINT: Access denied - not in development mode")
        return jsonify({
            "success": False,
            "message": "This endpoint is only available in development mode"
        }), 403
    
    try:
        print("DEV ENDPOINT: Fetching preset flows without authentication")
        
        # Try to find existing presets first
        presets = Flow.find_presets()
        
        # If no presets found, create them
        if not presets:
            print("DEV ENDPOINT: No presets found, creating default presets")
            from app.utils.preset_flows import create_default_presets
            presets = create_default_presets()
            print(f"DEV ENDPOINT: Created {len(presets)} preset flows")
        else:
            print(f"DEV ENDPOINT: Found {len(presets)} existing preset flows")
        
        return jsonify({
            "success": True,
            "flows": [flow.to_dict() for flow in presets]
        })
    except Exception as e:
        print(f"DEV ENDPOINT ERROR: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to get preset flows",
            "error": str(e)
        }), 500

@flows_bp.route('/flows/<flow_id>/duplicate', methods=['POST'])
@token_required
def duplicate_flow(flow_id):
    """Duplicate a flow."""
    try:
        flow = Flow.find_by_id(flow_id)
        
        if not flow:
            return jsonify({
                "success": False,
                "message": "Flow not found"
            }), 404
            
        # Check if flow belongs to the current user or is a preset
        if not flow.is_preset and str(flow.user_id) != str(g.user._id):
            return jsonify({
                "success": False,
                "message": "Unauthorized access to flow"
            }), 403
            
        # Get request data for customizations
        data = request.json or {}
        
        # Duplicate the flow
        new_flow = flow.duplicate(
            new_name=data.get('name'),
            new_user_id=g.user._id,
            as_preset=False  # Regular users can't create presets this way
        )
        
        return jsonify({
            "success": True,
            "message": "Flow duplicated successfully",
            "flow": new_flow.to_dict()
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@flows_bp.route('/dev/flows/create_preset', methods=['POST'])
def create_dev_preset():
    """Create a preset flow in development mode - NO AUTHENTICATION REQUIRED.
    This endpoint should only be enabled in development mode."""
    # Check if we're in development mode - make this more robust
    is_dev_mode = os.environ.get('FLASK_ENV') == 'development'
    dev_bypass = os.environ.get('DEV_AUTH_BYPASS', 'false').lower() == 'true'
    
    print(f"DEV ENDPOINT ACCESS - Environment variables: FLASK_ENV={os.environ.get('FLASK_ENV')}, DEV_AUTH_BYPASS={os.environ.get('DEV_AUTH_BYPASS')}")
    
    # For development purposes, allow this endpoint if either condition is true
    if not (is_dev_mode or dev_bypass):
        print("DEV ENDPOINT: Access denied - not in development mode")
        return jsonify({
            "success": False,
            "message": "This endpoint is only available in development mode"
        }), 403
    
    try:
        print("DEV ENDPOINT: Creating a preset flow without authentication")
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({
                "success": False,
                "message": "Flow name is required"
            }), 400
            
        # Create new flow
        flow = Flow(
            name=data.get('name'),
            description=data.get('description', ''),
            nodes=data.get('nodes', []),
            edges=data.get('edges', []),
            is_active=False,  # Always inactive for presets
            is_preset=True,   # Mark as preset
            user_id=None      # No user association for presets
        )
        
        flow.save()
        print(f"DEV ENDPOINT: Created preset flow: {flow.name}")
        
        return jsonify({
            "success": True,
            "message": "Preset flow created successfully",
            "flow": flow.to_dict()
        }), 201
    except Exception as e:
        print(f"DEV ENDPOINT ERROR: {e}")
        return jsonify({
            "success": False,
            "message": "Failed to create preset flow",
            "error": str(e)
        }), 500

@flows_bp.route('/open/create_simple_preset', methods=['GET'])
def create_simple_preset():
    """Create a simple preset flow with no authentication required.
    This is an open endpoint that anyone can access, designed as a last resort for debugging.
    In production, this would be removed or protected."""
    try:
        print("OPEN ENDPOINT: Creating a simple preset flow without authentication")
        
        # Create a simple welcome flow with node properties matching React Flow expectations
        flow = Flow(
            name="Simple Welcome Flow",
            description="A basic welcome flow template created by the open endpoint",
            nodes=[
                {
                    "id": f"node_{int(time.time())}_1",
                    "type": "messageNode",
                    "position": {"x": 250, "y": 100},
                    "data": {
                        "label": "Welcome Message",
                        "message": "Hello! Welcome to our service. How can we help you today?",  # Using 'message' instead of 'content'
                        "type": "text"
                    }
                },
                {
                    "id": f"node_{int(time.time())}_2",
                    "type": "waitNode",
                    "position": {"x": 250, "y": 250},
                    "data": {
                        "label": "Wait for Response",
                        "timeout": 0,              # Using 'timeout' instead of 'waitTime'
                        "timeoutUnit": "minutes"   # Using 'timeoutUnit' instead of 'waitUnit'
                    }
                }
            ],
            edges=[],
            is_active=False,
            is_preset=True,
            user_id=None
        )
        
        # Add edge connecting the nodes
        edge_id = f"edge_{int(time.time())}"
        flow.edges = [
            {
                "id": edge_id,
                "source": flow.nodes[0]["id"],
                "target": flow.nodes[1]["id"]
            }
        ]
        
        flow.save()
        print(f"OPEN ENDPOINT: Created simple preset flow: {flow.name}")
        print(f"OPEN ENDPOINT: Node structure: {flow.nodes[0]['data']}")
        
        # Get all presets to return
        all_presets = Flow.find_presets()
        
        return jsonify({
            "success": True,
            "message": "Simple preset flow created successfully",
            "flow": flow.to_dict(),
            "all_presets": [p.to_dict() for p in all_presets]
        }), 201
    except Exception as e:
        print(f"OPEN ENDPOINT ERROR: {e}")
        return jsonify({
            "success": False,
            "message": f"Failed to create simple preset flow: {str(e)}"
        }), 500 