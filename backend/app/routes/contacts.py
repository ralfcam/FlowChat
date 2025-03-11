"""
Contacts routes.
"""

from flask import Blueprint, request, jsonify
from app.models.contact import Contact

contacts_bp = Blueprint('contacts', __name__, url_prefix='/contacts')


@contacts_bp.route('', methods=['GET'])
def get_contacts():
    """Get all contacts with optional search filters."""
    query = request.args.get('query')
    tags = request.args.get('tags')
    limit = request.args.get('limit', 50, type=int)
    skip = request.args.get('skip', 0, type=int)
    
    # Parse tags if provided
    if tags:
        tags = [tag.strip() for tag in tags.split(',')]
    
    contacts = Contact.search(query, tags, limit, skip)
    
    return jsonify({
        'data': [contact.to_dict() for contact in contacts],
        'meta': {
            'limit': limit,
            'skip': skip,
            'count': len(contacts)
        }
    }), 200


@contacts_bp.route('/<contact_id>', methods=['GET'])
def get_contact(contact_id):
    """Get a specific contact by ID."""
    contact = Contact.find_by_id(contact_id)
    
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    
    return jsonify({'data': contact.to_dict()}), 200


@contacts_bp.route('', methods=['POST'])
def create_contact():
    """Create a new contact."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    phone = data.get('phone')
    
    if not phone:
        return jsonify({'error': 'Phone number is required'}), 400
    
    # Check if contact already exists
    existing = Contact.find_by_phone(phone)
    if existing:
        return jsonify({'error': 'Contact already exists', 'data': existing.to_dict()}), 409
    
    name = data.get('name')
    email = data.get('email')
    tags = data.get('tags', [])
    metadata = data.get('metadata', {})
    
    contact = Contact(
        phone=phone,
        name=name,
        email=email,
        tags=tags,
        metadata=metadata
    )
    
    contact.save()
    
    return jsonify({'data': contact.to_dict()}), 201


@contacts_bp.route('/<contact_id>', methods=['PUT'])
def update_contact(contact_id):
    """Update a contact."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    contact = Contact.find_by_id(contact_id)
    
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    
    # Update fields if provided
    if 'phone' in data:
        contact.phone = data['phone']
    if 'name' in data:
        contact.name = data['name']
    if 'email' in data:
        contact.email = data['email']
    if 'tags' in data:
        contact.tags = data['tags']
    if 'metadata' in data:
        contact.metadata = data['metadata']
    
    contact.save()
    
    return jsonify({'data': contact.to_dict()}), 200


@contacts_bp.route('/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Delete a contact."""
    contact = Contact.find_by_id(contact_id)
    
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    
    contact.delete()
    
    return jsonify({'message': 'Contact deleted successfully'}), 200


@contacts_bp.route('/<contact_id>/tags', methods=['POST'])
def add_tag(contact_id):
    """Add a tag to a contact."""
    data = request.get_json()
    
    if not data or 'tag' not in data:
        return jsonify({'error': 'Tag is required'}), 400
    
    contact = Contact.find_by_id(contact_id)
    
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    
    tag = data['tag']
    contact.add_tag(tag)
    
    return jsonify({'data': contact.to_dict()}), 200


@contacts_bp.route('/<contact_id>/tags/<tag>', methods=['DELETE'])
def remove_tag(contact_id, tag):
    """Remove a tag from a contact."""
    contact = Contact.find_by_id(contact_id)
    
    if not contact:
        return jsonify({'error': 'Contact not found'}), 404
    
    contact.remove_tag(tag)
    
    return jsonify({'data': contact.to_dict()}), 200 