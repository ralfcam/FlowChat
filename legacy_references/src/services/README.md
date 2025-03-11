# Services Directory

This directory contains business logic services from the legacy WhatsApp CRM project. Below is the recommended structure and patterns for FlowChat implementation.

## Directory Structure

```
services/
├── whatsapp/            # WhatsApp integration services
│   ├── client.ts
│   ├── messages.ts
│   └── webhooks.ts
├── user/               # User management services
│   ├── auth.ts
│   ├── profile.ts
│   └── preferences.ts
├── contact/            # Contact management services
│   ├── contacts.ts
│   ├── groups.ts
│   └── tags.ts
├── analytics/          # Analytics services
│   ├── tracking.ts
│   ├── reports.ts
│   └── metrics.ts
└── common/            # Shared services
    ├── http.ts
    ├── cache.ts
    └── queue.ts
```

## Service Patterns

### 1. WhatsApp Service
```typescript
// Example WhatsApp message service
interface MessageService {
  send(to: string, content: string): Promise<MessageResponse>;
  receive(webhook: WebhookPayload): Promise<void>;
  status(messageId: string): Promise<MessageStatus>;
}

class WhatsAppMessageService implements MessageService {
  private client: TwilioClient;
  private queue: MessageQueue;

  constructor(client: TwilioClient, queue: MessageQueue) {
    this.client = client;
    this.queue = queue;
  }

  async send(to: string, content: string): Promise<MessageResponse> {
    try {
      const message = await this.client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
        body: content
      });
      return { success: true, messageId: message.sid };
    } catch (error) {
      return { success: false, error: handleTwilioError(error) };
    }
  }
}
```

### 2. User Service
```typescript
// Example user authentication service
interface AuthService {
  login(credentials: Credentials): Promise<Session>;
  logout(sessionId: string): Promise<void>;
  refresh(token: string): Promise<Session>;
}

class UserAuthService implements AuthService {
  private db: Database;
  private tokenService: TokenService;

  constructor(db: Database, tokenService: TokenService) {
    this.db = db;
    this.tokenService = tokenService;
  }

  async login(credentials: Credentials): Promise<Session> {
    // Implementation
  }
}
```

### 3. Contact Service
```typescript
// Example contact management service
interface ContactService {
  create(data: ContactData): Promise<Contact>;
  update(id: string, data: Partial<ContactData>): Promise<Contact>;
  delete(id: string): Promise<void>;
  search(query: SearchQuery): Promise<Contact[]>;
}

class ContactManagementService implements ContactService {
  private db: Database;
  private cache: Cache;

  constructor(db: Database, cache: Cache) {
    this.db = db;
    this.cache = cache;
  }

  async create(data: ContactData): Promise<Contact> {
    // Implementation
  }
}
```

## Best Practices

### 1. Service Organization
- Use dependency injection
- Implement proper interfaces
- Add proper error handling
- Use TypeScript types
- Document service patterns

### 2. Error Handling
```typescript
// Example error handling
class ServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public retry?: boolean
  ) {
    super(message);
  }
}

function handleServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) {
    return error;
  }
  return new ServiceError('UNKNOWN_ERROR', 'An unknown error occurred');
}
```

### 3. Caching
```typescript
// Example caching service
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

class RedisCacheService implements CacheService {
  private client: Redis;

  constructor(client: Redis) {
    this.client = client;
  }

  async get<T>(key: string): Promise<T | null> {
    // Implementation
  }
}
```

### 4. Queue Management
```typescript
// Example queue service
interface QueueService {
  push<T>(data: T): Promise<void>;
  process<T>(): Promise<T | null>;
  retry(id: string): Promise<void>;
}

class MessageQueueService implements QueueService {
  private queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  async push<T>(data: T): Promise<void> {
    // Implementation
  }
}
```

## Security Patterns

### 1. Input Validation
```typescript
// Example validation
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
// Example rate limiting
class RateLimiter {
  private store: Store;
  private limit: number;
  private window: number;

  constructor(store: Store, limit: number, window: number) {
    this.store = store;
    this.limit = limit;
    this.window = window;
  }

  async isAllowed(key: string): Promise<boolean> {
    // Implementation
  }
}
```

## Testing Patterns

### 1. Unit Testing
```typescript
// Example test
describe('WhatsAppMessageService', () => {
  let service: WhatsAppMessageService;
  let mockClient: jest.Mocked<TwilioClient>;

  beforeEach(() => {
    mockClient = createMockClient();
    service = new WhatsAppMessageService(mockClient);
  });

  it('should send messages', async () => {
    const result = await service.send('+1234567890', 'Test');
    expect(result.success).toBe(true);
  });
});
```

### 2. Integration Testing
```typescript
// Example integration test
describe('ContactService Integration', () => {
  let service: ContactService;
  let db: Database;

  beforeAll(async () => {
    db = await createTestDatabase();
    service = new ContactService(db);
  });

  it('should create contacts', async () => {
    const contact = await service.create({
      name: 'Test User',
      phone: '+1234567890'
    });
    expect(contact.id).toBeDefined();
  });
});
```

## Performance Optimization

### 1. Caching Strategy
- Implement proper caching
- Use cache invalidation
- Handle cache misses
- Document cache patterns

### 2. Database Optimization
- Use connection pooling
- Implement query caching
- Optimize indexes
- Handle transactions

### 3. Queue Management
- Implement rate limiting
- Handle retries
- Process in batches
- Monitor performance 