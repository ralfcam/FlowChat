"""
Authentication middleware for the FlowChat API.
"""

import os
from functools import wraps
from flask import request, jsonify, g
import jwt
from app.models.user import User
from flask import current_app

# Check if we're in development mode with auth bypass enabled
DEV_MODE = os.environ.get('FLASK_ENV') == 'development'
DEV_AUTH_BYPASS = os.environ.get('DEV_AUTH_BYPASS', 'true').lower() == 'true'

# Mock admin user for development
class MockAdminUser:
    def __init__(self):
        self._id = 'dev-user-id'
        self.email = 'admin@flowchat.com'
        self.name = 'Development Admin'
        self.role = 'admin'

def token_required(f):
    """
    Decorator to require a valid JWT token for API access.
    Places the authenticated user in g.user
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Bypass authentication in development mode if enabled
        if DEV_MODE and DEV_AUTH_BYPASS:
            g.user = MockAdminUser()
            return f(*args, **kwargs)
            
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        # Return error if no token provided
        if not token:
            return jsonify({
                'success': False,
                'message': 'Authentication token is missing'
            }), 401
        
        try:
            # Decode the token
            data = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get the user from the database
            current_user = User.find_by_id(data['user_id'])
            
            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 401
            
            # Store user in g object
            g.user = current_user
            
        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token has expired'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Invalid token'
            }), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """
    Decorator to require an admin user for API access.
    Must be used after token_required.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Bypass admin check in development mode if enabled
        if DEV_MODE and DEV_AUTH_BYPASS:
            return f(*args, **kwargs)
            
        if not hasattr(g, 'user') or not g.user:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
            
        if not hasattr(g.user, 'role') or g.user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin privileges required'
            }), 403
            
        return f(*args, **kwargs)
    
    return decorated 