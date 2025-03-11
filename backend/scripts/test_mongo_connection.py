from pymongo import MongoClient
import sys
import socket
import subprocess

def check_mongo_service_status():
    print("Checking MongoDB service status...")
    try:
        # Try to connect to the MongoDB port
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', 27017))
        sock.close()
        
        if result == 0:
            print("✅ Port 27017 is open and accepting connections")
            return True
        else:
            print("❌ Port 27017 is not accessible (MongoDB may not be running)")
            return False
    except Exception as e:
        print(f"❌ Error checking port: {str(e)}")
        return False

def try_mongo_connection():
    print("\nAttempting MongoDB connection...")
    try:
        # Try with a short timeout
        client = MongoClient('mongodb://localhost:27017/', 
                            serverSelectionTimeoutMS=2000,
                            connectTimeoutMS=2000)
        
        # Force a connection to verify it works
        info = client.server_info()
        print("✅ MongoDB connection successful!")
        print(f"Server version: {info.get('version', 'unknown')}")
        return True
        
    except Exception as e:
        print("❌ Failed to connect to MongoDB:")
        print(str(e))
        return False

if __name__ == "__main__":
    print("=== MongoDB Connection Diagnostic ===\n")
    
    # Check if port is open
    port_ok = check_mongo_service_status()
    
    # Try connection anyway
    connection_ok = try_mongo_connection()
    
    print("\n=== Summary ===")
    if port_ok:
        print("✅ MongoDB port check: PASSED")
    else:
        print("❌ MongoDB port check: FAILED")
        
    if connection_ok:
        print("✅ MongoDB connection: PASSED")
    else:
        print("❌ MongoDB connection: FAILED")
        
    print("\nTroubleshooting Tips:")
    if not port_ok or not connection_ok:
        print("1. Check if MongoDB service is installed and running:")
        print("   - Open Services (services.msc)")
        print("   - Look for 'MongoDB' service and ensure it's 'Running'")
        print("   - If not present, MongoDB may not be installed as a service")
        print("\n2. Try starting MongoDB manually:")
        print("   - Navigate to MongoDB bin directory (e.g., C:\\Program Files\\MongoDB\\Server\\X.X\\bin)")
        print("   - Run: mongod.exe --dbpath=\"C:\\Program Files\\MongoDB\\Server\\X.X\\data\"")
        
    sys.exit(0 if connection_ok else 1) 