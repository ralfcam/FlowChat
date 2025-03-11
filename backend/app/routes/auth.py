"""
Authentication routes.
"""

from flask import Blueprint, request, jsonify
from app.services.auth import AuthService

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login endpoint."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
        
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    result, error = AuthService.login(email, password)
    
    if error:
        return jsonify({'error': error}), 401
        
    return jsonify({'data': result}), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register endpoint."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
        
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not email or not password or not name:
        return jsonify({'error': 'Email, password, and name are required'}), 400
    
    result, error = AuthService.register(email, name, password)
    
    if error:
        return jsonify({'error': error}), 400
        
    return jsonify({'data': result}), 201


@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    """Change password endpoint."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
        
    user_id = data.get('user_id')
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not user_id or not current_password or not new_password:
        return jsonify({
            'error': 'User ID, current password, and new password are required'
        }), 400
    
    success, error = AuthService.change_password(
        user_id, current_password, new_password
    )
    
    if not success:
        return jsonify({'error': error}), 400
        
    return jsonify({'message': 'Password changed successfully'}), 200 