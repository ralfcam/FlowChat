print("Starting MongoDB connection test...")

try:
    from pymongo import MongoClient
    print("Successfully imported pymongo")
except ImportError as e:
    print(f"Failed to import pymongo: {str(e)}")
    exit(1)

print("Trying to connect to MongoDB...")
try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=3000)
    print("Created MongoClient instance")
    
    print("Testing connection...")
    client.admin.command('ping')
    print("MongoDB connection successful!")
except Exception as e:
    print(f"Failed to connect to MongoDB: {str(e)}")
    exit(1)

print("MongoDB test completed successfully!") 