# Controllers Directory

This directory contains API controllers from the legacy WhatsApp CRM project. Below is the recommended structure and patterns for FlowChat implementation.

## Directory Structure

```
controllers/
├── whatsapp/              # WhatsApp-related controllers
│   ├── messages.ts        # Message handling
│   ├── webhooks.ts        # Webhook processing
│   └── templates.ts       # Message templates
├── user/                  # User management controllers
│   ├── auth.ts           # Authentication
│   ├── profile.ts        # Profile management
│   └── settings.ts       # User settings
├── contact/              # Contact management controllers
│   ├── contacts.ts       # Contact CRUD
│   ├── groups.ts         # Group management
│   └── tags.ts          # Tag management
├── analytics/            # Analytics controllers
│   ├── reports.ts        # Report generation
│   ├── metrics.ts        # Metrics collection
│   └── export.ts        # Data export
└── system/              # System controllers
    ├── health.ts        # Health checks
    ├── status.ts        # System status
    └── logs.ts         # Log management
```

## Controller Patterns

### 1. Base Controller
```typescript
abstract class BaseController {
  protected service: any;
  protected logger: Logger;

  constructor(service: any, logger: Logger) {
    this.service = service;
    this.logger = logger;
  }

  protected handleError(error: unknown): ApiError {
    this.logger.error('Controller error:', error);
    if (error instanceof ServiceError) {
      return new ApiError(error.code, error.message);
    }
    return new ApiError('INTERNAL_ERROR', 'An unexpected error occurred');
  }

  protected validate<T>(schema: Schema, data: unknown): T {
    return schema.parse(data);
  }
}
```

### 2. WhatsApp Controller
```typescript
interface MessageRequest {
  to: string;
  content: string;
  type: 'text' | 'template';
  metadata?: Record<string, unknown>;
}

class WhatsAppController extends BaseController {
  constructor(
    private messageService: MessageService,
    logger: Logger
  ) {
    super(messageService, logger);
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const data = this.validate<MessageRequest>(MessageSchema, req.body);
      const result = await this.messageService.send(data);
      res.json(result);
    } catch (error) {
      const apiError = this.handleError(error);
      res.status(apiError.status).json(apiError);
    }
  }
}
```

### 3. User Controller
```typescript
class UserController extends BaseController {
  constructor(
    private authService: AuthService,
    logger: Logger
  ) {
    super(authService, logger);
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials = this.validate<Credentials>(CredentialsSchema, req.body);
      const session = await this.authService.login(credentials);
      res.json(session);
    } catch (error) {
      const apiError = this.handleError(error);
      res.status(apiError.status).json(apiError);
    }
  }
}
```

## Best Practices

### 1. Request Validation
```typescript
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
});

class ContactController extends BaseController {
  async create(req: Request, res: Response): Promise<void> {
    const data = this.validate(ContactSchema, req.body);
    // Implementation
  }
}
```

### 2. Response Formatting
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class Controller {
  protected sendSuccess<T>(res: Response, data: T): void {
    res.json({
      success: true,
      data
    });
  }

  protected sendError(res: Response, error: ApiError): void {
    res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }
}
```

### 3. Error Handling
```typescript
class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 500
  ) {
    super(message);
  }

  static badRequest(message: string): ApiError {
    return new ApiError('BAD_REQUEST', message, 400);
  }

  static unauthorized(message: string): ApiError {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message: string): ApiError {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static notFound(message: string): ApiError {
    return new ApiError('NOT_FOUND', message, 404);
  }
}
```

## Security Patterns

### 1. Authentication
```typescript
class AuthMiddleware {
  constructor(private authService: AuthService) {}

  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    try {
      const session = await this.authService.verify(token);
      req.user = session.user;
      next();
    } catch (error) {
      next(ApiError.unauthorized('Invalid token'));
    }
  }
}
```

### 2. Rate Limiting
```typescript
class RateLimitMiddleware {
  constructor(private limiter: RateLimiter) {}

  async limit(req: Request, res: Response, next: NextFunction): Promise<void> {
    const key = `${req.ip}:${req.path}`;
    const allowed = await this.limiter.isAllowed(key);

    if (!allowed) {
      throw ApiError.tooManyRequests('Rate limit exceeded');
    }

    next();
  }
}
```

## Testing Patterns

### 1. Unit Testing
```typescript
describe('WhatsAppController', () => {
  let controller: WhatsAppController;
  let mockService: jest.Mocked<MessageService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockService = createMockMessageService();
    mockLogger = createMockLogger();
    controller = new WhatsAppController(mockService, mockLogger);
  });

  it('should send messages', async () => {
    const req = mockRequest({
      body: {
        to: '+1234567890',
        content: 'Test message'
      }
    });
    const res = mockResponse();

    await controller.sendMessage(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.any(Object));
  });
});
```

### 2. Integration Testing
```typescript
describe('ContactController Integration', () => {
  let app: Express;
  let controller: ContactController;
  let service: ContactService;

  beforeAll(async () => {
    service = new ContactService(database);
    controller = new ContactController(service, logger);
    app = createTestApp(controller);
  });

  it('should create contacts', async () => {
    const response = await request(app)
      .post('/contacts')
      .send({
        name: 'Test User',
        phone: '+1234567890'
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});
```

## Performance Optimization

### 1. Request Processing
- Implement proper validation
- Use async/await correctly
- Handle errors efficiently
- Log appropriately

### 2. Response Handling
- Use proper status codes
- Format responses consistently
- Handle errors gracefully
- Implement caching headers

### 3. Middleware Optimization
- Order middleware properly
- Use efficient validation
- Implement proper caching
- Handle errors correctly 