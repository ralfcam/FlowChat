#!/usr/bin/env python
"""
View messages and contacts in the MongoDB database.

This script provides a detailed view of the messages and contacts in the MongoDB database,
making it easier to debug WhatsApp integration issues.
"""
from pymongo import MongoClient
import json
import sys
import argparse
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


def connect_to_mongodb(uri='mongodb://localhost:27017/', db_name='flowchat'):
    """Connect to MongoDB and return the database object."""
    try:
        print(f"Connecting to MongoDB at {uri}...")
        client = MongoClient(uri)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB server")
        
        # Get database
        db = client[db_name]
        print(f"Using database: {db_name}")
        
        return db
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {str(e)}")
        sys.exit(1)


def view_collections(db):
    """View all collections in the database."""
    print("\n==== Database Collections ====")
    collections = db.list_collection_names()
    if collections:
        print(f"Collections: {', '.join(collections)}")
    else:
        print("No collections found.")
    return collections


def view_messages(db, limit=10, show_metadata=False, phone_filter=None, direction=None):
    """View messages in the database."""
    print(f"\n==== Recent Messages (limit: {limit}) ====")
    
    # Build query
    query = {}
    if phone_filter:
        query['$or'] = [
            {'to_contact': phone_filter},
            {'from_user': phone_filter}
        ]
    if direction:
        query['direction'] = direction
        
    # Get messages
    try:
        messages = list(db.messages.find(query).sort('created_at', -1).limit(limit))
        
        if not messages:
            print("No messages found.")
            return
            
        print(f"Found {len(messages)} messages:")
        
        for i, msg in enumerate(messages):
            print(f"\n[{i+1}] Message ID: {msg['_id']}")
            print(f"    Content: {msg.get('content', '(No content)')}")
            print(f"    Type: {msg.get('message_type', 'unknown')}")
            print(f"    Status: {msg.get('status', 'unknown')}")
            print(f"    Direction: {msg.get('direction', 'unknown')}")
            print(f"    From: {msg.get('from_user', 'None')}")
            print(f"    To: {msg.get('to_contact', 'None')}")
            print(f"    Created: {msg.get('created_at', 'unknown')}")
            
            if show_metadata and 'metadata' in msg:
                print("    Metadata:")
                metadata = msg['metadata']
                for key, value in metadata.items():
                    # If value is a nested dictionary, pretty print it
                    if isinstance(value, dict):
                        print(f"        {key}:")
                        for k, v in value.items():
                            print(f"            {k}: {v}")
                    else:
                        print(f"        {key}: {value}")
    
    except Exception as e:
        print(f"❌ Error retrieving messages: {str(e)}")


def view_contacts(db, limit=5, phone_filter=None):
    """View contacts in the database."""
    print(f"\n==== Contacts (limit: {limit}) ====")
    
    # Build query
    query = {}
    if phone_filter:
        query['phone'] = phone_filter
        
    # Get contacts
    try:
        contacts = list(db.contacts.find(query).limit(limit))
        
        if not contacts:
            print("No contacts found.")
            return
            
        print(f"Found {len(contacts)} contacts:")
        
        for i, contact in enumerate(contacts):
            print(f"\n[{i+1}] Contact ID: {contact['_id']}")
            print(f"    Name: {contact.get('name', '(No name)')}")
            print(f"    Phone: {contact.get('phone', 'unknown')}")
            print(f"    Email: {contact.get('email', '(No email)')}")
            print(f"    Tags: {', '.join(contact.get('tags', []))}")
            print(f"    Created: {contact.get('created_at', 'unknown')}")
    
    except Exception as e:
        print(f"❌ Error retrieving contacts: {str(e)}")


def main():
    """Run the script with command line arguments."""
    parser = argparse.ArgumentParser(description="View WhatsApp messages and contacts in MongoDB")
    
    parser.add_argument("--uri", default="mongodb://localhost:27017/", help="MongoDB connection URI")
    parser.add_argument("--db", default="flowchat", help="Database name")
    parser.add_argument("--msg-limit", type=int, default=10, help="Maximum number of messages to show")
    parser.add_argument("--contact-limit", type=int, default=5, help="Maximum number of contacts to show")
    parser.add_argument("--metadata", action="store_true", help="Show message metadata")
    parser.add_argument("--phone", help="Filter by phone number")
    parser.add_argument("--direction", choices=["inbound", "outbound"], help="Filter messages by direction")
    
    args = parser.parse_args()
    
    # Connect to database
    db = connect_to_mongodb(args.uri, args.db)
    
    # View collections
    collections = view_collections(db)
    
    # View messages if collection exists
    if 'messages' in collections:
        view_messages(db, args.msg_limit, args.metadata, args.phone, args.direction)
    
    # View contacts if collection exists
    if 'contacts' in collections:
        view_contacts(db, args.contact_limit, args.phone)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nScript interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1) 