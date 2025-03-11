from pymongo import MongoClient
import datetime
from bson import ObjectId
import json
import sys

# MongoDB BSON serializer for ObjectId and datetime
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

print("==== MongoDB Message Storage Test ====")
print("Connecting to MongoDB...")

try:
    # Connect to MongoDB
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
    
    # Force a connection check
    client.admin.command('ping')
    print("✅ Connected to MongoDB server")
    
    # Select database
    db = client['flowchat']
    print(f"Using database: flowchat")
    
    # Test data
    contact = {
        'phone': '+34611151646',
        'name': 'Test WhatsApp',
        'email': 'whatsapp@test.com',
        'tags': ['whatsapp', 'test'],
        'metadata': {},
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }
    
    message = {
        'content': 'Hello! This is a test message.',
        'to_contact': '+34611151646',
        'from_user': None,
        'message_type': 'text',
        'status': 'sent',
        'metadata': {'source': 'test_script'},
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }
    
    print("\nChecking existing collections...")
    existing_collections = db.list_collection_names()
    print(f"Found collections: {existing_collections if existing_collections else 'None'}")
    
    # No need to explicitly create collections in MongoDB
    # They are created automatically when the first document is inserted
    
    print("\nStoring test contact...")
    # Insert contact
    contact_result = db.contacts.update_one(
        {'phone': contact['phone']},
        {'$set': contact},
        upsert=True
    )
    
    if contact_result.upserted_id:
        print(f"✅ Created new contact: {contact['phone']}")
    else:
        print(f"✅ Updated existing contact: {contact['phone']}")
    
    print("\nStoring test message...")
    # Insert message
    message_result = db.messages.insert_one(message)
    message_id = message_result.inserted_id
    print(f"✅ Created message with ID: {message_id}")
    
    print("\nRetrieving message by ID...")
    # Retrieve message
    stored_message = db.messages.find_one({'_id': message_id})
    if stored_message:
        print(f"✅ Retrieved message from database:")
        print(json.dumps(stored_message, indent=2, cls=JSONEncoder))
    else:
        print("❌ Failed to retrieve the message")
    
    print("\nRetrieving messages for contact...")
    # Retrieve messages for contact
    contact_messages = list(db.messages.find({'to_contact': contact['phone']}))
    print(f"✅ Found {len(contact_messages)} messages for contact {contact['phone']}")
    
    for msg in contact_messages:
        print(f"- Message {msg['_id']}: {msg['content']} ({msg['status']})")
    
    print("\n==== Database Status ====")
    current_collections = db.list_collection_names()
    print(f"Collections: {current_collections}")
    print(f"Contacts: {db.contacts.count_documents({})}")
    print(f"Messages: {db.messages.count_documents({})}")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    sys.exit(1)
    
print("\n==== Test Complete ====") 