import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, setWorldConstructor, ITestCaseHookParameter } from '@cucumber/cucumber';
import { ApiWorld } from './world';
import { logger } from '../utils/logger';

// Set the World constructor for Cucumber
setWorldConstructor(ApiWorld);

// Set timeout for each step to 10 seconds
setDefaultTimeout(10 * 1000);

/**
 * Before All Hook - Runs once before all scenarios
 */
BeforeAll(async () => {
  logger.info('=== Test Suite Started ===');
});

/**
 * Before Hook - Runs before each scenario
 */
Before(async function (this: ApiWorld, scenario: ITestCaseHookParameter) {
  logger.info(`\n>>> Starting Scenario: ${scenario.pickle.name}`);
  this.scenarioName = scenario.pickle.name;

  // Clear test data from previous scenarios
  if (typeof this.clearTestData === 'function') {
    this.clearTestData();
  }

  logger.info('Scenario initialized');
});

/**
 * After Hook - Runs after each scenario (regardless of pass/fail)
 */
After(async function (this: ApiWorld, scenario: ITestCaseHookParameter) {
  try {
    logger.info(`<<< Scenario: ${scenario.pickle.name} Completed`);

    // Log scenario result
    if (scenario.result?.message) {
      logger.error(`Failure: ${scenario.result.message}`);
    }

    // Cleanup: Reset auth tokens and clear test data
    if (typeof this.cleanup === 'function') {
      await this.cleanup();
    }

    if (typeof this.getScenarioInfo === 'function') {
      logger.info(`Scenario Summary:\n${this.getScenarioInfo()}`);
    }
  } catch (error) {
    logger.error(`Error during cleanup: ${error}`);
  }
});

/**
 * After All Hook - Runs once after all scenarios
 */
AfterAll(async () => {
  logger.info('=== Test Suite Completed ===');
});

/**
 * Hook for handling test failures
 */
After({ tags: '@critical' }, async function (this: ApiWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === 'FAILED') {
    logger.error(`CRITICAL TEST FAILED: ${scenario.pickle.name}`);
    logger.error(`Last Error: ${JSON.stringify(this.lastError, null, 2)}`);
  }
});

/**
 * Hook for API-specific scenarios
 */
Before({ tags: '@api' }, async function (this: ApiWorld) {
  logger.info('API test scenario initiated');
});

/**
 * Hook for authentication-specific scenarios
 */
Before({ tags: '@auth' }, async function (this: ApiWorld) {
  logger.info('Auth test scenario initiated');
  // Additional auth setup if needed
});
