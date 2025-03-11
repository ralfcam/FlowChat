#!/usr/bin/env python
"""
Test script for WhatsApp API integration with FlowChat.

This script tests both sending and receiving WhatsApp messages.
"""
import argparse
import json
import sys
import requests
import time
from pprint import pprint
from datetime import datetime


def send_whatsapp_message(
    recipient: str,
    message: str,
    message_type: str = "text",
    template_name: str = None,
    media_url: str = None,
    base_url: str = "http://localhost:5000"
):
    """
    Send a WhatsApp message through the API.
    
    Args:
        recipient: Phone number to send the message to (E.164 format)
        message: Message content
        message_type: Message type (text, template)
        template_name: Template name (if message_type is template)
        media_url: URL to media file (if sending media)
        base_url: Base URL of the API
    
    Returns:
        dict: API response
    """
    # Ensure phone number is properly formatted
    if not recipient.startswith('+'):
        recipient = f"+{recipient}"
    
    # Prepare the request payload
    payload = {
        "to": recipient,
        "body": message,
        "type": message_type
    }
    
    # Add optional parameters if provided
    if media_url:
        payload["media_url"] = media_url
    
    if template_name and message_type == "template":
        payload["template_name"] = template_name
    
    url = f"{base_url}/api/whatsapp/send"
    
    print(f"Sending message to {recipient}...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"\nStatus code: {response.status_code}")
        
        # Try to parse the response as JSON
        try:
            response_data = response.json()
            print("\nResponse data:")
            pprint(response_data)
            return response_data
        except json.JSONDecodeError:
            print("\nResponse (not JSON):")
            print(response.text)
            return {"success": False, "error": "Invalid JSON response", "text": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"\nRequest error: {e}")
        return {"success": False, "error": str(e)}


def check_chat_history(
    contact_id: str,
    limit: int = 10,
    base_url: str = "http://localhost:5000"
):
    """
    Check chat history with a contact.
    
    Args:
        contact_id: Contact ID or phone number
        limit: Maximum number of messages to retrieve
        base_url: Base URL of the API
    
    Returns:
        dict: API response
    """
    url = f"{base_url}/api/whatsapp/chat/{contact_id}?limit={limit}"
    
    print(f"Checking chat history for contact {contact_id}...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        
        print(f"\nStatus code: {response.status_code}")
        
        # Try to parse the response as JSON
        try:
            response_data = response.json()
            print("\nResponse data:")
            if response_data.get('success') and response_data.get('data'):
                print(f"Found {len(response_data['data'])} messages")
                for i, msg in enumerate(response_data['data']):
                    print(f"\nMessage {i+1}:")
                    print(f"  Content: {msg.get('content', 'No content')}")
                    print(f"  Direction: {msg['direction']}")
                    print(f"  Status: {msg['status']}")
                    print(f"  Timestamp: {msg['timestamp']}")
            else:
                pprint(response_data)
            return response_data
        except json.JSONDecodeError:
            print("\nResponse (not JSON):")
            print(response.text)
            return {"success": False, "error": "Invalid JSON response", "text": response.text}
            
    except requests.exceptions.RequestException as e:
        print(f"\nRequest error: {e}")
        return {"success": False, "error": str(e)}


def simulate_incoming_message(
    from_number: str,
    message_body: str,
    message_sid: str = None,
    base_url: str = "http://localhost:5000"
):
    """
    Simulate an incoming WhatsApp message by calling the webhook directly.
    
    Args:
        from_number: Sender's phone number in E.164 format
        message_body: Message content
        message_sid: Message SID (generated if not provided)
        base_url: Base URL of the API
    
    Returns:
        dict: API response
    """
    # Ensure phone number is properly formatted
    if not from_number.startswith('+'):
        from_number = f"+{from_number}"
    
    # Generate a message SID if not provided
    if not message_sid:
        message_sid = f"SM{int(time.time())}{hash(from_number) % 100000:05d}"
    
    # Create a Twilio-like webhook payload
    webhook_payload = {
        "MessageSid": message_sid,
        "From": from_number,
        "To": "+14155238886",  # Twilio number
        "Body": message_body,
        "Direction": "inbound",
        "NumMedia": "0",
        "NumSegments": "1",
        "SmsStatus": "received",
        "AccountSid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "ApiVersion": "2010-04-01"
    }
    
    url = f"{base_url}/api/whatsapp/webhook"
    
    print(f"Simulating incoming message from {from_number}...")
    print(f"URL: {url}")
    print(f"Message body: {message_body}")
    
    try:
        # Set content type to application/x-www-form-urlencoded to mimic Twilio
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        response = requests.post(url, data=webhook_payload, headers=headers, timeout=30)
        
        print(f"\nStatus code: {response.status_code}")
        print(f"Response text: {response.text}")
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "response_text": response.text
        }
        
    except requests.exceptions.RequestException as e:
        print(f"\nRequest error: {e}")
        return {"success": False, "error": str(e)}


def test_webhook_verification(
    base_url: str = "http://localhost:5000"
):
    """
    Test the webhook verification endpoint.
    
    Args:
        base_url: Base URL of the API
    
    Returns:
        dict: API response
    """
    url = f"{base_url}/api/whatsapp/webhook"
    
    print(f"Testing webhook verification...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        
        print(f"\nStatus code: {response.status_code}")
        print(f"Response text: {response.text}")
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "response_text": response.text
        }
        
    except requests.exceptions.RequestException as e:
        print(f"\nRequest error: {e}")
        return {"success": False, "error": str(e)}


def main():
    """Run the script with command line arguments."""
    parser = argparse.ArgumentParser(description="Test WhatsApp API integration")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Send message command
    send_parser = subparsers.add_parser("send", help="Send a WhatsApp message")
    send_parser.add_argument("--to", "-t", required=True, help="Recipient phone number (E.164 format)")
    send_parser.add_argument("--message", "-m", required=True, help="Message content")
    send_parser.add_argument("--type", choices=["text", "template", "media"], default="text", help="Message type")
    send_parser.add_argument("--template", help="Template name (for template messages)")
    send_parser.add_argument("--media", help="Media URL (for media messages)")
    send_parser.add_argument("--url", default="http://localhost:5000", help="Base URL of the API")
    
    # Get chat history command
    chat_parser = subparsers.add_parser("chat", help="Get chat history with a contact")
    chat_parser.add_argument("--contact", "-c", required=True, help="Contact ID or phone number")
    chat_parser.add_argument("--limit", "-l", type=int, default=10, help="Maximum number of messages to retrieve")
    chat_parser.add_argument("--url", default="http://localhost:5000", help="Base URL of the API")
    
    # Simulate incoming message command
    receive_parser = subparsers.add_parser("receive", help="Simulate an incoming WhatsApp message")
    receive_parser.add_argument("--from", "-f", dest="from_number", required=True, help="Sender's phone number (E.164 format)")
    receive_parser.add_argument("--message", "-m", required=True, help="Message content")
    receive_parser.add_argument("--url", default="http://localhost:5000", help="Base URL of the API")
    
    # Test webhook verification command
    webhook_parser = subparsers.add_parser("webhook", help="Test webhook verification")
    webhook_parser.add_argument("--url", default="http://localhost:5000", help="Base URL of the API")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Default phone number for testing (if no argument provided)
    DEFAULT_PHONE = "+34611151646"
    
    # Execute command
    if args.command == "send":
        send_whatsapp_message(
            recipient=args.to,
            message=args.message,
            message_type=args.type,
            template_name=args.template,
            media_url=args.media,
            base_url=args.url
        )
    elif args.command == "chat":
        check_chat_history(
            contact_id=args.contact,
            limit=args.limit,
            base_url=args.url
        )
    elif args.command == "receive":
        simulate_incoming_message(
            from_number=args.from_number,
            message_body=args.message,
            base_url=args.url
        )
    elif args.command == "webhook":
        test_webhook_verification(
            base_url=args.url
        )
    else:
        # Default behavior (for backward compatibility)
        recipient = DEFAULT_PHONE
        message = "Hello from FlowChat test script! Current time: " + \
                  requests.get("http://worldtimeapi.org/api/ip").json()["datetime"]
                  
        print("No command specified, running default test with:")
        print(f"  Recipient: {recipient}")
        print(f"  Message: {message}")
        
        send_whatsapp_message(recipient, message)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nScript interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1) 