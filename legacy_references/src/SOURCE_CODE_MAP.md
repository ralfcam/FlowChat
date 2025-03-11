# Legacy Source Code Map

This document maps the structure and patterns of the legacy WhatsApp CRM source code for reference in FlowChat development.

## Directory Structure

```
src/
├── backend/          # Backend server implementation
├── components/       # React components
├── controllers/      # API controllers
├── db/              # Database models and migrations
├── frontend/        # Frontend application
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic services
└── shared/          # Shared utilities and types
```

## Key Components

### Backend Layer
- Server configuration
- API implementation
- WebSocket handling
- Error management
- Logging system

### Component Layer
- UI components
- Layout components
- Form components
- Dialog components
- Data display components

### Controller Layer
- Request handling
- Response formatting
- Input validation
- Error handling
- Authentication checks

### Database Layer
- Schema definitions
- Migration scripts
- Seed data
- Query builders
- Database utilities

### Frontend Layer
- Page components
- State management
- Routing logic
- API integration
- Theme configuration

### Middleware Layer
- Authentication
- Request validation
- Error handling
- Logging
- Rate limiting

### Routes Layer
- API route definitions
- Route grouping
- Middleware attachment
- Parameter validation
- Response handling

### Services Layer
- Business logic
- External API integration
- Data processing
- Caching
- Background tasks

### Shared Layer
- Type definitions
- Utility functions
- Constants
- Interfaces
- Helper functions

## Integration Strategy

### 1. Component Migration
- Identify reusable components
- Update styling to match FlowChat
- Implement proper TypeScript types
- Add proper documentation
- Create usage examples

### 2. Service Integration
- Adapt service patterns
- Update API integrations
- Implement error handling
- Add logging
- Write tests

### 3. Database Migration
- Review schema design
- Plan data migration
- Update relationships
- Optimize queries
- Add indexes

### 4. Frontend Updates
- Modernize components
- Implement new features
- Update routing
- Add animations
- Improve accessibility

## Best Practices

### 1. Code Organization
- Follow consistent naming
- Use proper typing
- Document complex logic
- Add unit tests
- Implement error handling

### 2. Component Design
- Use atomic design
- Implement proper props
- Add prop validation
- Include documentation
- Create stories

### 3. Service Layer
- Implement proper separation
- Use dependency injection
- Add proper logging
- Handle errors
- Write tests

### 4. Database Access
- Use transactions
- Implement pooling
- Add proper indexes
- Optimize queries
- Handle errors

## Migration Notes

### Components to Migrate
1. Message Components
   - ConversationList
   - MessageBubble
   - ChatInput
   - AttachmentHandler

2. Form Components
   - InputField
   - SelectField
   - FileUpload
   - ValidationMessage

3. Layout Components
   - Dashboard
   - Sidebar
   - Header
   - Footer

4. Dialog Components
   - ConfirmDialog
   - AlertDialog
   - FormDialog
   - LoadingDialog

### Services to Adapt
1. WhatsApp Service
   - Message handling
   - Webhook processing
   - Status tracking
   - Error handling

2. User Service
   - Authentication
   - Authorization
   - Profile management
   - Preferences

3. Contact Service
   - Contact management
   - Group handling
   - Tags and categories
   - Search functionality

4. Analytics Service
   - Message tracking
   - User activity
   - Performance metrics
   - Report generation

## Security Considerations

### 1. Authentication
- Implement proper JWT handling
- Add refresh token logic
- Secure cookie handling
- Session management

### 2. Data Protection
- Encrypt sensitive data
- Implement proper validation
- Add rate limiting
- Handle file uploads securely

### 3. API Security
- Validate all inputs
- Implement CORS properly
- Add security headers
- Handle errors securely

### 4. Database Security
- Use prepared statements
- Implement proper access control
- Handle sensitive data
- Add audit logging

## Performance Optimization

### 1. Frontend
- Implement code splitting
- Add proper caching
- Optimize images
- Minimize bundle size

### 2. Backend
- Use connection pooling
- Implement caching
- Optimize queries
- Handle concurrency

### 3. API
- Implement pagination
- Add proper indexing
- Use compression
- Cache responses

### 4. Database
- Optimize schemas
- Add proper indexes
- Use query optimization
- Implement sharding if needed

## Testing Strategy

### 1. Unit Tests
- Test components
- Test services
- Test utilities
- Test helpers

### 2. Integration Tests
- Test API endpoints
- Test database access
- Test external services
- Test workflows

### 3. End-to-End Tests
- Test user flows
- Test error scenarios
- Test performance
- Test security

### 4. Performance Tests
- Load testing
- Stress testing
- Scalability testing
- Concurrency testing 