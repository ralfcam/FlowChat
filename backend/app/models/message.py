"""
Message model for MongoDB.
"""

import datetime
from bson import ObjectId
from app import get_db


class Message:
    """Message model for WhatsApp messages."""
    
    collection_name = 'messages'
    
    # Ensure indexes exist for efficient querying
    @classmethod
    def ensure_indexes(cls):
        db = get_db()
        # Create indexes for common query patterns
        db[cls.collection_name].create_index([("to_contact", 1), ("created_at", -1)])
        db[cls.collection_name].create_index([("from_user", 1), ("created_at", -1)])
        db[cls.collection_name].create_index([("status", 1)])
    
    def __init__(self, 
                 content, 
                 from_user=None, 
                 to_contact=None, 
                 message_type='text', 
                 status='pending',
                 direction='outbound',
                 metadata=None,
                 _id=None):
        """Initialize a new Message instance."""
        self.content = content
        self.from_user = from_user
        self.to_contact = to_contact
        self.message_type = message_type  # text, media, template
        self.status = status  # pending, sent, delivered, read, failed
        self.direction = direction  # inbound, outbound
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
            'direction': self.direction,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def find_by_id(cls, message_id):
        """Find a message by ID."""
        db = get_db()
        if isinstance(message_id, str):
            try:
                message_id = ObjectId(message_id)
            except:
                return None
        data = db[cls.collection_name].find_one({'_id': message_id})
        return cls.from_dict(data) if data else None
    
    @classmethod
    def find_by_contact(cls, contact_id, limit=50, skip=0):
        """Find messages by contact ID."""
        db = get_db()
        # Find messages where the contact is either sender or receiver
        cursor = db[cls.collection_name].find(
            {'$or': [
                {'to_contact': contact_id},
                {'from_user': contact_id}
            ]}
        ).sort('created_at', -1).skip(skip).limit(limit)
        
        return [cls.from_dict(msg) for msg in cursor]
    
    @classmethod
    def find_chat_messages(cls, user_id, contact_id, limit=50, skip=0):
        """Find all messages in a chat between user and contact."""
        db = get_db()
        # Find messages exchanged between a user and contact
        cursor = db[cls.collection_name].find(
            {'$or': [
                {'from_user': user_id, 'to_contact': contact_id},
                {'from_user': contact_id, 'to_contact': user_id}
            ]}
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
            direction=data.get('direction', 'outbound'),
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
            direction=data.get('direction', 'outbound'),
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
    
    @classmethod
    def count_unread_messages(cls, contact_id):
        """Count unread messages for a contact."""
        db = get_db()
        count = db[cls.collection_name].count_documents({
            'to_contact': contact_id,
            'status': {'$ne': 'read'},
            'direction': 'inbound'
        })
        return count 