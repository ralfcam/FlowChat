"""
Contact model for MongoDB.
"""

import datetime
from bson import ObjectId
from app import get_db


class Contact:
    """Contact model for WhatsApp contacts."""
    
    collection_name = 'contacts'
    
    def __init__(self, 
                 phone, 
                 name=None, 
                 email=None, 
                 tags=None,
                 metadata=None,
                 _id=None):
        """Initialize a new Contact instance."""
        self.phone = phone
        self.name = name
        self.email = email
        self.tags = tags or []
        self.metadata = metadata or {}
        self._id = _id if _id else ObjectId()
        self.created_at = datetime.datetime.utcnow()
        self.updated_at = self.created_at
    
    def to_dict(self):
        """Convert the contact object to a dictionary."""
        return {
            '_id': self._id,
            'phone': self.phone,
            'name': self.name,
            'email': self.email,
            'tags': self.tags,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def find_by_id(cls, contact_id):
        """Find a contact by ID."""
        db = get_db()
        data = db[cls.collection_name].find_one({'_id': ObjectId(contact_id)})
        return cls.from_dict(data) if data else None
    
    @classmethod
    def find_by_phone(cls, phone):
        """Find a contact by phone number."""
        db = get_db()
        data = db[cls.collection_name].find_one({'phone': phone})
        return cls.from_dict(data) if data else None
    
    @classmethod
    def create(cls, data):
        """Create a new contact and save it to the database."""
        # Extract required fields
        phone = data.get('phone')
        if not phone:
            raise ValueError("Phone number is required")
            
        # Create contact instance
        contact = cls(
            phone=phone,
            name=data.get('name'),
            email=data.get('email'),
            tags=data.get('tags', []),
            metadata=data.get('metadata', {})
        )
        
        # Save to database
        contact.save()
        
        return contact
    
    @classmethod
    def search(cls, query=None, tags=None, limit=50, skip=0):
        """Search for contacts based on query text or tags."""
        db = get_db()
        filter_query = {}
        
        # Add text search if query is provided
        if query:
            filter_query['$or'] = [
                {'name': {'$regex': query, '$options': 'i'}},
                {'email': {'$regex': query, '$options': 'i'}},
                {'phone': {'$regex': query, '$options': 'i'}}
            ]
            
        # Add tag filter if tags are provided
        if tags:
            filter_query['tags'] = {'$in': tags if isinstance(tags, list) else [tags]}
            
        cursor = db[cls.collection_name].find(filter_query).skip(skip).limit(limit)
        return [cls.from_dict(contact) for contact in cursor]
    
    @classmethod
    def from_dict(cls, data):
        """Create a contact instance from a dictionary."""
        if not data:
            return None
        
        contact = cls(
            phone=data['phone'],
            name=data.get('name'),
            email=data.get('email'),
            tags=data.get('tags', []),
            metadata=data.get('metadata', {}),
            _id=data['_id']
        )
        contact.created_at = data.get('created_at', datetime.datetime.utcnow())
        contact.updated_at = data.get('updated_at', datetime.datetime.utcnow())
        return contact
    
    def save(self):
        """Save the contact to the database."""
        db = get_db()
        self.updated_at = datetime.datetime.utcnow()
        
        result = db[self.collection_name].update_one(
            {'_id': self._id},
            {'$set': self.to_dict()},
            upsert=True
        )
        
        return result
    
    def add_tag(self, tag):
        """Add a tag to the contact."""
        if tag not in self.tags:
            self.tags.append(tag)
            return self.save()
        return None
    
    def remove_tag(self, tag):
        """Remove a tag from the contact."""
        if tag in self.tags:
            self.tags.remove(tag)
            return self.save()
        return None
    
    def delete(self):
        """Delete the contact from the database."""
        db = get_db()
        result = db[self.collection_name].delete_one({'_id': self._id})
        return result.deleted_count > 0 