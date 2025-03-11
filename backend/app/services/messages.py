"""
WhatsApp message service.
"""

import requests
import logging
from flask import current_app
from app.models.message import Message
from app.models.contact import Contact


class WhatsAppService:
    """Service for WhatsApp messaging operations."""
    
    @staticmethod
    def send_message(content, to_contact, from_user=None, message_type='text', metadata=None):
        """Send a WhatsApp message to a contact."""
        # First ensure we have a contact record
        contact = None
        if isinstance(to_contact, str):
            # Look up or create contact
            contact = Contact.find_by_phone(to_contact)
            if not contact:
                contact = Contact(phone=to_contact)
                contact.save()
            to_contact = str(contact._id)
        
        # Create message record
        message = Message(
            content=content,
            from_user=from_user,
            to_contact=to_contact,
            message_type=message_type,
            status='pending',
            metadata=metadata
        )
        message.save()
        
        # Send message to WhatsApp API
        try:
            result = WhatsAppService._call_whatsapp_api(message)
            
            if result.get('success'):
                message.update_status('sent')
                message.metadata['whatsapp_message_id'] = result.get('message_id')
                message.save()
                return message, None
            else:
                message.update_status('failed')
                message.metadata['error'] = result.get('error')
                message.save()
                return None, result.get('error', 'Failed to send message')
                
        except Exception as e:
            logging.error(f"Error sending WhatsApp message: {str(e)}")
            message.update_status('failed')
            message.metadata['error'] = str(e)
            message.save()
            return None, str(e)
    
    @staticmethod
    def _call_whatsapp_api(message):
        """Make the actual API call to WhatsApp."""
        api_url = current_app.config['WHATSAPP_API_URL']
        api_token = current_app.config['WHATSAPP_API_TOKEN']
        
        if not api_url or not api_token:
            return {
                'success': False,
                'error': 'WhatsApp API configuration missing'
            }
        
        # Get the contact's phone number
        contact = Contact.find_by_id(message.to_contact)
        if not contact:
            return {
                'success': False,
                'error': 'Contact not found'
            }
        
        # Prepare the API request based on message type
        payload = {
            'to': contact.phone,
            'type': message.message_type,
        }
        
        if message.message_type == 'text':
            payload['text'] = {'body': message.content}
        elif message.message_type == 'template':
            payload['template'] = {
                'name': message.metadata.get('template_name', ''),
                'language': {'code': message.metadata.get('language_code', 'en')},
                'components': message.metadata.get('components', [])
            }
        elif message.message_type == 'media':
            media_type = message.metadata.get('media_type', 'image')
            payload[media_type] = {
                'link': message.content
            }
            
        # Make the API call
        headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            response_data = response.json()
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'message_id': response_data.get('id', '')
                }
            else:
                return {
                    'success': False,
                    'error': response_data.get('error', {}).get('message', 'API error')
                }
                
        except Exception as e:
            logging.error(f"WhatsApp API call failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def handle_status_update(whatsapp_message_id, status):
        """Handle message status update from webhook."""
        # Find message by WhatsApp message ID
        db = Message.get_db()
        data = db[Message.collection_name].find_one({
            'metadata.whatsapp_message_id': whatsapp_message_id
        })
        
        if not data:
            logging.warning(f"Message not found for WhatsApp ID: {whatsapp_message_id}")
            return False
            
        message = Message.from_dict(data)
        message.update_status(status)
        return True
    
    @staticmethod
    def get_messages_for_contact(contact_id, limit=50, skip=0):
        """Get messages for a specific contact."""
        return Message.find_by_contact(contact_id, limit, skip) 