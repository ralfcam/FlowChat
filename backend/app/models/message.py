"""
Message model for MongoDB.
"""

import datetime
from bson import ObjectId
from app import get_db


class Message:
    """Message model for WhatsApp messages."""
    
    collection_name = 'messages'
    
    def __init__(self, 
                 content, 
                 from_user=None, 
                 to_contact=None, 
                 message_type='text', 
                 status='pending',
                 metadata=None,
                 _id=None):
        """Initialize a new Message instance."""
        self.content = content
        self.from_user = from_user
        self.to_contact = to_contact
        self.message_type = message_type  # text, media, template
        self.status = status  # pending, sent, delivered, read, failed
        self.metadata = metadata or {}
        self._id = _id if _id else ObjectId()
        self.created_at = datetime.datetime.utcnow()
        self.updated_at = self.created_at
    
    def to_dict(self):
        """Convert the message object to a dictionary."""
        return {
            '_id': self._id,
            'content': self.content,
            'from_user': self.from_user,
            'to_contact': self.to_contact,
            'message_type': self.message_type,
            'status': self.status,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def find_by_id(cls, message_id):
        """Find a message by ID."""
        db = get_db()
        data = db[cls.collection_name].find_one({'_id': ObjectId(message_id)})
        return cls.from_dict(data) if data else None
    
    @classmethod
    def find_by_contact(cls, contact_id, limit=50, skip=0):
        """Find messages by contact ID."""
        db = get_db()
        cursor = db[cls.collection_name].find(
            {'to_contact': contact_id}
        ).sort('created_at', -1).skip(skip).limit(limit)
        
        return [cls.from_dict(msg) for msg in cursor]
    
    @classmethod
    def from_dict(cls, data):
        """Create a message instance from a dictionary."""
        if not data:
            return None
        
        message = cls(
            content=data['content'],
            from_user=data.get('from_user'),
            to_contact=data.get('to_contact'),
            message_type=data.get('message_type', 'text'),
            status=data.get('status', 'pending'),
            metadata=data.get('metadata', {}),
            _id=data['_id']
        )
        message.created_at = data.get('created_at', datetime.datetime.utcnow())
        message.updated_at = data.get('updated_at', datetime.datetime.utcnow())
        return message
    
    @classmethod
    def create(cls, data):
        """Create a new message and save it to the database."""
        # Extract required fields
        content = data.get('content')
        if not content:
            raise ValueError("Message content is required")
            
        # Create message instance
        message = cls(
            content=content,
            from_user=data.get('user_id') or data.get('from_user'),
            to_contact=data.get('contact_id') or data.get('to_contact'),
            message_type=data.get('message_type', 'text'),
            status=data.get('status', 'pending'),
            metadata=data.get('metadata', {})
        )
        
        # Save to database
        message.save()
        
        return message
    
    def save(self):
        """Save the message to the database."""
        db = get_db()
        self.updated_at = datetime.datetime.utcnow()
        
        result = db[self.collection_name].update_one(
            {'_id': self._id},
            {'$set': self.to_dict()},
            upsert=True
        )
        
        return result
    
    def update_status(self, status):
        """Update the message status."""
        self.status = status
        self.updated_at = datetime.datetime.utcnow()
        
        db = get_db()
        result = db[self.collection_name].update_one(
            {'_id': self._id},
            {'$set': {
                'status': status,
                'updated_at': self.updated_at
            }}
        )
        
        return result
    
    @classmethod
    def update(cls, message_id, data):
        """Update a message with new data."""
        message = cls.find_by_id(message_id)
        if not message:
            return None
            
        # Update fields
        for key, value in data.items():
            if hasattr(message, key):
                setattr(message, key, value)
                
        # Update timestamp
        message.updated_at = datetime.datetime.utcnow()
        
        # Save changes
        message.save()
        
        return message
    
    def delete(self):
        """Delete the message from the database."""
        db = get_db()
        result = db[self.collection_name].delete_one({'_id': self._id})
        return result.deleted_count > 0 