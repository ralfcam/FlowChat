"""
WhatsApp message service.
"""

import os
import requests
import logging
from flask import current_app
from typing import Dict, Any, List, Optional, Union
from datetime import datetime

from app.models.message import Message
from app.models.contact import Contact
from app.services.twilio_service import TwilioService
from app.utils.context_logger import logger

# Configure logger for this module
service_logger = logger.with_context(module='message_service')

class WhatsAppService:
    """Service for sending and receiving WhatsApp messages."""
    
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
    def send_message(cls, 
                     content: str, 
                     to_contact: str, 
                     from_user: Optional[str] = None,
                     message_type: str = 'text', 
                     media_url: Optional[Union[str, List[str]]] = None, 
                     metadata: Optional[Dict[str, Any]] = None) -> Union[Dict[str, Any], Message]:
        """
        Send a WhatsApp message using the configured provider.
        
        Args:
            content (str): The message content
            to_contact (str): Recipient's phone number in E.164 format
            from_user (str, optional): The ID of the user sending the message
            message_type (str, optional): Message type, such as 'text', 'media', or 'template'
            media_url (str or list, optional): Media URLs to include in the message
            metadata (dict, optional): Additional metadata for the message
            
        Returns:
            Union[Dict[str, Any], Message]: Message object if successful, or an error dictionary
        """
        if not content and not media_url:
            return {'success': False, 'error': 'Message content or media is required'}
        
        # Ensure metadata is a dictionary
        if metadata is None:
            metadata = {}
        
        # Format the phone number if needed
        to_phone = cls._format_phone_number(to_contact)
        if not to_phone:
            return {'success': False, 'error': f'Invalid phone number: {to_contact}'}
        
        log = service_logger.with_context(operation='send_message')
        log.info(f"Sending message to {to_phone}", extra={'to': to_phone, 'message_type': message_type})
        
        # Create or get contact
        contact = cls._ensure_contact_exists(to_phone)
        if not contact:
            log.error(f"Failed to create or find contact for {to_phone}")
            return {'success': False, 'error': f'Failed to create contact for {to_phone}'}
        
        # Create message record in the database
        message_data = {
            'content': content,
            'from_user': from_user,
            'to_contact': str(contact._id),
            'message_type': message_type,
            'status': 'pending',
            'direction': 'outbound',
            'metadata': metadata or {}
        }
        
        if media_url:
            message_data['metadata']['media_url'] = media_url
        
        try:
            # Create message in database
            message = Message.create(message_data)
            
            # Decide which provider to use based on config
            twilio_enabled = current_app.config.get('TWILIO_ENABLED', False)
            twilio_account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
            direct_whatsapp_enabled = current_app.config.get('DIRECT_WHATSAPP_ENABLED', False)
            
            if twilio_enabled and twilio_account_sid:
                log.info("Using Twilio to send message")
                result = cls._send_via_twilio(message, to_phone, media_url)
            elif direct_whatsapp_enabled:
                log.info("Using direct WhatsApp API to send message")
                result = cls._send_via_direct_whatsapp(message, to_phone, media_url)
            else:
                log.warning("No WhatsApp provider configured")
                message.update_status('failed')
                message.metadata['error'] = 'No WhatsApp provider configured'
                message.save()
                return {'success': False, 'error': 'No WhatsApp provider configured'}
            
            # Process result
            if result.get('success'):
                # Update message with provider details
                provider_id = result.get('message_sid') or result.get('sid')
                if provider_id:
                    message.metadata['provider_message_id'] = provider_id
                    message.metadata['provider_status'] = result.get('status', 'sent')
                    message.status = 'sent'
                    message.save()
                    
                log.info(f"Message sent successfully with ID {str(message._id)}")
                return message
            else:
                # Update message with error details
                error_msg = result.get('error', 'Unknown error')
                message.status = 'failed'
                message.metadata['error'] = error_msg
                message.save()
                
                log.error(f"Failed to send message: {error_msg}")
                return {'success': False, 'error': error_msg, 'message_id': str(message._id)}
                
        except Exception as e:
            log.exception(f"Error sending WhatsApp message: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @classmethod
    def receive_message(cls, 
                        data: Dict[str, Any]) -> Union[Dict[str, Any], Message]:
        """
        Process a received WhatsApp message.
        
        Args:
            data (dict): The message data from the webhook
            
        Returns:
            Union[Dict[str, Any], Message]: Message object if successful, or an error dictionary
        """
        log = service_logger.with_context(operation='receive_message')
        
        try:
            # Extract relevant fields from the webhook data
            from_number = data.get('From', data.get('from', ''))
            body = data.get('Body', data.get('body', ''))
            media_urls = data.get('MediaUrl0', data.get('media_url', None))
            message_sid = data.get('MessageSid', data.get('message_id', ''))
            
            if not from_number:
                log.error("Missing sender phone number in webhook data")
                return {'success': False, 'error': 'Missing sender phone number'}
            
            # Format phone number
            from_phone = cls._format_phone_number(from_number)
            if not from_phone:
                log.error(f"Invalid phone number in webhook: {from_number}")
                return {'success': False, 'error': f'Invalid phone number: {from_number}'}
            
            # Find or create contact
            contact = cls._ensure_contact_exists(from_phone)
            if not contact:
                log.error(f"Failed to create or find contact for {from_phone}")
                return {'success': False, 'error': f'Failed to create contact for {from_phone}'}
            
            # Determine message type
            message_type = 'text'
            if media_urls:
                message_type = 'media'
            
            # Create metadata
            metadata = {
                'provider': 'twilio' if current_app.config.get('TWILIO_ENABLED', False) else 'direct',
                'provider_message_id': message_sid,
                'raw_webhook': data,
                'received_at': datetime.utcnow().isoformat()
            }
            
            if media_urls:
                metadata['media_url'] = media_urls
            
            # Create message record
            message_data = {
                'content': body,
                'from_user': str(contact._id),
                'to_contact': None,  # System received the message
                'message_type': message_type,
                'status': 'delivered',
                'direction': 'inbound',
                'metadata': metadata
            }
            
            message = Message.create(message_data)
            log.info(f"Incoming message saved with ID {str(message._id)}")
            
            return message
            
        except Exception as e:
            log.exception(f"Error processing incoming WhatsApp message: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def _format_phone_number(phone: str) -> str:
        """Format a phone number to E.164 format."""
        # Remove any non-digit characters
        digits_only = ''.join(filter(str.isdigit, phone))
        
        # Check if it's already in E.164 format
        if phone.startswith('+'):
            return phone
        
        # Add + if missing
        if not digits_only.startswith('+'):
            return f"+{digits_only}"
            
        return phone
    
    @staticmethod
    def _ensure_contact_exists(phone: str) -> Optional[Contact]:
        """Create a contact if it doesn't exist."""
        # Try to find the contact
        contact = Contact.find_by_phone(phone)
        if contact:
            return contact
        
        # Create a new contact
        try:
            name = f"WhatsApp User ({phone})"
            contact_data = {
                'name': name,
                'phone': phone,
                'source': 'whatsapp',
                'metadata': {
                    'created_from': 'whatsapp_service',
                    'created_at': datetime.utcnow().isoformat()
                }
            }
            return Contact.create(contact_data)
        except Exception as e:
            service_logger.exception(f"Error creating contact: {str(e)}")
            return None
    
    @classmethod
    def _send_via_twilio(cls, 
                         message: Message, 
                         to_phone: str, 
                         media_url: Optional[Union[str, List[str]]] = None) -> Dict[str, Any]:
        """Send a message using Twilio."""
        twilio = TwilioService()
        
        try:
            return twilio.send_message(
                to=to_phone,
                body=message.content,
                media_url=media_url
            )
        except Exception as e:
            service_logger.exception(f"Error sending via Twilio: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @classmethod
    def _send_via_direct_whatsapp(cls, 
                                 message: Message, 
                                 to_phone: str, 
                                 media_url: Optional[Union[str, List[str]]] = None) -> Dict[str, Any]:
        """Send a message using direct WhatsApp API (placeholder)."""
        # This would be implemented if using a different WhatsApp provider
        service_logger.warning("Direct WhatsApp API not implemented")
        return {
            'success': False, 
            'error': 'Direct WhatsApp API not implemented'
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
        """
        Process incoming webhook data from various providers.
        
        Args:
            webhook_data: The webhook data from the provider
            provider: The provider name ('twilio' or 'direct')
            
        Returns:
            dict: Result of the webhook processing
        """
        log = service_logger.with_context(operation='process_webhook')
        log.info(f"Processing incoming webhook from {provider}", extra={'provider': provider})
        
        try:
            if provider == 'twilio':
                # Extract basic information from Twilio webhook
                message_sid = webhook_data.get('MessageSid', webhook_data.get('SmsSid'))
                from_number = webhook_data.get('From')
                body = webhook_data.get('Body', '')
                num_media = int(webhook_data.get('NumMedia', '0'))
                
                if not message_sid or not from_number:
                    log.error("Missing required fields in Twilio webhook", extra={'data': webhook_data})
                    return {
                        'success': False,
                        'error': 'Missing required fields in webhook data'
                    }
                
                log.info(f"Received message from {from_number}", extra={
                    'message_sid': message_sid,
                    'has_media': num_media > 0,
                    'body_length': len(body) if body else 0
                })
                
                # Collect media URLs if present
                media_urls = []
                for i in range(num_media):
                    media_url = webhook_data.get(f'MediaUrl{i}')
                    if media_url:
                        media_urls.append(media_url)
                
                # Process the message using receive_message method
                result = cls.receive_message({
                    'MessageSid': message_sid,
                    'From': from_number,
                    'Body': body,
                    'MediaUrl0': media_urls[0] if media_urls else None,
                    'MediaUrls': media_urls
                })
                
                if hasattr(result, '_id'):
                    # Successfully created message
                    log.info(f"Successfully stored incoming message", extra={'message_id': str(result._id)})
                    return {
                        'success': True,
                        'message_id': str(result._id)
                    }
                else:
                    # Error occurred
                    log.error(f"Failed to process incoming message", extra={'error': result.get('error')})
                    return result
                
            elif provider == 'direct':
                # Process WhatsApp Business API webhook
                # Extract basic information
                try:
                    # This is for Meta WhatsApp Business API format
                    entry = webhook_data.get('entry', [{}])[0]
                    changes = entry.get('changes', [{}])[0]
                    value = changes.get('value', {})
                    
                    if 'messages' in value:
                        # This is a message webhook
                        message = value['messages'][0]
                        
                        message_id = message.get('id')
                        from_number = message.get('from')
                        timestamp = message.get('timestamp')
                        
                        # Get message content based on type
                        message_type = message.get('type', 'text')
                        body = ''
                        media_url = None
                        
                        if message_type == 'text':
                            body = message.get('text', {}).get('body', '')
                        elif message_type == 'image':
                            media_url = message.get('image', {}).get('url')
                            body = message.get('image', {}).get('caption', '')
                        elif message_type == 'audio':
                            media_url = message.get('audio', {}).get('url')
                        elif message_type == 'video':
                            media_url = message.get('video', {}).get('url')
                            body = message.get('video', {}).get('caption', '')
                        
                        # Process the message
                        result = cls.receive_message({
                            'message_id': message_id,
                            'from': from_number,
                            'body': body,
                            'media_url': media_url,
                            'timestamp': timestamp,
                            'type': message_type
                        })
                        
                        if hasattr(result, '_id'):
                            # Successfully created message
                            return {
                                'success': True,
                                'message_id': str(result._id)
                            }
                        else:
                            # Error occurred
                            return result
                    else:
                        log.warning("Unrecognized direct webhook format", extra={'data': webhook_data})
                        return {
                            'success': False,
                            'error': 'Unrecognized webhook format'
                        }
                    
                except (KeyError, IndexError) as e:
                    log.error(f"Error parsing direct webhook: {str(e)}", extra={'data': webhook_data})
                    return {
                        'success': False,
                        'error': f'Error parsing webhook: {str(e)}'
                    }
            else:
                log.warning(f"Unknown provider: {provider}")
                return {
                    'success': False,
                    'error': f'Unknown provider: {provider}'
                }
            
        except Exception as e:
            log.exception(f"Error processing webhook: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            } 