"""
Authentication service.
"""

import datetime
import jwt
from flask import current_app
from app.models.user import User


class AuthService:
    """Service for user authentication."""
    
    @staticmethod
    def login(email, password):
        """Authenticate a user and generate JWT token."""
        user = User.find_by_email(email)
        
        if not user or not user.verify_password(password):
            return None, "Invalid email or password"
        
        # Generate access token
        access_token = AuthService.generate_token(user)
        
        return {
            'user': user.to_dict(),
            'access_token': access_token
        }, None
    
    @staticmethod
    def register(email, name, password, role='user'):
        """Register a new user."""
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return None, "Email already registered"
        
        # Create new user
        user = User(email=email, name=name, password=password, role=role)
        user.save()
        
        # Generate access token
        access_token = AuthService.generate_token(user)
        
        return {
            'user': user.to_dict(),
            'access_token': access_token
        }, None
    
    @staticmethod
    def generate_token(user):
        """Generate JWT token for a user."""
        payload = {
            'sub': str(user._id),
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(
                seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            )
        }
        
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
    
    @staticmethod
    def verify_token(token):
        """Verify JWT token and return user."""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            user_id = payload['sub']
            return User.find_by_id(user_id), None
            
        except jwt.ExpiredSignatureError:
            return None, "Token expired"
        except jwt.InvalidTokenError:
            return None, "Invalid token"
    
    @staticmethod
    def change_password(user_id, current_password, new_password):
        """Change user password."""
        user = User.find_by_id(user_id)
        
        if not user:
            return False, "User not found"
        
        if not user.verify_password(current_password):
            return False, "Current password is incorrect"
        
        # Update password
        user.password_hash = new_password
        user.save()
        
        return True, None 