# Conciliating FlowChat Backend and Frontend

This guide explains how to get the backend and frontend working together seamlessly.

## Setup

1. **Backend Setup**
   - Navigate to the backend directory: `cd backend`
   - Create a virtual environment (if not already done): `python -m venv venv`
   - Activate the virtual environment:
     - Windows: `venv\Scripts\activate`
     - Unix/MacOS: `source venv/bin/activate`
   - Install dependencies: `pip install -r requirements.txt`
   - Make sure your `.env` file is set up correctly (see `.env.example`)

2. **Frontend Setup**
   - Navigate to the frontend directory: `cd frontend`
   - Install dependencies: `npm install`
   - Create a `.env` file with the backend API URL:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

## Running the Application

### Option 1: Using the provided scripts
- **Windows**: Run `start.bat` from the root directory
- **Unix/MacOS**: Run `./start.sh` from the root directory (make it executable first with `chmod +x start.sh`)

### Option 2: Manually starting each service
1. **Start the Backend**
   - Navigate to the backend directory: `cd backend`
   - Activate the virtual environment (see setup)
   - Run: `python app.py`

2. **Start the Frontend**
   - Navigate to the frontend directory: `cd frontend`
   - Run: `npm run start`

## API Integration

The frontend is already configured to communicate with the backend through the API service in `frontend/src/services/api.ts`. This file:

- Sets up axios with the backend URL
- Handles authentication via tokens
- Manages token refreshing
- Provides helper methods for different HTTP methods

To use an API endpoint in a component:

```typescript
import apiService from '../services/api';

// Example of using the API in a component
const fetchData = async () => {
  try {
    const data = await apiService.get('/endpoint');
    // Do something with the data
  } catch (error) {
    // Handle error
  }
};
```

## Available API Endpoints

The backend exposes the following main API endpoints:

1. **Authentication** (`/api/auth`)
   - Login, logout, register, refresh token

2. **Messages** (`/api/messages`)
   - Send, receive, and manage messages

3. **Contacts** (`/api/contacts`)
   - Manage your contacts

4. **Webhooks** (`/api/webhooks`)
   - For integration with external services

5. **WhatsApp** (`/api/whatsapp`)
   - WhatsApp-specific functionality

For detailed API documentation, refer to the backend documentation in `backend/docs`.

## Troubleshooting

- If you encounter CORS issues, make sure your backend is configured to allow requests from your frontend origin.
- Check that both services are running on the expected ports.
- Verify that your authentication tokens are being properly stored and sent with requests. 