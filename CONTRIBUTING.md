# Contributing to BlockView

Thank you for your interest in contributing to BlockView! This document provides guidelines and information for contributors.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Architecture Guidelines](#architecture-guidelines)
- [Testing](#testing)

---

## Development Setup

### Prerequisites

- Node.js 20+
- MongoDB 6.0+
- yarn (recommended)

### Quick Setup

```bash
# Clone repository
git clone https://github.com/your-org/blockview.git
cd blockview

# Backend setup
cd backend
yarn install
cp .env.example .env
# Edit .env with your values

# Frontend setup
cd ../frontend
yarn install
cp .env.example .env
# Edit .env with your values

# Start development
# Terminal 1: Backend
cd backend && yarn dev

# Terminal 2: Frontend
cd frontend && yarn start
```

---

## Code Style

### TypeScript (Backend)

```typescript
// ✅ Good: Type imports separate
import type { IAlertRule, AlertScope } from './alert_rules.model.js';
import { AlertRuleModel } from './alert_rules.model.js';

// ✅ Good: Zod for runtime validation
const CreateAlertBody = z.object({
  scope: z.enum(['token', 'wallet', 'actor']),
  targetId: z.string().min(1),
});

// ✅ Good: Async/await with proper error handling
export async function createAlert(data: CreateAlertInput): Promise<IAlertRule> {
  try {
    const rule = new AlertRuleModel(data);
    return await rule.save();
  } catch (error) {
    logger.error('Failed to create alert:', error);
    throw new AppError('ALERT_CREATE_FAILED', 'Failed to create alert');
  }
}
```

### React (Frontend)

```jsx
// ✅ Good: Functional components with hooks
export default function AlertCard({ rule, onPause, onDelete }) {
  const [loading, setLoading] = useState(false);
  
  const handlePause = useCallback(async () => {
    setLoading(true);
    try {
      await onPause(rule._id);
    } finally {
      setLoading(false);
    }
  }, [rule._id, onPause]);
  
  return (
    <Card data-testid={`alert-card-${rule._id}`}>
      {/* ... */}
    </Card>
  );
}

// ✅ Good: data-testid on interactive elements
<Button data-testid="create-alert-btn" onClick={handleCreate}>
  Create Alert
</Button>
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (Backend) | snake_case | `alert_rules.model.ts` |
| Files (Frontend) | PascalCase | `AlertsPage.jsx` |
| Components | PascalCase | `CreateAlertModal` |
| Functions | camelCase | `createAlertRule` |
| Constants | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `IAlertRule` |

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
feat(alerts): add pause/resume functionality

# Bug fix
fix(alerts): correct boolean parsing in query params

# Documentation
docs: update README with new API endpoints
```

---

## Pull Request Process

### Before Submitting

1. **Create feature branch**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Run linting**
   ```bash
   # Backend
   cd backend && yarn lint
   
   # Frontend
   cd frontend && yarn lint
   ```

3. **Run tests**
   ```bash
   # Backend
   cd backend && yarn test
   
   # Frontend
   cd frontend && yarn test
   ```

4. **Update documentation** if needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing done

## Screenshots (if UI changes)
Before: [image]
After: [image]

## Checklist
- [ ] Code follows project style
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] No console.log in production code
```

---

## Architecture Guidelines

### Adding New Features

1. **Backend Module Structure**
   ```
   /core/my_feature/
   ├── my_feature.model.ts      # Mongoose schema
   ├── my_feature.repository.ts # Data access (optional)
   ├── my_feature.service.ts    # Business logic
   ├── my_feature.routes.ts     # API endpoints
   ├── my_feature.schema.ts     # Zod validation
   └── index.ts                 # Exports
   ```

2. **Frontend Page Structure**
   ```
   /pages/MyFeaturePage.jsx     # Page component
   /components/MyFeatureCard.jsx # Reusable component
   /api/my_feature.api.js       # API client
   ```

### Key Principles

1. **Alert-Watchlist Coupling**
   - AlertRule MUST have watchlistItemId
   - Creating alert auto-creates watchlist item

2. **Honest UI States**
   - Show "Real" only for verified data
   - Show "Indexing" for processing data
   - Show "Disabled" for unavailable features

3. **Test IDs**
   - Every interactive element needs `data-testid`
   - Format: `{component}-{action}-{context}`

---

## Testing

### Backend Testing

```typescript
// Unit test example
describe('AlertService', () => {
  it('should create alert with watchlist item', async () => {
    const result = await createAlertRule('user-1', {
      scope: 'token',
      targetId: '0x...',
      triggerTypes: ['accumulation'],
    });
    
    expect(result.watchlistItemId).toBeDefined();
    expect(result.status).toBe('active');
  });
});
```

### Frontend Testing

```jsx
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import AlertCard from './AlertCard';

test('pause button triggers callback', async () => {
  const onPause = jest.fn();
  render(<AlertCard rule={mockRule} onPause={onPause} />);
  
  fireEvent.click(screen.getByTestId('pause-alert-btn'));
  
  expect(onPause).toHaveBeenCalledWith(mockRule._id);
});
```

### E2E Testing

We use Playwright for end-to-end tests:

```javascript
test('create alert flow', async ({ page }) => {
  await page.goto('/tokens/0xdac17f958d2ee523a2206206994597c13d831ec7');
  await page.click('[data-testid="create-alert-btn"]');
  await page.click('[data-testid="submit-alert-btn"]');
  
  await expect(page).toHaveURL('/alerts');
  await expect(page.locator('[data-testid="alert-card"]')).toBeVisible();
});
```

---

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Tag maintainers for urgent issues

Thank you for contributing! 🎉
