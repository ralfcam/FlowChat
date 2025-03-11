# FlowChat Backend

A Python-based backend API for the FlowChat application, using Flask and MongoDB.

## Features

- User authentication with JWT
- WhatsApp message sending and receiving
- Contact management
- Webhook support for WhatsApp status updates and incoming messages

## Project Structure

```
backend/
├── app/
│   ├── models/        # MongoDB models
│   ├── routes/        # API endpoints
│   ├── services/      # Business logic
│   └── utils/         # Helper functions
├── config/            # Configuration settings
└── tests/             # Test cases
```

## Requirements

- Python 3.8+
- MongoDB 4.4+
- WhatsApp Business API access (for production)

## Installation

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and update the values:
   ```
   cp .env.example .env
   ```

4. Run the application:
   ```
   python app.py
   ```

## API Endpoints

### Authentication
- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/register` - User registration
- POST `/api/v1/auth/change-password` - Change password

### Messages
- POST `/api/v1/messages/send` - Send a WhatsApp message
- GET `/api/v1/messages/contact/:contact_id` - Get messages for a contact
- GET `/api/v1/messages/:message_id` - Get a specific message
- PUT `/api/v1/messages/:message_id/status` - Update message status

### Contacts
- GET `/api/v1/contacts` - Get all contacts
- GET `/api/v1/contacts/:contact_id` - Get a specific contact
- POST `/api/v1/contacts` - Create a new contact
- PUT `/api/v1/contacts/:contact_id` - Update a contact
- DELETE `/api/v1/contacts/:contact_id` - Delete a contact
- POST `/api/v1/contacts/:contact_id/tags` - Add a tag to a contact
- DELETE `/api/v1/contacts/:contact_id/tags/:tag` - Remove a tag from a contact

### Webhooks
- GET `/webhooks/whatsapp` - WhatsApp webhook verification
- POST `/webhooks/whatsapp` - WhatsApp webhook notification receiver

## Development

The project uses Flask for the API framework and PyMongo for database operations. JWT is used for authentication. 