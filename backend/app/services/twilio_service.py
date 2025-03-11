"""
Twilio WhatsApp integration service for FlowChat.
This service handles sending WhatsApp messages via Twilio and processing incoming messages.
"""
import os
import json
from typing import Dict, Any, List, Optional, Union

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException, TwilioException
from twilio.request_validator import RequestValidator
from dotenv import load_dotenv

from app.utils.context_logger import logger, log_operation

load_dotenv()

# Create a service-specific logger
twilio_logger = logger.with_context(service='twilio')

class TwilioService:
    """Service for Twilio WhatsApp integration."""
    
    def __init__(self):
        """Initialize the Twilio client with credentials from environment variables."""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        
        self.logger = twilio_logger.with_context(
            account_sid=self.account_sid,
            whatsapp_number=self.whatsapp_number
        )
        
        if not all([self.account_sid, self.auth_token, self.whatsapp_number]):
            self.logger.warning("Twilio credentials not fully configured")
        
        try:
            self.client = Client(self.account_sid, self.auth_token)
            self.validator = RequestValidator(self.auth_token)
            self.logger.info("Twilio client initialized successfully")
        except Exception as e:
            self.logger.exception(f"Error initializing Twilio client: {str(e)}")
            raise

    @log_operation('send_whatsapp_message')
    def send_message(self, to: str, body: str, media_url: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Send a WhatsApp message via Twilio.
        
        Args:
            to: The recipient's phone number (E.164 format, without the 'whatsapp:' prefix)
            body: The message content
            media_url: Optional list of media URLs to attach to the message
            
        Returns:
            Dictionary containing the message details if successful
            
        Raises:
            TwilioRestException: If there's an error sending the message
        """
        msg_logger = self.logger.with_context(
            to=to, 
            message_length=len(body),
            has_media=bool(media_url)
        )
        
        try:
            # Format the numbers for WhatsApp
            from_whatsapp = f"whatsapp:{self.whatsapp_number}"
            to_whatsapp = f"whatsapp:{to}"
            
            message_params = {
                'from_': from_whatsapp,
                'to': to_whatsapp,
                'body': body
            }
            
            # Add media URLs if provided
            if media_url:
                message_params['media_url'] = media_url
                
            # Log attempt
            msg_logger.debug(
                f"Sending WhatsApp message to {to}",
                extra={'message_params': {**message_params, 'body': f"{body[:20]}..." if len(body) > 20 else body}}
            )
                
            # Send the message
            message = self.client.messages.create(**message_params)
            
            # Log success
            msg_logger.info(
                f"Message sent to {to}", 
                extra={
                    'message_sid': message.sid,
                    'status': message.status,
                }
            )
            
            return {
                'success': True,
                'message_sid': message.sid,
                'status': message.status,
                'to': to
            }
            
        except TwilioRestException as e:
            # Log specific Twilio error
            msg_logger.error(
                f"Twilio error sending message to {to}",
                extra={
                    'error_code': e.code,
                    'error_message': str(e),
                    'twilio_more_info': e.more_info
                }
            )
            return {
                'success': False,
                'error': str(e),
                'error_code': e.code,
                'to': to
            }
        except Exception as e:
            # Log unexpected error
            msg_logger.exception(f"Unexpected error sending message to {to}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'to': to
            }
    
    @log_operation('send_whatsapp_template')
    def send_template(self, to: str, template_name: str, 
                     parameters: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Send a WhatsApp template message via Twilio.
        
        Args:
            to: The recipient's phone number (E.164 format, without the 'whatsapp:' prefix)
            template_name: The name of the approved WhatsApp template
            parameters: Optional parameters to fill template variables
            
        Returns:
            Dictionary containing the message details if successful
        """
        template_logger = self.logger.with_context(
            to=to,
            template_name=template_name,
            has_parameters=bool(parameters)
        )
        
        try:
            # Format the numbers for WhatsApp
            from_whatsapp = f"whatsapp:{self.whatsapp_number}"
            to_whatsapp = f"whatsapp:{to}"
            
            # Prepare content for template
            content = {
                'template': {
                    'name': template_name,
                    'language': {
                        'code': 'en_US'  # Can be made configurable
                    }
                }
            }
            
            # Add parameters if provided
            if parameters:
                components = []
                component = {
                    'type': 'body',
                    'parameters': []
                }
                
                for key, value in parameters.items():
                    component['parameters'].append({
                        'type': 'text',
                        'text': value
                    })
                
                components.append(component)
                content['template']['components'] = components
            
            # Log attempt
            template_logger.debug(
                f"Sending template message to {to}",
                extra={'template_content': content}
            )
            
            # Send the template message
            message = self.client.messages.create(
                content_sid=template_name,
                content_variables=json.dumps(parameters) if parameters else None,
                from_=from_whatsapp,
                to=to_whatsapp
            )
            
            # Log success
            template_logger.info(
                f"Template message sent to {to}",
                extra={
                    'message_sid': message.sid,
                    'status': message.status
                }
            )
            
            return {
                'success': True,
                'message_sid': message.sid,
                'status': message.status,
                'to': to
            }
            
        except TwilioRestException as e:
            # Log specific Twilio error
            template_logger.error(
                f"Twilio error sending template to {to}",
                extra={
                    'error_code': e.code,
                    'error_message': str(e),
                    'twilio_more_info': e.more_info
                }
            )
            return {
                'success': False,
                'error': str(e),
                'error_code': e.code,
                'to': to
            }
        except Exception as e:
            # Log unexpected error
            template_logger.exception(f"Unexpected error sending template to {to}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'to': to
            }
    
    def validate_webhook(self, url: str, signature: str, params: Dict[str, str]) -> bool:
        """
        Validate that a webhook request came from Twilio.
        
        Args:
            url: The full URL of the request
            signature: The X-Twilio-Signature header value
            params: The request parameters
            
        Returns:
            True if the request is valid, False otherwise
        """
        is_valid = self.validator.validate(url, params, signature)
        
        if not is_valid:
            self.logger.warning(
                "Invalid Twilio webhook signature detected",
                extra={
                    'url': url,
                    'signature': signature[:10] + '...' if signature else None,
                    'params_keys': list(params.keys()) if params else None
                }
            )
        
        return is_valid
    
    @log_operation('process_incoming_message')
    def process_incoming_message(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process an incoming WhatsApp message from a Twilio webhook.
        
        Args:
            webhook_data: The webhook data from Twilio
            
        Returns:
            Processed message data
        """
        try:
            # Extract relevant information from the webhook
            message_sid = webhook_data.get('MessageSid', '')
            from_number = webhook_data.get('From', '').replace('whatsapp:', '')
            to_number = webhook_data.get('To', '').replace('whatsapp:', '')
            body = webhook_data.get('Body', '')
            num_media = int(webhook_data.get('NumMedia', 0))
            
            webhook_logger = self.logger.with_context(
                message_sid=message_sid,
                from_number=from_number,
                to_number=to_number,
                has_media=num_media > 0
            )
            
            # Process media if present
            media_urls = []
            for i in range(num_media):
                media_url = webhook_data.get(f'MediaUrl{i}')
                if media_url:
                    media_urls.append(media_url)
            
            # Construct processed message data
            processed_data = {
                'message_sid': message_sid,
                'from': from_number,
                'to': to_number,
                'body': body,
                'media_urls': media_urls,
                'timestamp': webhook_data.get('timestamp', ''),
                'direction': 'inbound'
            }
            
            webhook_logger.info(
                f"Processed incoming message from {from_number}",
                extra={
                    'message_length': len(body),
                    'media_count': len(media_urls),
                }
            )
            return processed_data
            
        except Exception as e:
            self.logger.exception(f"Error processing incoming message: {str(e)}")
            raise 