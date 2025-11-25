import { Given, When, Then } from '@cucumber/cucumber';
import { ApiWorld } from '../support/world';
import { SraResponse } from '../api/responses/SraResponse';
import { logger } from '../utils/logger';
import * as assert from 'assert';

Given('I have the SRA email {string}', async function (this: ApiWorld, email: string) {
  this.storeTestData('sraEmail', email);
  logger.info(`SRA Email set: ${email}`);
});

// ==================== WHEN Steps ====================

When('I send an authentication request to SRA API', async function (this: ApiWorld) {
  try {
    const sraEmail = this.getTestData('sraEmail');
    assert.ok(sraEmail, 'SRA email should be set');

    // Use the SRA service already initialized in world.ts
    const response = await this.sraRequestService.authenticateSra(sraEmail);

    // Store token and response
    this.storeTestData('sraToken', response);
    this.storeTestData('sraAuthResponse', {
      status: 200,
      data: { token: response }
    });

    logger.info(`SRA Authentication successful. Token received.`);
  } catch (error) {
    this.handleError(error);
    throw error;
  }
});

When('I authenticate with SRA API', async function (this: ApiWorld) {
  try {
    const sraEmail = this.getTestData('sraEmail');
    assert.ok(sraEmail, 'SRA email should be set');

    // Use the SRA service already initialized in world.ts
    const token = await this.sraRequestService.authenticateSra(sraEmail);

    this.storeTestData('sraToken', token);
    logger.info(`SRA Authenticated successfully`);
  } catch (error) {
    this.handleError(error);
    throw error;
  }
});

When('I send a GET request to fetch SRA Copy Parameters', async function (this: ApiWorld) {
  try {
    const sraToken = this.getTestData('sraToken');
    assert.ok(sraToken, 'SRA Token should be available');

    // Use the SRA service already initialized in world.ts
    const response = await this.sraRequestService.getSraSprCopyParam(sraToken);
    const sraResponse = new SraResponse(response);

    this.storeTestData('sraResponse', sraResponse);
    logger.info(`SRA Copy Parameters fetched. Status: ${response.status}`);
  } catch (error) {
    this.handleError(error);
    throw error;
  }
});

Then('the SRA response status code should be {int}', async function (this: ApiWorld, statusCode: number) {
  const sraResponse = this.getTestData('sraResponse') as SraResponse;
  assert.ok(sraResponse, 'SRA response should exist');

  assert.strictEqual(
    sraResponse.status,
    statusCode,
    `Expected status ${statusCode}, but got ${sraResponse.status}`
  );
  logger.info(`✓ SRA response status is ${statusCode}`);
});

Then('the SRA response should contain data', async function (this: ApiWorld) {
  const sraResponse = this.getTestData('sraResponse') as SraResponse;
  assert.ok(sraResponse, 'SRA response should exist');
  assert.ok(sraResponse.hasData(), 'SRA response should contain data');
  logger.info(`✓ SRA response contains data`);
});

Then('the SRA data should be valid', async function (this: ApiWorld) {
  const sraResponse = this.getTestData('sraResponse') as SraResponse;
  assert.ok(sraResponse.isSuccess(), 'SRA response should be successful');
  logger.info(`✓ SRA data is valid`);
});