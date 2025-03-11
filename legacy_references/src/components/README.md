# Components Directory

This directory contains React components from the legacy WhatsApp CRM project. Below is the recommended structure and patterns for FlowChat implementation.

## Directory Structure

```
components/
├── common/               # Reusable UI components
│   ├── Button/
│   ├── Input/
│   ├── Select/
│   └── Dialog/
├── layout/              # Layout components
│   ├── Dashboard/
│   ├── Sidebar/
│   ├── Header/
│   └── Footer/
├── chat/                # Chat-related components
│   ├── ConversationList/
│   ├── MessageBubble/
│   ├── ChatInput/
│   └── AttachmentHandler/
├── forms/               # Form components
│   ├── ContactForm/
│   ├── SettingsForm/
│   ├── MessageTemplate/
│   └── ValidationMessage/
└── data/                # Data display components
    ├── DataTable/
    ├── Charts/
    ├── Statistics/
    └── Reports/
```

## Component Patterns

### 1. Common Components
```typescript
// Example Button component
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  isLoading,
  disabled,
  onClick,
  children
}) => {
  // Implementation
};
```

### 2. Layout Components
```typescript
// Example Dashboard layout
interface DashboardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Dashboard: React.FC<DashboardProps> = ({
  title,
  subtitle,
  children
}) => {
  // Implementation
};
```

### 3. Chat Components
```typescript
// Example ConversationList component
interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: Message;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (conversation: Conversation) => void;
  selectedId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelect,
  selectedId
}) => {
  // Implementation
};
```

## Best Practices

### 1. Component Organization
- Use TypeScript for type safety
- Implement proper prop validation
- Add JSDoc documentation
- Create unit tests
- Include Storybook stories

### 2. State Management
- Use React Query for server state
- Implement proper loading states
- Handle errors gracefully
- Add proper TypeScript types
- Document state patterns

### 3. Styling
- Use Tailwind CSS
- Implement responsive design
- Follow accessibility guidelines
- Use CSS modules when needed
- Document style patterns

### 4. Performance
- Implement proper memoization
- Use lazy loading
- Optimize re-renders
- Add error boundaries
- Document performance patterns

## Migration Guide

### 1. Component Migration
1. Review component implementation
2. Update TypeScript types
3. Modernize styling
4. Add proper documentation
5. Create unit tests

### 2. State Management
1. Implement React Query
2. Add proper loading states
3. Handle errors
4. Add TypeScript types
5. Document patterns

### 3. Testing
1. Write unit tests
2. Add integration tests
3. Create stories
4. Test accessibility
5. Document test patterns

## Security Considerations

### 1. Input Validation
- Validate all props
- Sanitize user input
- Handle edge cases
- Document validation

### 2. Error Handling
- Implement error boundaries
- Add proper logging
- Handle edge cases
- Document error patterns

### 3. Access Control
- Implement proper checks
- Add role validation
- Handle unauthorized access
- Document security patterns

## Performance Optimization

### 1. Component Level
- Use proper memoization
- Implement lazy loading
- Optimize re-renders
- Document optimizations

### 2. Data Level
- Implement proper caching
- Use optimistic updates
- Handle stale data
- Document data patterns

### 3. Resource Level
- Optimize images
- Lazy load resources
- Use proper compression
- Document resource handling 