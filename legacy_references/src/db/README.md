# Database Directory

This directory contains database models, migrations, and utilities from the legacy WhatsApp CRM project. Below are detailed implementation examples for FlowChat.

## Directory Structure

```
db/
├── models/              # Database models
│   ├── user.ts         # User model
│   ├── message.ts      # Message model
│   ├── contact.ts      # Contact model
│   └── session.ts      # Session model
├── migrations/         # Database migrations
│   ├── 20240311.ts    # Initial schema
│   └── 20240312.ts    # Feature updates
├── seeds/             # Seed data
│   ├── users.ts       # User seeds
│   └── contacts.ts    # Contact seeds
├── config/            # Database config
│   ├── connection.ts  # Connection config
│   └── pool.ts        # Pool settings
└── utils/            # Database utilities
    ├── transaction.ts # Transaction helpers
    └── query.ts      # Query builders
```

## Implementation Examples

### 1. Database Models

```typescript
// db/models/base.ts
import { Pool, QueryResult } from 'pg';
import { Logger } from '../../shared/logger';
import { DatabaseError } from '../../shared/errors';

export abstract class BaseModel<T> {
  constructor(
    protected pool: Pool,
    protected logger: Logger,
    protected tableName: string
  ) {}

  protected async query(
    text: string,
    params: unknown[] = []
  ): Promise<QueryResult> {
    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      this.logger.debug('Executed query', {
        text,
        duration,
        rows: result.rowCount
      });

      return result;
    } catch (error) {
      this.logger.error('Query error:', error);
      throw new DatabaseError('Query execution failed', error as Error);
    }
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}): Promise<T[]> {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'created_at',
      order = 'DESC'
    } = options;

    const result = await this.query(
      `SELECT * FROM ${this.tableName}
       ORDER BY ${orderBy} ${order}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }

  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const result = await this.query(
      `INSERT INTO ${this.tableName} (${keys.join(', ')})
       VALUES (${placeholders})
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const result = await this.query(
      `UPDATE ${this.tableName}
       SET ${setClause}
       WHERE id = $1
       RETURNING *`,
      [id, ...values]
    );

    if (!result.rows[0]) {
      throw new DatabaseError('Record not found');
    }

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new DatabaseError('Record not found');
    }
  }
}

// db/models/user.ts
import { BaseModel } from './base';
import { hashPassword } from '../../shared/crypto';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export class UserModel extends BaseModel<User> {
  constructor(pool: Pool, logger: Logger) {
    super(pool, logger, 'users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const hashedPassword = await hashPassword(data.password);
    return super.create({
      ...data,
      password: hashedPassword
    });
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const hashedPassword = await hashPassword(password);
    await this.update(id, { password: hashedPassword });
  }
}

// db/models/message.ts
interface Message {
  id: string;
  from_user_id: string;
  to_contact_id: string;
  content: string;
  type: 'text' | 'template';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export class MessageModel extends BaseModel<Message> {
  constructor(pool: Pool, logger: Logger) {
    super(pool, logger, 'messages');
  }

  async findByContactId(
    contactId: string,
    options: {
      limit?: number;
      before?: Date;
    } = {}
  ): Promise<Message[]> {
    const { limit = 50, before = new Date() } = options;

    const result = await this.query(
      `SELECT * FROM messages
       WHERE to_contact_id = $1
       AND created_at < $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [contactId, before, limit]
    );

    return result.rows;
  }

  async updateStatus(
    id: string,
    status: Message['status']
  ): Promise<Message> {
    return this.update(id, { status });
  }

  async markAsRead(ids: string[]): Promise<void> {
    await this.query(
      `UPDATE messages
       SET status = 'read',
           updated_at = NOW()
       WHERE id = ANY($1)
       AND status = 'delivered'`,
      [ids]
    );
  }
}
```

### 2. Database Migrations

```typescript
// db/migrations/20240311.ts
import { Pool } from 'pg';
import { Logger } from '../../shared/logger';

export async function up(pool: Pool, logger: Logger): Promise<void> {
  logger.info('Running migration: 20240311');

  await pool.query(`
    -- Create users table
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create contacts table
    CREATE TABLE contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      tags TEXT[],
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create messages table
    CREATE TABLE messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_user_id UUID REFERENCES users(id),
      to_contact_id UUID REFERENCES contacts(id),
      content TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create sessions table
    CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX idx_messages_contact_created ON messages(to_contact_id, created_at DESC);
    CREATE INDEX idx_messages_status ON messages(status);
    CREATE INDEX idx_contacts_phone ON contacts(phone);
    CREATE INDEX idx_sessions_token ON sessions(token);
    CREATE INDEX idx_users_email ON users(email);
  `);

  logger.info('Migration completed: 20240311');
}

export async function down(pool: Pool, logger: Logger): Promise<void> {
  logger.info('Rolling back migration: 20240311');

  await pool.query(`
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS contacts;
    DROP TABLE IF EXISTS users;
  `);

  logger.info('Rollback completed: 20240311');
}
```

### 3. Database Configuration

```typescript
// db/config/connection.ts
import { Pool, PoolConfig } from 'pg';
import { Logger } from '../../shared/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class Database {
  private pool: Pool;
  private logger: Logger;

  constructor(config: DatabaseConfig, logger: Logger) {
    this.logger = logger;
    this.pool = new Pool({
      ...config,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000
    });

    this.setupPoolEvents();
  }

  private setupPoolEvents(): void {
    this.pool.on('connect', () => {
      this.logger.debug('New database connection established');
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected database error:', err);
    });

    this.pool.on('remove', () => {
      this.logger.debug('Database connection removed from pool');
    });
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database connection pool closed');
  }
}
```

### 4. Database Utilities

```typescript
// db/utils/transaction.ts
import { Pool, PoolClient } from 'pg';
import { Logger } from '../../shared/logger';
import { DatabaseError } from '../../shared/errors';

export class TransactionManager {
  constructor(
    private pool: Pool,
    private logger: Logger
  ) {}

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      this.logger.error('Transaction failed:', error);
      throw new DatabaseError(
        'Transaction failed',
        error as Error
      );
    } finally {
      client.release();
    }
  }

  async transactionWithSavepoint<T>(
    name: string,
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    return this.transaction(async (client) => {
      try {
        await client.query(`SAVEPOINT ${name}`);
        const result = await callback(client);
        await client.query(`RELEASE SAVEPOINT ${name}`);
        return result;
      } catch (error) {
        await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
        throw error;
      }
    });
  }
}

// db/utils/query.ts
export class QueryBuilder {
  private parts: {
    select: string[];
    from: string;
    joins: string[];
    where: string[];
    orderBy: string[];
    limit?: number;
    offset?: number;
    params: unknown[];
  };

  constructor() {
    this.parts = {
      select: [],
      from: '',
      joins: [],
      where: [],
      orderBy: [],
      params: []
    };
  }

  select(columns: string[]): this {
    this.parts.select = columns;
    return this;
  }

  from(table: string): this {
    this.parts.from = table;
    return this;
  }

  join(join: string): this {
    this.parts.joins.push(join);
    return this;
  }

  where(condition: string, ...params: unknown[]): this {
    this.parts.where.push(condition);
    this.parts.params.push(...params);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.parts.orderBy.push(`${column} ${direction}`);
    return this;
  }

  limit(limit: number): this {
    this.parts.limit = limit;
    return this;
  }

  offset(offset: number): this {
    this.parts.offset = offset;
    return this;
  }

  build(): { text: string; params: unknown[] } {
    const parts = [];

    // SELECT
    parts.push(
      `SELECT ${this.parts.select.length ? this.parts.select.join(', ') : '*'}`
    );

    // FROM
    parts.push(`FROM ${this.parts.from}`);

    // JOINS
    if (this.parts.joins.length) {
      parts.push(this.parts.joins.join(' '));
    }

    // WHERE
    if (this.parts.where.length) {
      parts.push(
        `WHERE ${this.parts.where.join(' AND ')}`
      );
    }

    // ORDER BY
    if (this.parts.orderBy.length) {
      parts.push(`ORDER BY ${this.parts.orderBy.join(', ')}`);
    }

    // LIMIT
    if (this.parts.limit !== undefined) {
      parts.push(`LIMIT ${this.parts.limit}`);
    }

    // OFFSET
    if (this.parts.offset !== undefined) {
      parts.push(`OFFSET ${this.parts.offset}`);
    }

    return {
      text: parts.join(' '),
      params: this.parts.params
    };
  }
}
```

## Usage Examples

### 1. Using Models

```typescript
// services/user.ts
export class UserService {
  constructor(
    private userModel: UserModel,
    private logger: Logger
  ) {}

  async createUser(data: CreateUserDTO): Promise<User> {
    this.logger.info('Creating new user:', { email: data.email });
    
    const existingUser = await this.userModel.findByEmail(data.email);
    if (existingUser) {
      throw new BusinessError('User already exists');
    }

    return this.userModel.create(data);
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    this.logger.info('Updating user:', { id });
    
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new BusinessError('User not found');
    }

    return this.userModel.update(id, data);
  }
}
```

### 2. Using Transactions

```typescript
// services/message.ts
export class MessageService {
  constructor(
    private messageModel: MessageModel,
    private contactModel: ContactModel,
    private transactionManager: TransactionManager,
    private logger: Logger
  ) {}

  async sendBulkMessages(
    messages: CreateMessageDTO[]
  ): Promise<Message[]> {
    return this.transactionManager.transaction(async (client) => {
      const results: Message[] = [];

      for (const message of messages) {
        // Verify contact exists
        const contact = await this.contactModel.findById(
          message.to_contact_id,
          client
        );
        
        if (!contact) {
          throw new BusinessError('Contact not found');
        }

        // Create message
        const result = await this.messageModel.create(
          message,
          client
        );
        
        results.push(result);
      }

      return results;
    });
  }
}
```

### 3. Using Query Builder

```typescript
// services/contact.ts
export class ContactService {
  constructor(
    private contactModel: ContactModel,
    private queryBuilder: QueryBuilder,
    private logger: Logger
  ) {}

  async searchContacts(
    options: SearchContactsDTO
  ): Promise<Contact[]> {
    const query = this.queryBuilder
      .select(['c.*', 'COUNT(m.id) as message_count'])
      .from('contacts c')
      .join('LEFT JOIN messages m ON m.to_contact_id = c.id')
      .where('c.tags @> $1', options.tags)
      .orderBy('message_count', 'DESC')
      .limit(options.limit)
      .offset(options.offset)
      .build();

    const result = await this.contactModel.query(
      query.text,
      query.params
    );

    return result.rows;
  }
}
``` 