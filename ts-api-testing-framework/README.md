# TypeScript BDD API Testing Framework

A comprehensive BDD-driven API testing framework using Cucumber, Playwright, and TypeScript. This framework provides a complete solution for API test automation with built-in authentication, response validation, and HTML reporting.

## Features

- **BDD Framework**: Write tests in Gherkin syntax using Cucumber
- **TypeScript Support**: Full TypeScript support with strict type checking
- **API Client**: Reusable HTTP client with GET, POST, PUT, DELETE, and PATCH support
- **Authentication Management**: Built-in token management with caching and auto-refresh
- **Response Validation**: Strong response typing and validation utilities
- **HTML Reports**: Playwright HTML reporter with artifacts (screenshots, videos, traces)
- **Environment Configuration**: Multi-environment support (dev, staging, prod)
- **Comprehensive Logging**: Built-in logging utility for debugging

## Project Structure

```
ts-api-testing-framework/
├── src/
│   ├── api/
│   │   ├── clients/
│   │   │   └── APIClient.ts           # HTTP client for all API calls
│   │   ├── requests/
│   │   │   └── UserRequestService.ts  # Business logic for user endpoints
│   │   ├── responses/
│   │   │   ├── BaseResponse.ts        # Generic response wrapper
│   │   │   └── UserResponse.ts        # User-specific response handling
│   │   └── services/
│   │       └── RequestService.ts      # Unified request handler with auth
│   │
│   ├── auth/
│   │   ├── AuthHandler.ts             # Credentials & token management
│   │   └── TokenManager.ts            # Bearer token lifecycle management
│   │
│   ├── steps/
│   │   └── userSteps.ts               # Cucumber step definitions (Given/When/Then)
│   │
│   ├── support/
│   │   ├── hooks.ts                   # Before/After hooks
│   │   └── world.ts                   # Cucumber World - shared context
│   │
│   └── utils/
│       ├── config.ts                  # Configuration loader
│       └── logger.ts                  # Logging utility
│
├── features/
│   └── api/
│       └── users.feature              # Gherkin scenarios
│
├── config/
│   └── environment.json               # Environment configurations
│
├── playwright-report/                 # Generated HTML reports
├── cucumber.js                        # Cucumber configuration
├── playwright.config.ts               # Playwright configuration
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Dependencies & scripts
└── README.md                          # This file
```

## Installation

### Prerequisites
- Node.js 16+ and npm

### Setup

1. **Clone/Create project and navigate to directory**:
   ```bash
   cd ts-api-testing-framework
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build TypeScript** (optional):
   ```bash
   npm run build
   ```

## Configuration

### Environment Configuration

Edit `config/environment.json` to configure your environments:

```json
{
  "dev": {
    "baseURL": "http://localhost:3000",
    "apiURL": "http://localhost:3000/api/v1",
    "authURL": "http://localhost:3000/auth",
    "clientId": "dev_client_id",
    "clientSecret": "dev_client_secret",
    "credentials": {
      "username": "testuser@example.com",
      "password": "Test@123456"
    },
    "timeout": 5000,
    "retries": 3
  }
}
```

### Environment Variables

Override config values using environment variables:

```bash
# API Configuration
export BASE_URL=http://localhost:3000
export API_URL=http://localhost:3000/api/v1
export AUTH_URL=http://localhost:3000/auth
export CLIENT_ID=your_client_id
export CLIENT_SECRET=your_client_secret

# Test Credentials
export TEST_USERNAME=testuser@example.com
export TEST_PASSWORD=Test@123456

# Framework Settings
export ENVIRONMENT=dev
export LOG_LEVEL=INFO
```

## Usage

### Run All Tests

```bash
npm test
```

### Run Tests and Open Report

```bash
npm run test:report
```

### Open Last Generated Report

```bash
npm run report:open
```

### Run Tests with Logging

```bash
LOG_LEVEL=DEBUG npm test
```

### Run Tests Against Staging

```bash
ENVIRONMENT=staging npm test
```

## Project Architecture

### API Client Layer (`APIClient.ts`)

The base HTTP client supporting all standard HTTP methods:

```typescript
import { APIClient } from './src/api/clients/APIClient';

const client = new APIClient('http://api.example.com', 5000);
const response = await client.get('/users', {
  headers: { 'Authorization': 'Bearer token' }
});
```

**Supported Methods**:
- `get(url, config?)`
- `post(url, data?, config?)`
- `put(url, data?, config?)`
- `delete(url, config?)`
- `patch(url, data?, config?)`

**Response Format**:
```typescript
{
  status: number;
  data: any;
  headers: Record<string, any>;
}
```

### Authentication Layer

#### TokenManager (`TokenManager.ts`)

Manages bearer token lifecycle:
- Fetches tokens from auth endpoint
- Caches tokens in memory
- Checks token expiry
- Auto-refreshes expired tokens

```typescript
const tokenManager = new TokenManager(
  'http://api.example.com/auth',
  'client_id',
  'client_secret'
);

const token = await tokenManager.getToken('user@example.com', 'password');
```

#### AuthHandler (`AuthHandler.ts`)

Wraps TokenManager and manages credentials:
- Stores and retrieves credentials
- Manages bearer tokens
- Builds auth headers
- Integrates with all API requests

```typescript
const authHandler = new AuthHandler(
  'http://api.example.com/auth',
  'client_id',
  'client_secret'
);

authHandler.setCredentials('user@example.com', 'password');
const headers = await authHandler.buildRequestHeaders();
```

### Request/Response Layer

#### UserRequestService (`UserRequestService.ts`)

Business logic layer for user API endpoints:

```typescript
const service = new UserRequestService(apiClient, authHandler);

// CRUD Operations
await service.getAllUsers();
await service.getUserDetails(userId);
await service.createUser({ firstName: 'John', email: 'john@example.com' });
await service.updateUser(userId, { firstName: 'Jane' });
await service.deleteUser(userId);
```

#### Response Classes

**BaseResponse**: Generic response wrapper with validation

```typescript
const response = new BaseResponse(apiResponse);
response.isSuccess();           // Check if 2xx status
response.status;                // HTTP status code
response.getBody();             // Response body
response.getField('fieldName'); // Access nested fields
response.validate(200, { id: 1 }); // Validate response
```

**UserResponse**: User-specific response handling

```typescript
const response = new UserResponse(apiResponse);
response.getUser();             // Get single user
response.getUsers();            // Get list of users
response.getUserEmail();        // Get user email
response.validateEmailFormat(); // Validate email
response.validateUserData({ email: 'test@example.com' });
```

### Cucumber Integration

#### World (`world.ts`)

Shared context across all step definitions:

```typescript
// Automatically available in all steps:
this.apiClient;           // HTTP client instance
this.authHandler;         // Auth handler
this.userRequestService;  // User service
this.lastResponse;        // Last API response
this.config;              // Environment config
this.testData;            // Test data storage
```

#### Hooks (`hooks.ts`)

- **Before**: Sets up authentication and clears test data
- **After**: Cleans up auth tokens and test context
- **Critical Tags**: Extra logging for critical tests

#### Step Definitions (`userSteps.ts`)

Complete Given/When/Then step implementations:

```gherkin
Given I have valid user credentials
And I am authenticated as "testuser@example.com"
And I have a new user payload with:
  | firstName | John             |
  | email     | john@example.com |

When I send a POST request to create a new user
Then the response status code should be 201
And the response should contain a user
And the user email should be "john@example.com"
```

## Writing Tests

### Create Feature File

Create `features/api/users.feature`:

```gherkin
Feature: User API Management
  Background:
    Given I have valid user credentials

  Scenario: Create and verify new user
    Given I have a new user payload with:
      | firstName | John         |
      | lastName  | Doe          |
      | email     | john@test.com |
    When I send a POST request to create a new user
    Then the response status code should be 201
    And the user email should be "john@test.com"
```

### Available Step Definitions

#### Given Steps
- `I have valid user credentials`
- `I am authenticated as {string}`
- `I have a user with email {string}`
- `I have a new user payload with:` (DataTable)
- `I have user ID {string}`

#### When Steps
- `I send a GET request to get all users`
- `I send a GET request to retrieve user by ID`
- `I send a POST request to create a new user`
- `I send a PUT request to update the user`
- `I send a DELETE request to delete the user`
- `I search for user by email {string}`
- `I update user data with:` (DataTable)

#### Then Steps
- `the response status code should be {int}`
- `the response should be successful`
- `the response should contain a user`
- `the response should contain {int} users`
- `the user email should be {string}`
- `the user should have a valid ID`
- `the user email format should be valid`
- `the user data should contain:` (DataTable)
- `the response should have error message containing {string}`
- `the created user ID should be stored`
- `no error should be thrown`

### Custom Step Definitions

Add new steps to `src/steps/userSteps.ts`:

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../support/world';

When('I perform some action', async function (this: ApiWorld) {
  // Your test logic
  this.storeResponse(response);
});

Then('the result should be {string}', async function (this: ApiWorld, expected: string) {
  assert.strictEqual(this.lastResponse.getField('result'), expected);
});
```

## Reports

### HTML Report

After running tests, Playwright generates an HTML report:

```bash
npm run test:report
```

This opens the HTML dashboard showing:
- Test summary (total, passed, failed)
- Pass/fail breakdown by tag
- Detailed failure information
- Attached artifacts (screenshots, videos, traces)
- Test duration and timing

### Artifact Storage

Artifacts are automatically captured on failures:
- **Screenshots**: Visual evidence of failures
- **Videos**: Full test execution recording
- **Traces**: Playwright trace for debugging

Located in: `playwright-report/`

## Logging

### Configure Log Level

```bash
# Debug (most verbose)
LOG_LEVEL=DEBUG npm test

# Info (default)
LOG_LEVEL=INFO npm test

# Warning (less verbose)
LOG_LEVEL=WARN npm test

# Error (only errors)
LOG_LEVEL=ERROR npm test
```

### Use Logger in Custom Code

```typescript
import { logger } from '../utils/logger';

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

## Test Tagging

Use tags to organize and filter tests:

```gherkin
@api @smoke
Scenario: Quick sanity check

@api @regression
Scenario: Comprehensive test

@critical
Scenario: Important functionality

@negative
Scenario: Error handling

@edge
Scenario: Edge case
```

Run specific tags:

```bash
# Run only smoke tests
npm test -- --tags "@smoke"

# Run critical tests
npm test -- --tags "@critical"

# Run regression excluding negative tests
npm test -- --tags "@regression and not @negative"
```

## Troubleshooting

### Issue: "Cannot find module '@cucumber/cucumber'"
- Run: `npm install`

### Issue: TypeScript compilation errors
- Run: `npm run build`
- Check `tsconfig.json` settings

### Issue: Authentication fails
- Verify credentials in `config/environment.json`
- Check auth endpoint is accessible
- Review logs: `LOG_LEVEL=DEBUG npm test`

### Issue: Report not generating
- Ensure `playwright-report/` directory exists
- Check Playwright config in `playwright.config.ts`
- Run: `npm run report:open`

## Best Practices

1. **Organize Tests by Feature**: Group related scenarios in feature files
2. **Use DataTables**: Make tests more readable with structured data
3. **Implement Reusable Steps**: Create generic steps for common operations
4. **Tag Tests Properly**: Use tags for filtering and organization
5. **Store Test Data**: Use `world.testData` for sharing data between steps
6. **Handle Errors Gracefully**: Use try-catch and proper error messages
7. **Log Extensively**: Enable DEBUG logging for complex scenarios
8. **Validate Early**: Check responses immediately after API calls
9. **Clean Up**: Always clean up in After hooks
10. **Use Meaningful Names**: Make scenario names describe what is being tested

## Advanced Usage

### Custom API Services

Create `src/api/requests/ProductRequestService.ts`:

```typescript
import { APIClient } from '../clients/APIClient';
import { AuthHandler } from '../../auth/AuthHandler';

export class ProductRequestService {
  constructor(apiClient: APIClient, authHandler: AuthHandler) {
    this.apiClient = apiClient;
    this.authHandler = authHandler;
  }

  public async getProducts() {
    const headers = await this.authHandler.buildRequestHeaders();
    return this.apiClient.get('/products', { headers });
  }
}
```

### Environment-Specific Setup

Load config in steps:

```typescript
Given('I use {string} environment', async function (this: ApiWorld, env: string) {
  this.config = loadConfig(env);
  this.initializeClients();
});
```

### Request/Response Logging

Enable detailed logging:

```bash
LOG_LEVEL=DEBUG npm test
```

## Contributing

1. Follow TypeScript best practices
2. Add JSDoc comments to new methods
3. Write tests for new features
4. Update documentation

## License

MIT

## Support

For issues and feature requests, check the framework documentation or contact the QA team.
