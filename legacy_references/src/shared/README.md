# Shared Directory

This directory contains shared utilities and types from the legacy WhatsApp CRM project. Below are detailed implementation examples for FlowChat.

## Directory Structure

```
shared/
├── types/               # TypeScript types and interfaces
│   ├── api.ts          # API types
│   ├── models.ts       # Model types
│   └── common.ts       # Common types
├── utils/              # Utility functions
│   ├── validation.ts   # Validation helpers
│   ├── formatting.ts   # Formatting helpers
│   └── crypto.ts       # Crypto helpers
├── errors/             # Error definitions
│   ├── api.ts         # API errors
│   ├── business.ts    # Business errors
│   └── database.ts    # Database errors
├── logger/            # Logging utilities
│   ├── winston.ts     # Winston logger
│   └── pino.ts       # Pino logger
└── constants/         # Constants and enums
    ├── api.ts        # API constants
    └── common.ts     # Common constants
```

## Implementation Examples

### 1. Type Definitions

```typescript
// shared/types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

// shared/types/models.ts
export interface BaseModel {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserModel extends BaseModel {
  email: string;
  name: string;
  role: UserRole;
  settings: UserSettings;
}

export interface MessageModel extends BaseModel {
  from_user_id: string;
  to_contact_id: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  metadata: Record<string, unknown>;
}

// shared/types/common.ts
export type UserRole = 'admin' | 'user' | 'guest';

export type MessageType = 'text' | 'template' | 'media';

export type MessageStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}
```

### 2. Error Handling

```typescript
// shared/errors/base.ts
export abstract class BaseError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

// shared/errors/api.ts
import { BaseError } from './base';

export class ApiError extends BaseError {
  constructor(
    message: string,
    code: string = 'API_ERROR',
    status: number = 500,
    details?: unknown
  ) {
    super(message, code, status, details);
  }

  static badRequest(
    message: string,
    code: string = 'BAD_REQUEST',
    details?: unknown
  ): ApiError {
    return new ApiError(message, code, 400, details);
  }

  static unauthorized(
    message: string = 'Unauthorized',
    code: string = 'UNAUTHORIZED',
    details?: unknown
  ): ApiError {
    return new ApiError(message, code, 401, details);
  }

  static forbidden(
    message: string = 'Forbidden',
    code: string = 'FORBIDDEN',
    details?: unknown
  ): ApiError {
    return new ApiError(message, code, 403, details);
  }

  static notFound(
    message: string = 'Not found',
    code: string = 'NOT_FOUND',
    details?: unknown
  ): ApiError {
    return new ApiError(message, code, 404, details);
  }

  static conflict(
    message: string,
    code: string = 'CONFLICT',
    details?: unknown
  ): ApiError {
    return new ApiError(message, code, 409, details);
  }
}

// shared/errors/business.ts
import { BaseError } from './base';

export class BusinessError extends BaseError {
  constructor(
    message: string,
    code: string = 'BUSINESS_ERROR',
    status: number = 400,
    details?: unknown
  ) {
    super(message, code, status, details);
  }

  static validation(
    message: string,
    details?: unknown
  ): BusinessError {
    return new BusinessError(message, 'VALIDATION_ERROR', 400, details);
  }

  static notFound(
    message: string,
    details?: unknown
  ): BusinessError {
    return new BusinessError(message, 'NOT_FOUND', 404, details);
  }

  static conflict(
    message: string,
    details?: unknown
  ): BusinessError {
    return new BusinessError(message, 'CONFLICT', 409, details);
  }
}
```

### 3. Logging

```typescript
// shared/logger/winston.ts
import winston from 'winston';
import { Format } from 'logform';

interface LoggerConfig {
  level: string;
  format: Format;
  transports: winston.transport[];
}

export class Logger {
  private logger: winston.Logger;

  constructor(config: LoggerConfig) {
    this.logger = winston.createLogger({
      level: config.level,
      format: config.format,
      transports: config.transports
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}

// Example logger configuration
export function createLogger(): Logger {
  const config: LoggerConfig = {
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({
        filename: 'error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'combined.log'
      })
    ]
  };

  return new Logger(config);
}
```

### 4. Utility Functions

```typescript
// shared/utils/validation.ts
import { z } from 'zod';
import { BusinessError } from '../errors/business';

export async function validate<T>(
  schema: z.Schema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw BusinessError.validation(
        'Validation failed',
        error.errors
      );
    }
    throw error;
  }
}

export function validateSync<T>(
  schema: z.Schema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw BusinessError.validation(
        'Validation failed',
        error.errors
      );
    }
    throw error;
  }
}

// shared/utils/formatting.ts
export function formatPhoneNumber(
  phone: string,
  countryCode: string = '1'
): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Add country code if not present
  if (!cleaned.startsWith(countryCode)) {
    return `+${countryCode}${cleaned}`;
  }

  return `+${cleaned}`;
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// shared/utils/crypto.ts
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(
  password: string
): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(
    password,
    salt,
    64
  ) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, key] = hash.split(':');
  const derivedKey = await scryptAsync(
    password,
    salt,
    64
  ) as Buffer;

  return key === derivedKey.toString('hex');
}
```

### 5. Constants

```typescript
// shared/constants/api.ts
export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  USERS: {
    BASE: '/users',
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`
  },
  MESSAGES: {
    BASE: '/messages',
    BY_ID: (id: string) => `/messages/${id}`,
    BY_CONTACT: (contactId: string) => `/messages/contact/${contactId}`
  }
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
} as const;

// shared/constants/common.ts
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
} as const;

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
} as const;

export const MESSAGE_TYPE = {
  TEXT: 'text',
  TEMPLATE: 'template',
  MEDIA: 'media'
} as const;

export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  SESSION: (id: string) => `session:${id}`,
  MESSAGES: (contactId: string) => `messages:${contactId}`
} as const;
```

## Usage Examples

### 1. Using Types and Validation

```typescript
// services/user.ts
import { UserModel, UserRole } from '../shared/types/models';
import { validate } from '../shared/utils/validation';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'user', 'guest'] as const),
  settings: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
    language: z.string()
  })
});

export class UserService {
  async createUser(data: unknown): Promise<UserModel> {
    const validated = await validate(CreateUserSchema, data);
    return this.userModel.create(validated);
  }
}
```

### 2. Using Error Handling

```typescript
// controllers/auth.ts
import { ApiError } from '../shared/errors/api';
import { BusinessError } from '../shared/errors/business';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw ApiError.badRequest('Email and password are required');
      }

      const user = await this.authService.login(email, password);
      if (!user) {
        throw ApiError.unauthorized('Invalid credentials');
      }

      res.json({ success: true, data: user });
    } catch (error) {
      if (error instanceof BusinessError) {
        throw ApiError.badRequest(error.message);
      }
      throw error;
    }
  }
}
```

### 3. Using Logger

```typescript
// services/message.ts
import { Logger } from '../shared/logger/winston';
import { MessageModel } from '../shared/types/models';

export class MessageService {
  constructor(
    private logger: Logger
  ) {}

  async sendMessage(message: MessageModel): Promise<void> {
    try {
      this.logger.info('Sending message', {
        to: message.to_contact_id,
        type: message.type
      });

      await this.messageQueue.send(message);

      this.logger.debug('Message queued', {
        id: message.id,
        status: 'pending'
      });
    } catch (error) {
      this.logger.error('Failed to send message', {
        error,
        message: message.id
      });
      throw error;
    }
  }
}
```

### 4. Using Constants

```typescript
// middleware/auth.ts
import { ROLES } from '../shared/constants/common';
import { ApiError } from '../shared/errors/api';

export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      throw ApiError.unauthorized();
    }

    if (userRole === ROLES.ADMIN) {
      return next();
    }

    if (!roles.includes(userRole)) {
      throw ApiError.forbidden();
    }

    next();
  };
}
``` 