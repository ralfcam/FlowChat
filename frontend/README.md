# FlowChat Frontend

A modern React-based frontend for the FlowChat WhatsApp CRM application. This application provides a user-friendly interface for managing WhatsApp conversations, contacts, and automated message flows.

## Features

- **Dashboard**: Overview of key metrics and recent activity
- **Flow Editor**: Visual editor for creating and managing WhatsApp message flows using React Flow
- **Contacts Management**: View, search, and manage WhatsApp contacts
- **Chat Interface**: Real-time WhatsApp conversation interface
- **Settings**: Configure application and WhatsApp API settings

## Tech Stack

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **React Router**: Navigation and routing
- **Material UI**: Component library for consistent design
- **React Flow**: Flow diagram editor for WhatsApp automation
- **Axios**: HTTP client for API communication

## Project Structure

```
frontend/
├── public/              # Static files
├── src/                 # Source code
│   ├── assets/          # Images, fonts, etc.
│   │   ├── common/      # Shared components
│   │   ├── flow/        # Flow editor components
│   │   └── layout/      # Layout components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── styles/          # Global styles
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main App component
│   └── index.tsx        # Entry point
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd FlowChat/frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Development

Start the development server:

```
npm start
```

or

```
yarn start
```

The application will be available at http://localhost:3000.

### Building for Production

Build the application for production:

```
npm run build
```

or

```
yarn build
```

## Integration with Backend

The frontend communicates with the FlowChat backend API for data retrieval and manipulation. The API endpoints are configured in the services directory.

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License. 