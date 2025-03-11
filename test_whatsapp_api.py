import requests
import json
import sys

# API endpoint
BASE_URL = 'http://localhost:5000/api'
SEND_ENDPOINT = f'{BASE_URL}/whatsapp/send'

# Test data - using your WhatsApp number
message_data = {
    "to": "+34611151646",
    "body": "Hello from FlowChat API test! ✉️",
    "type": "text"
}

print("==== WhatsApp API Integration Test ====")
print(f"Sending message to {message_data['to']}...")

try:
    # Send the message
    response = requests.post(SEND_ENDPOINT, json=message_data)
    
    # Check the response
    if response.status_code == 200 or response.status_code == 201:
        print(f"✅ Message sent successfully (Status: {response.status_code})")
        
        # Print the response data
        response_data = response.json()
        print("\nResponse data:")
        print(json.dumps(response_data, indent=2))
        
        # Extract message ID if available
        message_id = None
        if 'data' in response_data and 'message_id' in response_data['data']:
            message_id = response_data['data']['message_id']
        elif 'data' in response_data and 'sid' in response_data['data']:
            message_id = response_data['data']['sid']
        
        if message_id:
            print(f"\nMessage ID: {message_id}")
    else:
        print(f"❌ Failed to send message (Status: {response.status_code})")
        print("Error response:")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
            
except requests.RequestException as e:
    print(f"❌ Request error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    
print("\n==== Test Complete ====") 