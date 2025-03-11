# Implementation Patterns Guide

This document outlines key implementation patterns from the legacy WhatsApp CRM project that can be adapted for FlowChat.

## Architecture Patterns

### 1. Service Layer Architecture
```typescript
// Example service structure
services/
  ├── whatsapp/
  │   ├── client.ts        // Twilio client configuration
  │   ├── messages.ts      // Message handling
  │   └── webhooks.ts      // Webhook handlers
  ├── ai/
  │   ├── openai.ts        // OpenAI client
  │   └── prompts.ts       // Prompt templates
  └── base/
      ├── types.ts         // Shared types
      └── errors.ts        // Error handling
```

### 2. Component Architecture
```typescript
components/
  ├── common/             // Reusable UI components
  ├── layout/             // Layout components
  ├── features/          // Feature-specific components
  └── providers/         // Context providers
```

## Integration Patterns

### 1. WhatsApp Integration
```typescript
// Example WhatsApp message handler
export async function sendMessage(to: string, content: string) {
  try {
    const message = await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      body: content
    });
    return { success: true, messageId: message.sid };
  } catch (error) {
    handleTwilioError(error);
    return { success: false, error };
  }
}
```

### 2. Authentication Flow
```typescript
// Example auth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      // Add custom session handling
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
```

## Data Management Patterns

### 1. Contact Management
```typescript
interface Contact {
  id: string;
  phoneNumber: string;
  name: string;
  status: 'active' | 'inactive' | 'blocked';
  tags: string[];
  lastContact: Date;
}

// Example contact service
class ContactService {
  async create(data: Omit<Contact, 'id'>) {
    // Validation and creation logic
  }

  async update(id: string, data: Partial<Contact>) {
    // Update logic with validation
  }
}
```

### 2. Message Queue Pattern
```typescript
interface MessageQueue {
  add(message: OutboundMessage): Promise<void>;
  process(): Promise<void>;
  retry(messageId: string): Promise<void>;
}

// Implementation with rate limiting
class WhatsAppMessageQueue implements MessageQueue {
  private queue: OutboundMessage[] = [];
  private processing = false;

  async add(message: OutboundMessage) {
    this.queue.push(message);
    if (!this.processing) {
      await this.process();
    }
  }
}
```

## Error Handling Patterns

### 1. API Error Handling
```typescript
class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    // Handle known API errors
    return { error: error.message, status: error.statusCode };
  }
  // Handle unknown errors
  return { error: 'Internal Server Error', status: 500 };
}
```

### 2. Service Error Handling
```typescript
class ServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public retry?: boolean
  ) {
    super(message);
  }
}

function handleServiceError(error: unknown) {
  if (error instanceof ServiceError) {
    // Log error
    logger.error({
      code: error.code,
      message: error.message,
      retry: error.retry
    });
    // Handle retry logic if needed
    if (error.retry) {
      // Add to retry queue
    }
  }
}
```

## Security Patterns

### 1. Input Validation
```typescript
import { z } from 'zod';

const MessageSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/),
  content: z.string().min(1).max(1600),
  type: z.enum(['text', 'template']),
});

function validateMessage(data: unknown) {
  return MessageSchema.parse(data);
}
```

### 2. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

## Testing Patterns

### 1. Service Mocking
```typescript
// Example test setup
import { mockDeep, mockReset } from 'jest-mock-extended';

jest.mock('@services/whatsapp/client', () => ({
  twilioClient: mockDeep<TwilioClient>(),
}));

beforeEach(() => {
  mockReset(twilioClient);
});
```

### 2. Integration Testing
```typescript
describe('WhatsApp Integration', () => {
  it('should handle message sending', async () => {
    const message = await sendMessage('+1234567890', 'Test message');
    expect(message.success).toBe(true);
    expect(twilioClient.messages.create).toHaveBeenCalledWith({
      from: expect.any(String),
      to: expect.any(String),
      body: 'Test message'
    });
  });
});
```

## Best Practices

1. **Error Handling**
   - Always use typed errors
   - Implement proper logging
   - Handle retries appropriately

2. **Security**
   - Validate all inputs
   - Implement rate limiting
   - Use proper authentication

3. **Testing**
   - Write unit tests for services
   - Implement integration tests
   - Use proper mocking

4. **Performance**
   - Implement caching where appropriate
   - Use connection pooling
   - Implement proper error boundaries 