# FlowChat

FlowChat is a visual workflow automation platform designed to simplify WhatsApp Business messaging integration. It enables non-technical users to create powerful communication workflows through an intuitive, component-based interface.

## Key Features

- **Visual Workflow Builder**: Create complex messaging workflows using a drag-and-drop interface
- **Data Integration**: Seamlessly import and manage contacts from various sources (CSV, databases)
- **AI-Powered Messaging**: Leverage LLMs for personalized message generation at scale
- **WhatsApp Business API**: Send and receive messages with full API compliance
- **Analytics Dashboard**: Track campaign performance and user engagement metrics
- **Extensible Architecture**: Designed for future expansion to additional messaging channels

## Project Structure

The project is organized into two main components:

```
FlowChat/
├── frontend/           # React-based UI
│   ├── public/         # Static files
│   ├── src/            # Source code
│   │   ├── components/ # React components
│   │   ├── context/    # React context providers
│   │   ├── pages/      # Page components
│   │   └── services/   # API services
│   └── package.json    # Frontend dependencies
│
└── backend/            # Flask-based API
    ├── app/            # Application code
    │   ├── models/     # MongoDB models
    │   ├── routes/     # API endpoints
    │   └── services/   # Business logic
    ├── config/         # Configuration settings
    └── tests/          # Test cases
```

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material UI** for component styling
- **React Flow** for the visual workflow editor
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Flask** web framework
- **MongoDB** for data storage
- **JWT** for authentication
- **Python 3.8+** runtime

## Project Status

⚠️ **Under Development**: FlowChat is currently in its initial development phase.

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python 3.8+
- MongoDB
- WhatsApp Business API credentials

### Frontend Installation

1. Navigate to the frontend directory:
   ```
   cd FlowChat/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   
   The application will be available at http://localhost:3000.

### Backend Installation

1. Navigate to the backend directory:
   ```
   cd FlowChat/backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and update the values:
   ```
   cp .env.example .env
   ```

5. Run the application:
   ```
   python app.py
   ```
   
   The API will be available at http://localhost:5000.

## API Endpoints

The backend provides several API endpoints for managing contacts, messages, and workflows:

- **Authentication**: User registration, login, and password management
- **Messages**: Send and receive WhatsApp messages
- **Contacts**: Manage WhatsApp contacts and tags
- **Flows**: Create, update, and execute message workflows
- **Webhooks**: Receive WhatsApp status updates and incoming messages

## Documentation

Comprehensive documentation is available in the following files:

- [DEVELOPMENT.md](DEVELOPMENT.md): Guidelines for development mode, authentication bypass, and debugging
- [docs/PRESET_FLOWS.md](docs/PRESET_FLOWS.md): Detailed guide for using and creating preset flows
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): Solutions for common issues and problems
- Additional documentation is available in the `/docs` directory.

## Contributing

We welcome contributions! Please see our contribution guidelines in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please open an issue on the repository.