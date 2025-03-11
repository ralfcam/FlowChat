# WhatsApp Integration Guide for FlowChat

This document provides a guide to the WhatsApp integration in FlowChat, which supports both Twilio WhatsApp API and the direct Meta/Facebook WhatsApp Business API.

## Overview

FlowChat can use either of two providers for WhatsApp messaging:

1. **Twilio WhatsApp API** - Uses Twilio as an intermediary service to connect to WhatsApp
2. **Direct WhatsApp Business API** - Connects directly to Meta/Facebook's WhatsApp Business API

The architecture allows you to switch between providers without changing your application code.

## Configuration

### Provider Selection

Set the WhatsApp provider in your `.env` file:

```
# Set to 'twilio' or 'direct'
WHATSAPP_PROVIDER=twilio
```

### Twilio Configuration

To use Twilio as your WhatsApp provider, set the following environment variables:

```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Direct WhatsApp API Configuration

To use the direct WhatsApp Business API, set these environment variables:

```
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/your-phone-number-id/messages
WHATSAPP_API_TOKEN=your-whatsapp-api-token
WHATSAPP_VERIFY_TOKEN=your-webhook-verification-token
```

## API Endpoints

FlowChat exposes the following WhatsApp endpoints:

### Sending Messages

**POST /api/whatsapp/send**

Send a WhatsApp message to a contact:

```json
{
  "to": "+1234567890",
  "body": "Your message content",
  "media_url": ["https://example.com/image.jpg"],
  "type": "text"
}
```

Parameters:
- `to`: Recipient's phone number in E.164 format
- `body`: Message content
- `media_url`: (Optional) Array of media URLs to attach
- `type`: (Optional) Message type, defaults to "text"
- `metadata`: (Optional) Additional metadata for the message

### Sending Templates

**POST /api/whatsapp/send-template**

Send a template message:

```json
{
  "to": "+1234567890",
  "template_name": "appointment_reminder",
  "parameters": {
    "1": "John Doe",
    "2": "3:00 PM",
    "3": "March 15"
  },
  "language_code": "en_US"
}
```

Parameters:
- `to`: Recipient's phone number in E.164 format
- `template_name`: Name of the pre-approved template
- `parameters`: (Optional) Values for template variables
- `language_code`: (Optional) Language code, defaults to "en"

### Webhook Endpoints

**Webhook URL: /api/whatsapp/webhook**

This endpoint handles:
- Incoming messages
- Message status updates
- Webhook verification

## Implementation Details

### Services

The WhatsApp integration consists of two main services:

1. **WhatsAppService** (`app/services/messages.py`)
   - High-level service that abstracts provider details
   - Handles message storage, status updates, and webhooks
   - Delegates actual message sending to the appropriate provider

2. **TwilioService** (`app/services/twilio_service.py`)
   - Handles Twilio-specific implementation details
   - Manages the Twilio client and API calls
   - Processes Twilio webhooks

### Provider Architecture

The architecture follows a provider pattern:

```
                  ┌───────────────────┐
                  │   WhatsAppService │
                  └─────────┬─────────┘
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
        ┌───────────────┐   ┌───────────────┐
        │ Direct API    │   │ TwilioService │
        └───────────────┘   └───────────────┘
                │                   │
                ▼                   ▼
        ┌───────────────┐   ┌───────────────┐
        │ Meta/Facebook │   │  Twilio API   │
        └───────────────┘   └───────────────┘
```

## Setup Instructions

### Twilio Setup

1. Create a Twilio account at https://www.twilio.com
2. Activate WhatsApp in your Twilio account
3. Note your Account SID and Auth Token
4. Configure your webhook URL in the Twilio dashboard:
   - Set your webhook URL to: `https://your-domain.com/api/whatsapp/webhook`
   - Enable the webhook for incoming messages and message status updates

### Direct WhatsApp API Setup

1. Create a Facebook Business account
2. Apply for WhatsApp Business API access
3. Create a WhatsApp Business account in the Facebook Developer portal
4. Generate an access token
5. Set up a webhook endpoint with your verification token

## Testing

To test your WhatsApp integration:

1. Ensure your environment variables are set correctly
2. Send a test message using the `/api/whatsapp/send` endpoint
3. Check message delivery status
4. Test receiving messages by sending a message to your WhatsApp number

For webhook testing, you can use a tool like ngrok to expose your local development server.

## Troubleshooting

Common issues:

1. **Message not sending**: Check your credentials and provider configuration
2. **Webhook not receiving messages**: Verify webhook URL is correctly set in Twilio/Facebook dashboard
3. **Templates not working**: Ensure templates are pre-approved in your WhatsApp Business account
4. **Status updates not processing**: Check webhook registration for status events

For detailed error information, check the application logs.

## References

- [Twilio WhatsApp API Documentation](https://www.twilio.com/docs/whatsapp/api)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/api/) 