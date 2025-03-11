from pymongo import MongoClient
import json
from bson import ObjectId
from datetime import datetime

# MongoDB BSON serializer for ObjectId and datetime
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['flowchat']

print("==== Database Collections ====")
collections = db.list_collection_names()
print(f"Collections: {collections}")

# Get the most recent messages
print("\n==== Recent Messages ====")
try:
    messages = list(db.messages.find().sort('_id', -1).limit(3))
    if messages:
        for message in messages:
            print(json.dumps(message, indent=2, cls=JSONEncoder))
            print("-" * 50)
    else:
        print("No messages found.")
except Exception as e:
    print(f"Error retrieving messages: {str(e)}")

# Get the contact
print("\n==== Contacts ====")
try:
    contacts = list(db.contacts.find())
    if contacts:
        for contact in contacts:
            print(json.dumps(contact, indent=2, cls=JSONEncoder))
            print("-" * 50)
    else:
        print("No contacts found.")
except Exception as e:
    print(f"Error retrieving contacts: {str(e)}") 