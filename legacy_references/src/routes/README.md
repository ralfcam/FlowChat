# Routes Directory

This directory contains API route definitions from the legacy WhatsApp CRM project. Below is the recommended structure and patterns for FlowChat implementation.

## Directory Structure

```
routes/
├── api/                  # API route definitions
│   ├── v1/              # Version 1 routes
│   │   ├── whatsapp.ts  # WhatsApp routes
│   │   ├── users.ts     # User routes
│   │   ├── contacts.ts  # Contact routes
│   │   └── analytics.ts # Analytics routes
│   └── v2/              # Version 2 routes (future)
├── webhooks/            # Webhook routes
│   ├── whatsapp.ts      # WhatsApp webhooks
│   └── integrations.ts  # Third-party webhooks
├── auth/                # Authentication routes
│   ├── local.ts         # Local auth routes
│   └── oauth.ts         # OAuth routes
└── system/              # System routes
    ├── health.ts        # Health check routes
    └── status.ts        # Status routes
```

## Route Patterns

### 1. Route Configuration
```typescript
import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { rateLimit } from '../middleware/rate-limit';

export function createWhatsAppRoutes(
  controller: WhatsAppController,
  config: RouteConfig
): Router {
  const router = Router();

  // Apply middleware
  router.use(authenticate);
  router.use(rateLimit(config.rateLimit));

  // Define routes
  router.post(
    '/messages',
    validate(MessageSchema),
    controller.sendMessage.bind(controller)
  );

  router.get(
    '/messages/:id',
    validate(IdSchema, 'params'),
    controller.getMessage.bind(controller)
  );

  return router;
}
```

### 2. Route Versioning
```typescript
import { Router } from 'express';
import { createWhatsAppRoutes } from './api/v1/whatsapp';
import { createUserRoutes } from './api/v1/users';

export function createApiRoutes(
  controllers: Controllers,
  config: RouteConfig
): Router {
  const router = Router();

  // Version 1 routes
  router.use(
    '/v1/whatsapp',
    createWhatsAppRoutes(controllers.whatsapp, config)
  );

  router.use(
    '/v1/users',
    createUserRoutes(controllers.users, config)
  );

  return router;
}
```

### 3. Webhook Routes
```typescript
import { Router } from 'express';
import { WhatsAppWebhookController } from '../controllers/webhooks';
import { validateWebhook } from '../middleware/webhook';

export function createWebhookRoutes(
  controller: WhatsAppWebhookController
): Router {
  const router = Router();

  router.post(
    '/whatsapp',
    validateWebhook,
    controller.handleWebhook.bind(controller)
  );

  return router;
}
```

## Best Practices

### 1. Route Organization
```typescript
// Route module pattern
export interface RouteModule {
  path: string;
  router: Router;
  middleware?: RequestHandler[];
}

// Route registration
export function registerRoutes(app: Express, modules: RouteModule[]): void {
  for (const module of modules) {
    if (module.middleware) {
      app.use(module.path, module.middleware, module.router);
    } else {
      app.use(module.path, module.router);
    }
  }
}
```

### 2. Middleware Application
```typescript
// Middleware configuration
interface MiddlewareConfig {
  global?: RequestHandler[];
  auth?: RequestHandler[];
  validation?: RequestHandler[];
  errorHandling?: ErrorRequestHandler[];
}

// Apply middleware
export function applyMiddleware(
  app: Express,
  config: MiddlewareConfig
): void {
  // Global middleware
  if (config.global) {
    app.use(config.global);
  }

  // Auth middleware
  if (config.auth) {
    app.use('/api', config.auth);
  }

  // Validation middleware
  if (config.validation) {
    app.use('/api', config.validation);
  }

  // Error handling (must be last)
  if (config.errorHandling) {
    app.use(config.errorHandling);
  }
}
```

### 3. Route Documentation
```typescript
// OpenAPI/Swagger documentation
export const messageRoutes = {
  '/api/v1/messages': {
    post: {
      summary: 'Send a message',
      tags: ['Messages'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: MessageSchema
          }
        }
      },
      responses: {
        200: {
          description: 'Message sent successfully',
          content: {
            'application/json': {
              schema: MessageResponseSchema
            }
          }
        }
      }
    }
  }
};
```

## Security Patterns

### 1. Authentication Routes
```typescript
export function createAuthRoutes(
  controller: AuthController,
  config: AuthConfig
): Router {
  const router = Router();

  router.post(
    '/login',
    validate(LoginSchema),
    rateLimit(config.loginRateLimit),
    controller.login.bind(controller)
  );

  router.post(
    '/refresh',
    validate(RefreshSchema),
    controller.refresh.bind(controller)
  );

  router.post(
    '/logout',
    authenticate,
    controller.logout.bind(controller)
  );

  return router;
}
```

### 2. Protected Routes
```typescript
export function createProtectedRoutes(
  controller: ProtectedController,
  config: RouteConfig
): Router {
  const router = Router();

  // Authentication
  router.use(authenticate);

  // Authorization
  router.use(authorize(['admin']));

  // Rate limiting
  router.use(rateLimit(config.rateLimit));

  // Routes
  router.get(
    '/sensitive-data',
    controller.getSensitiveData.bind(controller)
  );

  return router;
}
```

## Testing Patterns

### 1. Route Testing
```typescript
describe('WhatsApp Routes', () => {
  let app: Express;
  let controller: WhatsAppController;

  beforeAll(() => {
    controller = new WhatsAppController(messageService, logger);
    app = createTestApp();
    app.use('/api/v1/whatsapp', createWhatsAppRoutes(controller, config));
  });

  it('should send messages', async () => {
    const response = await request(app)
      .post('/api/v1/whatsapp/messages')
      .send({
        to: '+1234567890',
        content: 'Test message'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### 2. Middleware Testing
```typescript
describe('Auth Middleware', () => {
  let app: Express;
  let authMiddleware: AuthMiddleware;

  beforeAll(() => {
    authMiddleware = new AuthMiddleware(authService);
    app = createTestApp();
    app.use(authMiddleware.authenticate.bind(authMiddleware));
    app.get('/protected', (req, res) => res.json({ success: true }));
  });

  it('should authenticate valid tokens', async () => {
    const token = createTestToken();
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
```

## Performance Optimization

### 1. Route Caching
```typescript
export function cachingMiddleware(config: CacheConfig): RequestHandler {
  return async (req, res, next) => {
    const key = `${req.method}:${req.path}`;
    const cached = await cache.get(key);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    res.originalJson = res.json;
    res.json = (body: any) => {
      cache.set(key, JSON.stringify(body), config.ttl);
      return res.originalJson(body);
    };

    next();
  };
}
```

### 2. Route Optimization
```typescript
export function optimizeRoutes(router: Router): void {
  // Combine common middleware
  const commonMiddleware = [
    authenticate,
    rateLimit(config.rateLimit),
    validate(commonSchema)
  ];

  // Apply to route group
  router.use('/api/v1', commonMiddleware);

  // Optimize route parameters
  router.param('id', async (req, res, next, id) => {
    try {
      req.entity = await loadEntity(id);
      next();
    } catch (error) {
      next(error);
    }
  });
}
```

### 3. Load Balancing
```typescript
export function loadBalanceRoutes(app: Express, config: LoadBalanceConfig): void {
  // Health check route for load balancer
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Sticky session support
  app.use(session({
    store: new RedisStore(config.redis),
    secret: config.secret,
    resave: false,
    saveUninitialized: false
  }));
}
``` 