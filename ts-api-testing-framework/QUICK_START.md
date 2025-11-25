# Quick Start Guide

Get up and running with the BDD API Testing Framework in 5 minutes.

## 1. Installation

```bash
# Install dependencies
npm install
```

## 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your API details:
```
API_URL=http://your-api.com/api/v1
AUTH_URL=http://your-api.com/auth
TEST_USERNAME=your_username
TEST_PASSWORD=your_password
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
```

## 3. Run Tests

### Basic test run
```bash
npm test
```

### Run and view report
```bash
npm run test:report
```

### View last report
```bash
npm run report:open
```

## 4. Write Your First Test

Create a feature file at `features/api/my_test.feature`:

```gherkin
Feature: My First API Test

  Background:
    Given I have valid user credentials

  Scenario: Get all users
    When I send a GET request to get all users
    Then the response status code should be 200
    And the response should be successful
```

## 5. Run Your Test

```bash
npm test
```

View the HTML report:
```bash
npm run report:open
```

## Available Step Definitions

### Given (Setup)
- `I have valid user credentials`
- `I am authenticated as "username"`
- `I have a new user payload with:` (DataTable)
- `I have user ID "123"`

### When (Action)
- `I send a GET request to get all users`
- `I send a GET request to retrieve user by ID`
- `I send a POST request to create a new user`
- `I send a PUT request to update the user`
- `I send a DELETE request to delete the user`

### Then (Assertion)
- `the response status code should be 200`
- `the response should be successful`
- `the response should contain a user`
- `the user email should be "test@example.com"`
- `the user email format should be valid`

## Common Tasks

### Run specific tag
```bash
npm test -- --tags "@smoke"
```

### Debug with detailed logs
```bash
LOG_LEVEL=DEBUG npm test
```

### Switch environment
```bash
ENVIRONMENT=staging npm test
```

### Build TypeScript
```bash
npm run build
```

### Run linter
```bash
npm run lint
```

## Troubleshooting

**Dependencies not installing?**
```bash
npm install --legacy-peer-deps
```

**Can't find module errors?**
```bash
npm install
npm run build
```

**Tests not running?**
- Check `.env` file exists and has correct values
- Verify API is accessible: `curl $API_URL/health`
- Check logs: `LOG_LEVEL=DEBUG npm test`

**Report not opening?**
```bash
npm run report:open
```

## Project Structure

```
src/
├── api/                    # API layer
│   ├── clients/           # HTTP client
│   ├── requests/          # Business logic
│   ├── responses/         # Response models
│   └── services/          # Service layer
├── auth/                  # Authentication
├── steps/                 # Test steps
├── support/               # Cucumber setup
└── utils/                 # Utilities

features/
└── api/                   # Feature files

config/
└── environment.json       # Environment config
```

## Next Steps

1. **Explore Examples**: Check `features/api/users.feature` for complete examples
2. **Add Custom Steps**: Add new step definitions in `src/steps/userSteps.ts`
3. **Create Services**: Add API services in `src/api/requests/`
4. **Configure Environments**: Update `config/environment.json` for your needs
5. **View Reports**: Run tests and check `playwright-report/index.html`

## Key Files to Know

- **Feature Files**: `features/api/*.feature` - Write your tests here
- **Step Definitions**: `src/steps/userSteps.ts` - Where steps are implemented
- **Configuration**: `config/environment.json` - Environment settings
- **Utilities**: `src/utils/config.ts` - Config management
- **World**: `src/support/world.ts` - Shared test context

## Useful Commands

```bash
npm test                 # Run all tests
npm run test:report     # Run tests + open report
npm run report:open     # View last report
npm run build           # Build TypeScript
npm run lint            # Run linter
npm run clean           # Clean generated files
```

## Documentation

For detailed documentation, see:
- `README.md` - Complete framework documentation
- Feature file examples in `features/api/`
- Step definitions in `src/steps/userSteps.ts`

## Support

Need help?
1. Check `README.md` for detailed documentation
2. Review example scenarios in `features/api/users.feature`
3. Enable debug logging: `LOG_LEVEL=DEBUG npm test`
4. Check API connectivity

Happy testing! 🚀
