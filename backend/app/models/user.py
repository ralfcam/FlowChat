"""
User model for MongoDB.
"""

import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from app import get_db


class User:
    """User model for MongoDB."""
    
    collection_name = 'users'
    
    def __init__(self, email, name, password=None, role='user', _id=None):
        """Initialize a new User instance."""
        self.email = email
        self.name = name
        self.password_hash = generate_password_hash(password) if password else None
        self.role = role
        self._id = _id if _id else ObjectId()
        self.created_at = datetime.datetime.utcnow()
        self.updated_at = self.created_at
    
    def to_dict(self):
        """Convert the user object to a dictionary."""
        return {
            '_id': self._id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    def verify_password(self, password):
        """Verify the user's password."""
        return check_password_hash(self.password_hash, password)
    
    @classmethod
    def find_by_id(cls, user_id):
        """Find a user by ID."""
        db = get_db()
        data = db[cls.collection_name].find_one({'_id': ObjectId(user_id)})
        return cls.from_dict(data) if data else None
    
    @classmethod
    def find_by_email(cls, email):
        """Find a user by email."""
        db = get_db()
        data = db[cls.collection_name].find_one({'email': email})
        return cls.from_dict(data) if data else None
    
    @classmethod
    def from_dict(cls, data):
        """Create a user instance from a dictionary."""
        if not data:
            return None
        
        user = cls(
            email=data['email'],
            name=data['name'],
            role=data.get('role', 'user'),
            _id=data['_id']
        )
        user.password_hash = data.get('password_hash')
        user.created_at = data.get('created_at', datetime.datetime.utcnow())
        user.updated_at = data.get('updated_at', datetime.datetime.utcnow())
        return user
    
    def save(self):
        """Save the user to the database."""
        db = get_db()
        self.updated_at = datetime.datetime.utcnow()
        
        data = self.to_dict()
        if self.password_hash:
            data['password_hash'] = self.password_hash
        
        result = db[self.collection_name].update_one(
            {'_id': self._id},
            {'$set': data},
            upsert=True
        )
        
        return result
    
    def delete(self):
        """Delete the user from the database."""
        db = get_db()
        result = db[self.collection_name].delete_one({'_id': self._id})
        return result.deleted_count > 0 