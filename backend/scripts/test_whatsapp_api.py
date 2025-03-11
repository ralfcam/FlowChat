import requests
import json
import sys
import argparse
from datetime import datetime

def parse_arguments():
    parser = argparse.ArgumentParser(description='Test WhatsApp API Integration')
    parser.add_argument('--to', default='+34611151646', help='Recipient phone number in E.164 format')
    parser.add_argument('--body', default='Hello from FlowChat API test! ✉️', help='Message body to send')
    parser.add_argument('--type', default='text', help='Message type (text, template)')
    parser.add_argument('--template', help='Template name (if using template type)')
    parser.add_argument('--url', default='http://localhost:5000/api', help='Base API URL')
    return parser.parse_args()

def main():
    args = parse_arguments()
    
    # API endpoints
    BASE_URL = args.url
    SEND_ENDPOINT = f'{BASE_URL}/whatsapp/send'
    TEMPLATE_ENDPOINT = f'{BASE_URL}/whatsapp/send-template'
    
    # Test data
    if args.type == 'text':
        message_data = {
            "to": args.to,
            "body": args.body,
            "type": args.type,
            "metadata": {
                "sent_from": "api_test_script",
                "timestamp": datetime.now().isoformat()
            }
        }
        endpoint = SEND_ENDPOINT
    elif args.type == 'template' and args.template:
        message_data = {
            "to": args.to,
            "template_name": args.template,
            "parameters": {
                "1": "Test User",
                "2": datetime.now().strftime("%H:%M %p"),
                "3": datetime.now().strftime("%B %d, %Y")
            }
        }
        endpoint = TEMPLATE_ENDPOINT
    else:
        print("❌ Invalid message type or missing template name")
        return
    
    print("==== WhatsApp API Integration Test ====")
    print(f"Sending {args.type} message to {message_data['to']}...")
    print(f"Endpoint: {endpoint}")
    print(f"Payload: {json.dumps(message_data, indent=2)}")
    
    try:
        # Send the message
        response = requests.post(endpoint, json=message_data, timeout=10)
        
        # Check the response
        if response.status_code == 200 or response.status_code == 201:
            print(f"✅ Message sent successfully (Status: {response.status_code})")
            
            # Print the response data
            response_data = response.json()
            print("\nResponse data:")
            print(json.dumps(response_data, indent=2))
            
            # Extract message ID if available
            message_id = None
            if 'message_id' in response_data:
                message_id = response_data['message_id']
            elif 'data' in response_data and 'message_id' in response_data['data']:
                message_id = response_data['data']['message_id']
            
            if message_id:
                print(f"\nMessage ID: {message_id}")
                
                # Optionally retrieve message details
                if args.type == 'text':
                    try:
                        message_details_url = f"{BASE_URL}/messages/{message_id}"
                        message_details = requests.get(message_details_url, timeout=5)
                        if message_details.status_code == 200:
                            print("\nMessage details:")
                            print(json.dumps(message_details.json(), indent=2))
                    except Exception as e:
                        print(f"⚠️ Could not retrieve message details: {e}")
        else:
            print(f"❌ Failed to send message (Status: {response.status_code})")
            print("Error response:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Could not connect to the API server")
        print("Make sure the backend server is running and accessible")
    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n==== Test Complete ====")

if __name__ == "__main__":
    main() 