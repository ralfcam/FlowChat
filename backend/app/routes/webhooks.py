"""
Webhooks routes for external services.
"""

import logging
from flask import Blueprint, request, jsonify
from app.services.messages import WhatsAppService
from app.models.contact import Contact

webhooks_bp = Blueprint('webhooks', __name__, url_prefix='/webhooks')


@webhooks_bp.route('/whatsapp', methods=['GET'])
def verify_webhook():
    """
    Handle WhatsApp webhook verification.
    
    WhatsApp Cloud API sends a verification request to the webhook with
    specific parameters that need to be echoed back.
    """
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    
    # Get the verify token from app config
    # In a real app, use a secure token from environment variables
    verify_token = 'WHATSAPP_WEBHOOK_TOKEN'
    
    if mode == 'subscribe' and token == verify_token:
        return challenge, 200
    else:
        return 'Verification failed', 403


@webhooks_bp.route('/whatsapp', methods=['POST'])
def whatsapp_webhook():
    """
    Handle WhatsApp webhook notifications.
    
    WhatsApp Cloud API sends notifications for message delivery status updates,
    incoming messages, and other events.
    """
    try:
        # Get the webhook data
        data = request.get_json()
        logging.debug(f"WhatsApp webhook received: {data}")
        
        # Handle different types of notifications
        if 'object' in data and data['object'] == 'whatsapp_business_account':
            # Extract entries
            if 'entry' in data and data['entry']:
                for entry in data['entry']:
                    # Process each change in the entry
                    if 'changes' in entry and entry['changes']:
                        for change in entry['changes']:
                            value = change.get('value', {})
                            
                            # Handle message status updates
                            if 'statuses' in value:
                                _handle_status_updates(value['statuses'])
                            
                            # Handle incoming messages
                            if 'messages' in value:
                                _handle_incoming_messages(value['messages'])
        
        # Always return a 200 OK to acknowledge receipt
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        logging.error(f"Error processing webhook: {str(e)}")
        # Still return 200 to prevent retries
        return jsonify({'status': 'error', 'message': str(e)}), 200


def _handle_status_updates(statuses):
    """Handle message status updates."""
    for status in statuses:
        message_id = status.get('id')
        status_value = status.get('status')
        
        if message_id and status_value:
            WhatsAppService.handle_status_update(message_id, status_value)


def _handle_incoming_messages(messages):
    """Handle incoming messages."""
    for message in messages:
        message_type = message.get('type')
        
        # Skip non-text messages for now
        if message_type != 'text':
            continue
            
        from_phone = message.get('from')
        message_id = message.get('id')
        timestamp = message.get('timestamp')
        text = message.get('text', {}).get('body', '')
        
        # Store the contact if not exists
        contact = Contact.find_by_phone(from_phone)
        if not contact:
            contact = Contact(phone=from_phone)
            contact.save()
        
        # Store the incoming message
        from app.models.message import Message
        incoming_message = Message(
            content=text,
            from_user=None,  # No user, it's from the contact
            to_contact=str(contact._id),
            message_type='text',
            status='received',
            metadata={
                'whatsapp_message_id': message_id,
                'timestamp': timestamp
            }
        )
        incoming_message.save()
        
        # TODO: Process the message (e.g., AI response, forward to agent, etc.) 