import { Given, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../support/world';
import { logger } from '../utils/logger';
import * as assert from 'assert';
import { loadConfig } from './../utils/config';

Given('Generate JWT token', async function (this: ApiWorld) {
  const token = await this.sraRequestService.authenticateSra();
  this.storeTestData('jwtToken', token);
  logger.info(`JWT token generated.`);
});

Then('Use the token to get the Education details using education end point', async function (this: ApiWorld) {
  const jwtToken = this.getTestData('jwtToken');
  assert.ok(jwtToken, 'JWT token should be available');

  const config = loadConfig(this.environment);
  const endpoint = config.educationEndpoint;
  logger.info(`  - Endpoint Path: ${endpoint}`);
  const response = await this.sraRequestService.getSraSprCopyParam(jwtToken, endpoint);
  this.storeTestData('educationResponse', response);

  logger.info(`Education details fetched. Status: ${response.status}`);
});

Then('Verify the status code should be 200', async function (this: ApiWorld) {
  const response = this.getTestData('educationResponse');
  assert.ok(response, 'Education response should exist');
  assert.strictEqual(response.status, 200, `Expected status 200, but got ${response.status}`);
  logger.info(`✓ Education response status is 200`);
});

Then('Print the response payload we are getting in Json file', async function (this: ApiWorld) {
  const response = this.getTestData('educationResponse');
  const jsonString = JSON.stringify(response.data, null, 2);
  logger.info('Full Education response payload:');
  logger.info(jsonString);
});

Then('Verify the Order id should be equal to 8345413', async function (this: ApiWorld) {
  const response = this.getTestData('educationResponse');
  assert.ok(response && response.data, 'Education response data should exist');
  const orderId = response.data.orderNumber;
  assert.strictEqual(orderId, 8345413, `Expected order id 8345413, but got ${orderId}`);
  logger.info('✓ Order id is 8345413');
});
