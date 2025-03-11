# Middleware Directory

This directory contains Express middleware implementations from the legacy WhatsApp CRM project. Below are detailed implementation examples for FlowChat.

## Directory Structure

```
middleware/
├── auth/                 # Authentication middleware
│   ├── jwt.ts           # JWT authentication
│   ├── session.ts       # Session management
│   └── roles.ts         # Role-based access control
├── validation/          # Request validation
│   ├── schemas.ts       # Validation schemas
│   ├── sanitize.ts     # Input sanitization
│   └── validator.ts     # Validation middleware
├── security/           # Security middleware
│   ├── rateLimit.ts    # Rate limiting
│   ├── cors.ts         # CORS configuration
│   └── helmet.ts       # Security headers
├── logging/            # Logging middleware
│   ├── request.ts      # Request logging
│   ├── error.ts        # Error logging
│   └── audit.ts        # Audit logging
└── common/             # Common middleware
    ├── compression.ts  # Response compression
    ├── parser.ts       # Body parsing
    └── cache.ts        # Response caching
```

## Implementation Examples

### 1. JWT Authentication Middleware

```typescript
// middleware/auth/jwt.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { Logger } from '../logging/logger';
import { ApiError } from '../../shared/errors';
import { UserService } from '../../services/user';

interface JWTPayload {
  userId: string;
  sessionId: string;
  roles: string[];
}

export class JWTAuthMiddleware {
  constructor(
    private redis: Redis,
    private userService: UserService,
    private logger: Logger,
    private config: {
      jwtSecret: string;
      tokenExpiry: number;
    }
  ) {}

  public authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract token
      const token = this.extractToken(req);
      if (!token) {
        throw ApiError.unauthorized('No token provided');
      }

      // Verify token
      const payload = await this.verifyToken(token);

      // Check if token is blacklisted
      const isBlacklisted = await this.checkBlacklist(payload.sessionId);
      if (isBlacklisted) {
        throw ApiError.unauthorized('Token has been revoked');
      }

      // Get user
      const user = await this.userService.findById(payload.userId);
      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      // Attach user and session to request
      req.user = user;
      req.session = {
        id: payload.sessionId,
        roles: payload.roles
      };

      next();
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      next(ApiError.unauthorized('Invalid or expired token'));
    }
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }

  private async verifyToken(token: string): Promise<JWTPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.config.jwtSecret, (err, decoded) => {
        if (err || !decoded) {
          reject(new Error('Token verification failed'));
          return;
        }
        resolve(decoded as JWTPayload);
      });
    });
  }

  private async checkBlacklist(sessionId: string): Promise<boolean> {
    const blacklisted = await this.redis.get(`blacklist:${sessionId}`);
    return !!blacklisted;
  }

  public createToken(payload: Omit<JWTPayload, 'exp'>): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.tokenExpiry
    });
  }

  public async revokeToken(sessionId: string): Promise<void> {
    await this.redis.set(
      `blacklist:${sessionId}`,
      '1',
      'EX',
      this.config.tokenExpiry
    );
  }
}
```

### 2. Request Validation Middleware

```typescript
// middleware/validation/validator.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../../shared/errors';
import { Logger } from '../logging/logger';

type ValidationTarget = 'body' | 'query' | 'params';

export class ValidationMiddleware {
  constructor(private logger: Logger) {}

  public validate = (schema: z.Schema, target: ValidationTarget = 'body') => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const data = req[target];
        const validated = await schema.parseAsync(data);
        req[target] = validated;
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formattedError = this.formatZodError(error);
          next(ApiError.badRequest(formattedError));
          return;
        }
        next(error);
      }
    };
  };

  private formatZodError(error: z.ZodError): string {
    return error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
  }
}

// Example validation schema
export const MessageSchema = z.object({
  to: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format')
    .min(10, 'Phone number too short')
    .max(15, 'Phone number too long'),
  content: z.string()
    .min(1, 'Message content is required')
    .max(4096, 'Message content too long'),
  type: z.enum(['text', 'template'], {
    errorMap: () => ({ message: 'Invalid message type' })
  }),
  metadata: z.record(z.unknown()).optional(),
  scheduledAt: z.string().datetime().optional(),
  priority: z.enum(['high', 'normal', 'low']).optional()
});
```

### 3. Rate Limiting Middleware

```typescript
// middleware/security/rateLimit.ts
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
import { ApiError } from '../../shared/errors';
import { Logger } from '../logging/logger';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Max requests per window
  keyPrefix: string;   // Redis key prefix
}

export class RateLimitMiddleware {
  constructor(
    private redis: Redis,
    private logger: Logger,
    private config: RateLimitConfig
  ) {}

  public limit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = this.generateKey(req);
      const [current] = await this.redis
        .multi()
        .incr(key)
        .expire(key, Math.floor(this.config.windowMs / 1000))
        .exec();

      if (!current?.[1]) {
        throw new Error('Failed to increment rate limit counter');
      }

      const count = current[1] as number;
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.config.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.max - count));
      res.setHeader(
        'X-RateLimit-Reset',
        new Date(Date.now() + this.config.windowMs).toISOString()
      );

      if (count > this.config.max) {
        throw ApiError.tooManyRequests('Rate limit exceeded');
      }

      next();
    } catch (error) {
      this.logger.error('Rate limit error:', error);
      next(error);
    }
  };

  private generateKey(req: Request): string {
    // Generate key based on IP and route
    const ip = req.ip;
    const route = req.path;
    return `${this.config.keyPrefix}:${ip}:${route}`;
  }

  public async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

### 4. Request Logging Middleware

```typescript
// middleware/logging/request.ts
import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger';
import { performance } from 'perf_hooks';

interface RequestLogMetadata {
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, unknown>;
  body?: Record<string, unknown>;
  userId?: string;
  duration: number;
  status: number;
  error?: Error;
}

export class RequestLoggingMiddleware {
  constructor(
    private logger: Logger,
    private config: {
      excludePaths: string[];
      sensitiveHeaders: string[];
      sensitiveFields: string[];
    }
  ) {}

  public logRequest = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Skip logging for excluded paths
    if (this.shouldSkip(req.path)) {
      return next();
    }

    const startTime = performance.now();

    // Capture response data
    const originalJson = res.json;
    res.json = (body: any) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.log({
        req,
        res,
        body,
        duration,
        error: undefined
      });

      return originalJson.call(res, body);
    };

    // Handle errors
    const handleError = (error: Error) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.log({
        req,
        res,
        body: undefined,
        duration,
        error
      });
    };

    res.on('error', handleError);
    next();
  };

  private shouldSkip(path: string): boolean {
    return this.config.excludePaths.some((excludePath) =>
      path.startsWith(excludePath)
    );
  }

  private log({
    req,
    res,
    body,
    duration,
    error
  }: {
    req: Request;
    res: Response;
    body: any;
    duration: number;
    error?: Error;
  }): void {
    const metadata: RequestLogMetadata = {
      method: req.method,
      path: req.path,
      query: this.sanitizeData(req.query),
      headers: this.sanitizeHeaders(req.headers),
      body: body ? this.sanitizeData(body) : undefined,
      userId: req.user?.id,
      duration: Math.round(duration),
      status: res.statusCode
    };

    if (error) {
      metadata.error = error;
      this.logger.error('Request failed', metadata);
    } else {
      this.logger.info('Request completed', metadata);
    }
  }

  private sanitizeHeaders(
    headers: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized = { ...headers };
    for (const header of this.config.sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  private sanitizeData(
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized = { ...data };
    for (const field of this.config.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
```

### 5. Error Handling Middleware

```typescript
// middleware/common/error.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../shared/errors';
import { Logger } from '../logging/logger';
import { ZodError } from 'zod';
import { JsonWebTokenError } from 'jsonwebtoken';

export class ErrorHandlingMiddleware {
  constructor(
    private logger: Logger,
    private config: {
      includeStackTrace: boolean;
    }
  ) {}

  public handle = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    let statusCode = 500;
    let errorResponse: Record<string, unknown> = {
      success: false,
      error: {
        message: 'An unexpected error occurred'
      }
    };

    // Handle known error types
    if (error instanceof ApiError) {
      statusCode = error.status;
      errorResponse.error = {
        code: error.code,
        message: error.message
      };
    } else if (error instanceof ZodError) {
      statusCode = 400;
      errorResponse.error = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors
      };
    } else if (error instanceof JsonWebTokenError) {
      statusCode = 401;
      errorResponse.error = {
        code: 'AUTH_ERROR',
        message: 'Invalid authentication token'
      };
    }

    // Add stack trace in development
    if (this.config.includeStackTrace) {
      errorResponse.stack = error.stack;
    }

    // Log error
    this.logger.error('Request error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });

    res.status(statusCode).json(errorResponse);
  };
}
```

## Usage Examples

### Setting up Middleware

```typescript
// app.ts
import express from 'express';
import { createRedisClient } from './shared/redis';
import { createLogger } from './shared/logger';
import { JWTAuthMiddleware } from './middleware/auth/jwt';
import { ValidationMiddleware } from './middleware/validation/validator';
import { RateLimitMiddleware } from './middleware/security/rateLimit';
import { RequestLoggingMiddleware } from './middleware/logging/request';
import { ErrorHandlingMiddleware } from './middleware/common/error';

async function setupMiddleware(app: express.Express): Promise<void> {
  // Initialize dependencies
  const redis = await createRedisClient();
  const logger = createLogger();

  // Create middleware instances
  const jwtAuth = new JWTAuthMiddleware(redis, userService, logger, {
    jwtSecret: process.env.JWT_SECRET!,
    tokenExpiry: 86400 // 24 hours
  });

  const validator = new ValidationMiddleware(logger);

  const rateLimit = new RateLimitMiddleware(redis, logger, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    keyPrefix: 'ratelimit'
  });

  const requestLogger = new RequestLoggingMiddleware(logger, {
    excludePaths: ['/health', '/metrics'],
    sensitiveHeaders: ['authorization', 'cookie'],
    sensitiveFields: ['password', 'token']
  });

  const errorHandler = new ErrorHandlingMiddleware(logger, {
    includeStackTrace: process.env.NODE_ENV === 'development'
  });

  // Apply middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger.logRequest);
  app.use('/api', jwtAuth.authenticate);
  app.use('/api', rateLimit.limit);
  app.use(errorHandler.handle);
}
```

### Using Validation Middleware

```typescript
// routes/api/v1/messages.ts
import { Router } from 'express';
import { ValidationMiddleware } from '../../../middleware/validation/validator';
import { MessageSchema } from '../../../middleware/validation/schemas';

export function createMessageRoutes(
  validator: ValidationMiddleware,
  controller: MessageController
): Router {
  const router = Router();

  router.post(
    '/send',
    validator.validate(MessageSchema),
    controller.sendMessage
  );

  return router;
}
```

## Testing Examples

### Testing JWT Authentication

```typescript
// middleware/auth/jwt.test.ts
import { Request, Response, NextFunction } from 'express';
import { JWTAuthMiddleware } from './jwt';
import { createMockRedis } from '../../test/mocks/redis';
import { createMockLogger } from '../../test/mocks/logger';
import { createMockUserService } from '../../test/mocks/userService';

describe('JWTAuthMiddleware', () => {
  let middleware: JWTAuthMiddleware;
  let mockRedis: jest.Mocked<Redis>;
  let mockLogger: jest.Mocked<Logger>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    mockLogger = createMockLogger();
    mockUserService = createMockUserService();

    middleware = new JWTAuthMiddleware(
      mockRedis,
      mockUserService,
      mockLogger,
      {
        jwtSecret: 'test-secret',
        tokenExpiry: 3600
      }
    );
  });

  it('should authenticate valid tokens', async () => {
    // Create a valid token
    const token = middleware.createToken({
      userId: '123',
      sessionId: '456',
      roles: ['user']
    });

    // Mock request
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    } as Request;

    const res = {} as Response;
    const next = jest.fn();

    // Mock user service response
    mockUserService.findById.mockResolvedValueOnce({
      id: '123',
      name: 'Test User'
    });

    // Execute middleware
    await middleware.authenticate(req, res, next);

    // Verify user was attached to request
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('123');
    expect(next).toHaveBeenCalled();
  });

  it('should reject invalid tokens', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid-token'
      }
    } as Request;

    const res = {} as Response;
    const next = jest.fn();

    await middleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 401,
        message: 'Invalid or expired token'
      })
    );
  });
});
``` 