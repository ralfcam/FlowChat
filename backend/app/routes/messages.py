"""
WhatsApp messages routes.
"""

from flask import Blueprint, request, jsonify
from app.services.messages import WhatsAppService
from app.models.message import Message

messages_bp = Blueprint('messages', __name__, url_prefix='/messages')


@messages_bp.route('/send', methods=['POST'])
def send_message():
    """Send a WhatsApp message."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    content = data.get('content')
    to_contact = data.get('to_contact')
    from_user = data.get('from_user')
    message_type = data.get('type', 'text')
    metadata = data.get('metadata')
    
    if not content or not to_contact:
        return jsonify({'error': 'Content and to_contact are required'}), 400
    
    message, error = WhatsAppService.send_message(
        content, to_contact, from_user, message_type, metadata
    )
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({'data': message.to_dict()}), 201


@messages_bp.route('/contact/<contact_id>', methods=['GET'])
def get_messages_for_contact(contact_id):
    """Get messages for a specific contact."""
    limit = request.args.get('limit', 50, type=int)
    skip = request.args.get('skip', 0, type=int)
    
    messages = WhatsAppService.get_messages_for_contact(contact_id, limit, skip)
    
    return jsonify({
        'data': [message.to_dict() for message in messages],
        'meta': {
            'limit': limit,
            'skip': skip,
            'count': len(messages)
        }
    }), 200


@messages_bp.route('/<message_id>', methods=['GET'])
def get_message(message_id):
    """Get a specific message by ID."""
    message = Message.find_by_id(message_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    return jsonify({'data': message.to_dict()}), 200


@messages_bp.route('/<message_id>/status', methods=['PUT'])
def update_message_status(message_id):
    """Update a message status."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    status = data.get('status')
    
    if not status:
        return jsonify({'error': 'Status is required'}), 400
    
    message = Message.find_by_id(message_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    message.update_status(status)
    
    return jsonify({'data': message.to_dict()}), 200 