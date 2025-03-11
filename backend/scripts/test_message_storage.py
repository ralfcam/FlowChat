#!/usr/bin/env python
"""
MongoDB Message Storage Test Script for FlowChat.

Tests storing and retrieving messages and contacts in MongoDB,
with specific focus on WhatsApp integration.
"""
import datetime
import json
import sys
import argparse
from bson import ObjectId
from pymongo import MongoClient

# MongoDB BSON serializer for ObjectId and datetime
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)


def connect_to_mongodb(uri, database):
    """Connect to MongoDB and return client and database objects."""
    try:
        print(f"Connecting to MongoDB: {uri}, database: {database}")
        client = MongoClient(uri)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB server")
        
        # Select database
        db = client[database]
        print(f"Using database: {database}")
        
        return client, db
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {str(e)}")
        sys.exit(1)


def create_test_contact(db, phone, name=None):
    """Create or update a test contact."""
    if not name:
        name = f"Test Contact ({phone})"
        
    contact = {
        'phone': phone,
        'name': name,
        'email': f"contact_{phone.replace('+', '')}@test.com",
        'tags': ['test', 'whatsapp'],
        'metadata': {
            'source': 'test_script',
            'created_at': datetime.datetime.utcnow().isoformat()
        },
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }
    
    print(f"\nStoring test contact: {phone}...")
    
    # Insert or update contact
    result = db.contacts.update_one(
        {'phone': phone},
        {'$set': contact},
        upsert=True
    )
    
    if result.upserted_id:
        print(f"✅ Created new contact with ID: {result.upserted_id}")
        # Fetch the contact to get the ID
        return db.contacts.find_one({'_id': result.upserted_id})
    else:
        print(f"✅ Updated existing contact ({result.modified_count} modified)")
        # Fetch the contact
        return db.contacts.find_one({'phone': phone})


def create_test_message(db, contact_id, content, direction='outbound', message_type='text', status='sent'):
    """Create a test message."""
    message = {
        'content': content,
        'direction': direction,
        'message_type': message_type,
        'status': status,
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow(),
        'metadata': {
            'source': 'test_script',
            'test_time': datetime.datetime.utcnow().isoformat()
        }
    }
    
    # Set the appropriate fields based on message direction
    if direction == 'outbound':
        message['to_contact'] = str(contact_id)
        message['from_user'] = None
    else:  # inbound
        message['from_user'] = str(contact_id)
        message['to_contact'] = None
    
    print(f"\nStoring test {direction} message...")
    
    # Insert message
    result = db.messages.insert_one(message)
    
    print(f"✅ Created message with ID: {result.inserted_id}")
    print(f"Message details:")
    print(f"  Content: {content}")
    print(f"  Direction: {direction}")
    print(f"  Status: {status}")
    print(f"  Type: {message_type}")
    
    # Fetch the message
    return db.messages.find_one({'_id': result.inserted_id})


def test_message_retrieval(db, contact_id):
    """Test retrieving messages for a contact."""
    print(f"\nTesting message retrieval for contact: {contact_id}")
    
    # Find messages where contact is either sender or receiver
    messages = list(db.messages.find({
        '$or': [
            {'to_contact': str(contact_id)},
            {'from_user': str(contact_id)}
        ]
    }).sort('created_at', -1))
    
    print(f"Found {len(messages)} messages for this contact:")
    
    for i, msg in enumerate(messages):
        print(f"\n[{i+1}] Message ID: {msg['_id']}")
        print(f"  Content: {msg.get('content', '(No content)')}")
        print(f"  Direction: {msg.get('direction', 'unknown')}")
        print(f"  Status: {msg.get('status', 'unknown')}")
        print(f"  Created: {msg.get('created_at', 'unknown')}")
    
    return messages


def main():
    """Run the script with command line arguments."""
    parser = argparse.ArgumentParser(description="Test MongoDB storage for WhatsApp messages")
    
    parser.add_argument("--uri", default="mongodb://localhost:27017/", help="MongoDB connection URI")
    parser.add_argument("--db", default="flowchat", help="Database name")
    parser.add_argument("--phone", default="+34611151646", help="Phone number for test contact")
    parser.add_argument("--inbound", action="store_true", help="Create an inbound test message")
    parser.add_argument("--outbound", action="store_true", help="Create an outbound test message")
    
    args = parser.parse_args()
    
    # Connect to database
    client, db = connect_to_mongodb(args.uri, args.db)
    
    try:
        # Check existing collections
        print("\nChecking existing collections...")
        existing_collections = db.list_collection_names()
        print(f"Found collections: {', '.join(existing_collections) if existing_collections else 'None'}")
        
        # Create test contact
        contact = create_test_contact(db, args.phone)
        
        # If no specific message direction is specified, create both
        create_inbound = args.inbound or not (args.inbound or args.outbound)
        create_outbound = args.outbound or not (args.inbound or args.outbound)
        
        # Create test messages
        if create_outbound:
            outbound_message = create_test_message(
                db, 
                contact['_id'],
                f"This is a test outbound message sent at {datetime.datetime.utcnow().isoformat()}",
                direction='outbound'
            )
        
        if create_inbound:
            inbound_message = create_test_message(
                db, 
                contact['_id'],
                f"This is a test inbound message received at {datetime.datetime.utcnow().isoformat()}",
                direction='inbound',
                status='delivered'
            )
        
        # Test message retrieval
        test_message_retrieval(db, contact['_id'])
        
        print("\n✅ MongoDB message storage test completed successfully.")
        
    except Exception as e:
        print(f"\n❌ Error during test: {str(e)}")
    finally:
        # Close connection
        client.close()
        print("\nMongoDB connection closed.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nScript interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1) 