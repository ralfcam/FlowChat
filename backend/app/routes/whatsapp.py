"""
WhatsApp API routes for FlowChat.
These routes handle sending messages and receiving webhooks from Twilio.
"""
from flask import Blueprint, request, jsonify, current_app, Response, url_for

from ..services.messages import WhatsAppService
from ..services.twilio_service import TwilioService
from ..utils.context_logger import logger, log_operation
from ..utils.error_handlers import APIError

# Create route-specific logger
route_logger = logger.with_context(module='whatsapp_routes')

# Create Blueprint
whatsapp_bp = Blueprint('whatsapp', __name__, url_prefix='/api/whatsapp')

# Initialize Twilio service for webhook validation
twilio_service = TwilioService()

@whatsapp_bp.route('/send', methods=['POST'])
@log_operation('whatsapp_send_message')
def send_message():
    """
    Send a WhatsApp message using the configured provider.
    
    Expected JSON body:
    {
        "to": "+1234567890",  # Recipient's phone number in E.164 format
        "body": "Your message here",  # Message content
        "media_url": ["https://example.com/image.jpg"]  # Optional media URLs
    }
    """
    req_logger = route_logger.with_context(endpoint='send_message')
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'to' not in data or 'body' not in data:
            req_logger.warning("Missing required fields for send message", extra={'data': data})
            return jsonify({
                'success': False,
                'error': 'Missing required fields: to, body'
            }), 400
            
        # Get parameters
        to = data['to']
        body = data['body']
        media_url = data.get('media_url')
        message_type = data.get('type', 'text')
        metadata = data.get('metadata', {})
        
        req_logger.info(
            f"Sending message to {to}", 
            extra={
                'to': to, 
                'media_url': bool(media_url),
                'message_type': message_type,
                'message_length': len(body)
            }
        )
        
        # Send the message using WhatsAppService
        result = WhatsAppService.send_message(
            content=body,
            to_contact=to,
            message_type=message_type,
            metadata=metadata,
            media_url=media_url
        )
        
        # Check if the message was sent successfully
        if isinstance(result, dict):
            # It's a dictionary result
            if result.get('success'):
                req_logger.info("Message sent successfully", extra={'result': result})
                return jsonify(result), 200
            else:
                req_logger.error("Failed to send message", extra={'error': result.get('error')})
                return jsonify(result), 400
        elif hasattr(result, '_id'):
            # It's a Message object, create a success response
            response = {
                'success': True,
                'message_id': str(result._id),
                'status': getattr(result, 'status', 'sent')
            }
            req_logger.info("Message sent successfully", extra={'message_id': str(result._id)})
            return jsonify(response), 200
        else:
            # Unknown result type
            req_logger.error("Failed to send message: Unknown result type", extra={'result_type': type(result).__name__})
            return jsonify({
                'success': False,
                'error': "Unknown result from message service"
            }), 400
            
    except Exception as e:
        req_logger.exception(f"Error in /send endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@whatsapp_bp.route('/send-template', methods=['POST'])
@log_operation('whatsapp_send_template')
def send_template():
    """
    Send a WhatsApp template message.
    
    Expected JSON body:
    {
        "to": "+1234567890",  # Recipient's phone number in E.164 format
        "template_name": "your_template_name",  # Name of the approved template
        "parameters": {  # Optional parameters for template variables
            "1": "Variable 1 value",
            "2": "Variable 2 value"
        }
    }
    """
    template_logger = route_logger.with_context(endpoint='send_template')
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'to' not in data or 'template_name' not in data:
            template_logger.warning("Missing required fields for template", extra={'data': data})
            return jsonify({
                'success': False,
                'error': 'Missing required fields: to, template_name'
            }), 400
            
        # Get parameters
        to = data['to']
        template_name = data['template_name']
        parameters = data.get('parameters')
        
        template_logger.info(
            f"Sending template to {to}",
            extra={
                'to': to,
                'template_name': template_name,
                'has_parameters': bool(parameters)
            }
        )
        
        # Check if using Twilio provider
        if WhatsAppService.get_provider() == 'twilio':
            # Use Twilio's template functionality
            if WhatsAppService._twilio_service is None:
                WhatsAppService._twilio_service = TwilioService()
                
            result = WhatsAppService._twilio_service.send_template(to, template_name, parameters)
            
            if result['success']:
                template_logger.info("Template sent successfully via Twilio", extra={'result': result})
                return jsonify(result), 200
            else:
                template_logger.error("Failed to send template via Twilio", extra={'error': result.get('error')})
                return jsonify(result), 400
        else:
            # Use the WhatsApp API template functionality
            metadata = {
                'template_name': template_name,
                'parameters': parameters,
                'language_code': data.get('language_code', 'en')
            }
            
            result = WhatsAppService.send_message(
                content='',  # Content will be determined by the template
                to_contact=to,
                message_type='template',
                metadata=metadata
            )
            
            if result.get('success'):
                template_logger.info("Template sent successfully via direct API", extra={'result': result})
                return jsonify(result), 200
            else:
                template_logger.error("Failed to send template via direct API", extra={'error': result.get('error')})
                return jsonify(result), 400
            
    except Exception as e:
        template_logger.exception(f"Error in /send-template endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@whatsapp_bp.route('/webhook', methods=['POST'])
@log_operation('whatsapp_webhook_receive')
def webhook():
    """
    Webhook endpoint for receiving incoming WhatsApp messages and status updates.
    Supports both Twilio and direct WhatsApp API webhooks.
    """
    webhook_logger = route_logger.with_context(endpoint='webhook', method='POST')
    
    try:
        # Determine the webhook provider
        provider = 'twilio' if WhatsAppService.get_provider() == 'twilio' else 'direct'
        webhook_logger.info(f"Processing webhook from {provider} provider")
        
        if provider == 'twilio':
            # Get the request data as form data (Twilio sends as form)
            form_data = request.form.to_dict()
            
            # Validate the request is from Twilio
            is_valid_request = True  # Default to true for development
            
            # Only validate if not in debug mode
            if not current_app.debug:
                twilio_signature = request.headers.get('X-Twilio-Signature', '')
                url = request.url
                is_valid_request = twilio_service.validate_webhook(url, twilio_signature, form_data)
                
                if not is_valid_request:
                    webhook_logger.warning("Invalid Twilio webhook signature")
                    return Response(status=403)
            
            # Process the webhook data using WhatsAppService
            if 'MessageSid' in form_data:
                # This is a message webhook
                webhook_logger.info("Received message webhook", extra={'message_sid': form_data.get('MessageSid')})
                result = WhatsAppService.process_incoming_webhook(form_data, provider='twilio')
                webhook_logger.info("Message webhook processed", extra={'result': result})
                return jsonify({'success': True, 'result': result}), 200
                
            elif 'SmsSid' in form_data and 'MessageStatus' in form_data:
                # This is a status update webhook
                message_sid = form_data.get('MessageSid')
                status = form_data.get('MessageStatus')
                
                webhook_logger.info(
                    f"Received status update webhook", 
                    extra={'message_sid': message_sid, 'status': status}
                )
                
                WhatsAppService.handle_status_update(message_sid, status)
                return jsonify({'success': True}), 200
            
            else:
                # Unknown webhook type
                webhook_logger.warning(
                    f"Received unknown Twilio webhook", 
                    extra={'form_keys': list(form_data.keys())}
                )
                return jsonify({'success': True}), 200
                
        else:
            # Direct WhatsApp API webhook
            # Implementation depends on WhatsApp API webhook format
            json_data = request.get_json()
            
            if not json_data:
                webhook_logger.warning("No data provided in direct API webhook")
                return jsonify({'success': False, 'error': 'No data provided'}), 400
                
            # Process webhook using WhatsAppService
            webhook_logger.info("Processing direct API webhook", extra={'data_keys': list(json_data.keys())})
            result = WhatsAppService.process_incoming_webhook(json_data, provider='direct')
            webhook_logger.info("Direct API webhook processed", extra={'result': result})
            return jsonify({'success': True, 'result': result}), 200
            
    except Exception as e:
        webhook_logger.exception(f"Error processing webhook: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@whatsapp_bp.route('/webhook', methods=['GET'])
@log_operation('whatsapp_webhook_verify')
def webhook_verify():
    """
    Verification endpoint for the WhatsApp webhook.
    Supports both Twilio and direct WhatsApp API verification.
    """
    verify_logger = route_logger.with_context(endpoint='webhook', method='GET')
    
    try:
        provider = WhatsAppService.get_provider()
        verify_logger.info(f"Webhook verification request for {provider} provider")
        
        if provider == 'twilio':
            # For Twilio WhatsApp webhook verification, just return 200 OK
            verify_logger.info("Twilio webhook verification successful")
            return Response(status=200)
        else:
            # For direct WhatsApp API, we need to handle the challenge
            mode = request.args.get('hub.mode')
            challenge = request.args.get('hub.challenge')
            verify_token = request.args.get('hub.verify_token')
            
            verify_logger.info(
                "Processing direct API webhook verification",
                extra={
                    'mode': mode,
                    'has_challenge': bool(challenge),
                    'has_token': bool(verify_token)
                }
            )
            
            if mode and verify_token:
                if mode == 'subscribe' and verify_token == current_app.config.get('WHATSAPP_VERIFY_TOKEN'):
                    verify_logger.info("Direct API webhook verification successful")
                    return Response(challenge, status=200)
            
            verify_logger.warning("Direct API webhook verification failed")        
            return Response(status=403)
            
    except Exception as e:
        verify_logger.exception(f"Error in webhook verification: {str(e)}")
        return Response(status=500) 