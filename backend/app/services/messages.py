"""
WhatsApp message service.
"""

import os
import requests
import logging
from flask import current_app
from app.models.message import Message
from app.models.contact import Contact
from app.services.twilio_service import TwilioService
from typing import Dict, Any, List, Optional, Union
from datetime import datetime


class WhatsAppService:
    """Service for WhatsApp messaging operations."""
    
    # Initialize provider based on configuration
    _provider = None
    _twilio_service = None
    
    @classmethod
    def get_provider(cls):
        """Get the configured WhatsApp provider."""
        if cls._provider is None:
            # Determine which provider to use based on environment variable
            provider_name = os.getenv('WHATSAPP_PROVIDER', 'direct').lower()
            
            if provider_name == 'twilio':
                if cls._twilio_service is None:
                    cls._twilio_service = TwilioService()
                cls._provider = 'twilio'
            else:
                cls._provider = 'direct'
                
            logging.info(f"Using WhatsApp provider: {cls._provider}")
            
        return cls._provider
    
    @classmethod
    def send_message(cls, content, to_contact, from_user=None, message_type='text', metadata=None, media_url=None):
        """Send a WhatsApp message to a contact."""
        # First ensure we have a contact record
        contact = None
        if isinstance(to_contact, str):
            # Look up or create contact
            contact = Contact.find_by_phone(to_contact)
            if not contact:
                contact = Contact.create({
                    'phone': to_contact,
                    'source': 'api'
                })
        else:
            contact = to_contact
            
        if not contact:
            logging.error("Cannot send message: No valid contact provided")
            return {
                'success': False,
                'error': 'No valid contact provided'
            }
            
        # Create message record
        message = Message.create({
            'content': content,
            'to_contact': contact.phone,
            'from_user': from_user,
            'message_type': message_type,
            'status': 'pending',
            'metadata': metadata or {}
        })
        
        # Send message through appropriate provider
        provider = cls.get_provider()
        result = None
        
        if provider == 'twilio':
            # Use Twilio service
            result = cls._send_via_twilio(
                to=contact.phone,
                body=content,
                media_url=media_url,
                message_id=str(message._id)
            )
        else:
            # Use direct WhatsApp API
            result = cls._call_whatsapp_api({
                'recipient': contact.phone,
                'type': message_type,
                'content': content,
                'message_id': message.id
            })
            
        # Update message with provider's message ID
        if result and result.get('success'):
            # Get the message ID from the result
            provider_message_id = result.get('message_sid') or result.get('sid')
            
            # Update the message in the database
            Message.update(str(message._id), {
                'status': 'sent',
                'metadata': {
                    **message.metadata,
                    'provider': provider,
                    'provider_message_id': provider_message_id
                }
            })
            
            # Return success response
            return {
                'success': True,
                'message_id': str(message._id),
                'provider_message_id': provider_message_id
            }
        else:
            # Get error message from result
            error_message = result.get('error') if result else 'Unknown error'
            
            # Update the message in the database
            Message.update(str(message._id), {
                'status': 'failed',
                'metadata': {
                    **message.metadata,
                    'provider': provider,
                    'error': error_message
                }
            })
            
            # Return error response
            return {
                'success': False,
                'message_id': str(message._id),
                'error': error_message
            }
    
    @classmethod
    def _send_via_twilio(cls, to, body, media_url=None, message_id=None) -> Dict[str, Any]:
        """Send a message using the Twilio service."""
        if cls._twilio_service is None:
            cls._twilio_service = TwilioService()
            
        return cls._twilio_service.send_message(to, body, media_url)
    
    @staticmethod
    def _call_whatsapp_api(message):
        """Call the WhatsApp API directly."""
        try:
            headers = {
                'Authorization': f"Bearer {current_app.config.get('WHATSAPP_API_TOKEN')}",
                'Content-Type': 'application/json'
            }
            
            payload = {
                'messaging_product': 'whatsapp',
                'recipient_type': 'individual',
                'to': message['recipient'],
                'type': message['type'],
            }
            
            # Add different content types
            if message['type'] == 'text':
                payload['text'] = {'body': message['content']}
            elif message['type'] == 'image':
                payload['image'] = {'link': message['content']}
            elif message['type'] == 'document':
                payload['document'] = {'link': message['content']}
            
            # Make the API call
            response = requests.post(
                current_app.config.get('WHATSAPP_API_URL'),
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                message_id = data.get('messages', [{}])[0].get('id', '')
                return {
                    'success': True,
                    'message_id': message_id,
                    'status': 'sent'
                }
            else:
                logging.error(f"WhatsApp API error: {response.status_code}, {response.text}")
                return {
                    'success': False,
                    'error': f"WhatsApp API error: {response.status_code}",
                    'details': response.text
                }
                
        except Exception as e:
            logging.error(f"Error calling WhatsApp API: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    @classmethod
    def handle_status_update(cls, whatsapp_message_id, status):
        """Handle a status update for a message."""
        # Find the message by provider message ID
        message = Message.find_by_provider_id(whatsapp_message_id)
        
        if not message:
            logging.warning(f"Status update for unknown message ID: {whatsapp_message_id}")
            return False
            
        # Map the status from provider-specific to our standard statuses
        status_mapping = {
            'sent': 'sent',
            'delivered': 'delivered',
            'read': 'read',
            'failed': 'failed',
            'queued': 'pending'
        }
        
        standard_status = status_mapping.get(status.lower(), 'unknown')
        
        # Update the message status
        Message.update(message.id, {
            'status': standard_status,
            'metadata': {
                **message.metadata,
                'status_history': [
                    *message.metadata.get('status_history', []),
                    {'status': status, 'timestamp': datetime.now().isoformat()}
                ]
            }
        })
        
        return True

    @staticmethod
    def get_messages_for_contact(contact_id, limit=50, skip=0):
        """Get messages for a specific contact."""
        return Message.find_by_contact(contact_id, limit, skip)
        
    @classmethod
    def process_incoming_webhook(cls, webhook_data, provider='direct'):
        """Process incoming webhook data from various providers."""
        if provider == 'twilio':
            # Process Twilio webhook
            if cls._twilio_service is None:
                cls._twilio_service = TwilioService()
                
            processed_data = cls._twilio_service.process_incoming_message(webhook_data)
            
            # Store the message
            contact = Contact.find_by_phone(processed_data['from'])
            if not contact:
                contact = Contact.create({
                    'phone': processed_data['from'],
                    'source': 'twilio_webhook'
                })
                
            # Create message record
            message = Message.create({
                'contact_id': contact.id,
                'direction': 'inbound',
                'content': processed_data['body'],
                'message_type': 'text' if not processed_data.get('media_urls') else 'media',
                'status': 'received',
                'provider_message_id': processed_data['message_sid'],
                'metadata': {
                    'provider': 'twilio',
                    'media_urls': processed_data.get('media_urls', []),
                    'webhook_data': webhook_data
                }
            })
            
            return {
                'success': True,
                'message_id': message.id,
                'contact_id': contact.id
            }
            
        else:
            # Process direct WhatsApp webhook
            # Implementation will depend on the WhatsApp API webhook format
            # This is a placeholder for the existing implementation
            pass 