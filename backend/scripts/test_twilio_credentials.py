#!/usr/bin/env python
"""
Twilio Credentials Verification Script

This script tests your Twilio credentials to ensure they are correctly 
configured and working properly for WhatsApp messaging.
"""
import os
import sys
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from dotenv import load_dotenv

# Add the parent directory to the Python path so we can import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def print_section(title):
    """Print a section title"""
    print("\n" + "=" * 50)
    print(f" {title} ".center(50, "="))
    print("=" * 50)

def main():
    print_section("TWILIO CREDENTIALS CHECKER")
    
    # Load environment variables
    print("\n🔄 Loading environment variables...")
    load_dotenv()
    
    # Get Twilio credentials
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    whatsapp_number = os.getenv('TWILIO_PHONE_NUMBER')
    
    # Check if credentials exist
    if not account_sid:
        print("❌ TWILIO_ACCOUNT_SID is not set in your environment variables or .env file")
        print("   Please set this variable and try again.")
    else:
        masked_sid = f"{account_sid[:5]}...{account_sid[-5:]}" if len(account_sid) > 10 else "***"
        print(f"✅ TWILIO_ACCOUNT_SID is set: {masked_sid}")
    
    if not auth_token:
        print("❌ TWILIO_AUTH_TOKEN is not set in your environment variables or .env file")
        print("   Please set this variable and try again.")
    else:
        masked_token = f"{auth_token[:3]}...{auth_token[-3:]}" if len(auth_token) > 6 else "***"
        print(f"✅ TWILIO_AUTH_TOKEN is set: {masked_token}")
    
    if not whatsapp_number:
        print("❌ TWILIO_PHONE_NUMBER is not set in your environment variables or .env file")
        print("   Please set this variable and try again.")
    else:
        print(f"✅ TWILIO_PHONE_NUMBER is set: {whatsapp_number}")
    
    # Exit early if any credentials are missing
    if not all([account_sid, auth_token, whatsapp_number]):
        print("\n🚫 Cannot proceed with testing - missing credentials.")
        print("   Please fix the above issues and run this script again.\n")
        sys.exit(1)
    
    # Test connection to Twilio API
    print("\n🔄 Testing connection to Twilio API...")
    try:
        client = Client(account_sid, auth_token)
        
        # Verify account info
        print_section("ACCOUNT INFORMATION")
        account = client.api.v2010.accounts(account_sid).fetch()
        print(f"Account SID: {account.sid}")
        print(f"Account Name: {account.friendly_name}")
        print(f"Account Status: {account.status}")
        print(f"Account Type: {account.type}")
        
        # Check WhatsApp number format
        if not whatsapp_number.startswith('+'):
            print("\n⚠️ Warning: WhatsApp number should be in E.164 format (starting with +)")
            print(f"   Current value: {whatsapp_number}")
            print("   Example of correct format: +14155238886")
        
        # Try to list messages (to verify auth works)
        print("\n🔄 Verifying authentication by listing recent messages...")
        messages = client.messages.list(limit=1)
        if messages:
            print(f"✅ Successfully retrieved {len(messages)} recent messages")
            print("   This confirms your authentication credentials are working.")
        else:
            print("✅ Authentication successful, but no messages found in your account.")
        
        print("\n🎉 Success! Your Twilio credentials are correctly configured and working.")
        print("   You should be able to send WhatsApp messages successfully.\n")
        
    except TwilioRestException as e:
        print(f"\n❌ Error connecting to Twilio API: {e}")
        print(f"   Status Code: {e.status}")
        print(f"   Error Code: {e.code}")
        print(f"   Error Message: {e.msg}")
        
        if e.status == 401:
            print("\n   This is an AUTHENTICATION ERROR. Your Account SID or Auth Token is incorrect.")
            print("   Please verify your credentials and try again.")
        
        print("\n🚫 Twilio credentials verification failed. Please fix the issues above and try again.\n")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        print("   Please check your internet connection and try again.\n")
        sys.exit(1)

if __name__ == "__main__":
    main() 