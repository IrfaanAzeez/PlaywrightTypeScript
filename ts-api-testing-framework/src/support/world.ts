import { World, IWorldOptions } from '@cucumber/cucumber';
import { APIClient } from '../api/clients/APIClient';
import { AuthHandler } from '../auth/AuthHandler';
import { RequestService } from '../api/services/RequestService';
import { BaseResponse } from '../api/responses/BaseResponse';
import { loadConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { SraRequestService } from '../api/requests/SraRequestService';

/**
 * Cucumber World
 * Shared context across all step definitions
 * Contains API clients, auth handlers, and response storage
 */
export class ApiWorld extends World {
  // Configuration
  public config: any;
  public environment: string;

  // API Clients & Services
  public apiClient!: APIClient;
  public authHandler!: AuthHandler;
  public requestService!: RequestService;
  public sraRequestService!: SraRequestService;

  // Response Storage
  public lastError: any = null;

  // Test Context
  public scenarioName: string = '';
  public testData: Map<string, any> = new Map();
  public authenticatedUser: { username: string; password: string } | null = null;

  constructor(options: IWorldOptions) {
    super(options);
    this.environment = process.env.ENVIRONMENT || 'dev';
    this.config = loadConfig(this.environment);
    this.initializeClients();
  }

  /**
   * Initialize API clients and services
   */
  private initializeClients(): void {
    // For SRA API testing, use baseURL as the API base
    const apiURL = this.config.baseURL || this.config.apiURL || 'https://localhost:3000';
    const allowInsecure = (process.env.SRA_ALLOW_INSECURE === 'true');
    
    this.apiClient = new APIClient(apiURL, this.config.timeout || 5000, allowInsecure);

    // Initialize Auth Handler if credentials are provided
    if (this.config.authURL && this.config.clientId && this.config.clientSecret) {
      this.authHandler = new AuthHandler(
        this.config.authURL,
        this.config.clientId,
        this.config.clientSecret
      );
      this.requestService = new RequestService(this.apiClient, this.authHandler);
    } else {
      // For SRA auth, we don't need OAuth credentials
      logger.debug('Auth credentials not configured - SRA-only mode');
    }

    // Initialize SRA Service (always initialize as it's the main service)
    this.sraRequestService = new SraRequestService(this.apiClient, this.authHandler);    

    logger.info(`Initialized API clients for environment: ${this.environment}`);
  }

  /**
   * Set up authentication
   */
  public async setupAuth(username?: string, password?: string): Promise<void> {
    // For SRA testing, credentials are optional
    if (this.authHandler && this.config.credentials) {
      const u = username || this.config.credentials.username;
      const p = password || this.config.credentials.password;

      this.authHandler.setCredentials(u, p);
      this.authenticatedUser = { username: u, password: p };

      // Fetch initial token
      await this.authHandler.getBearerToken();
      logger.info(`Authentication setup for user: ${u}`);
    } else {
      logger.info('OAuth credentials not required for SRA API');
    }
  }

  /**
   * Store API response
   */
  /**
   * Store test data
   */
  public storeTestData(key: string, value: any): void {
    this.testData.set(key, value);
    logger.debug(`Test data stored: ${key}`);
  }

  /**
   * Get test data
   */
  public getTestData(key: string): any {
    return this.testData.get(key);
  }

  /**
   * Clear test data
   */
  public clearTestData(): void {
    this.testData.clear();
    this.lastError = null;
    logger.debug('Test data cleared');
  }

  /**
   * Handle error
   */
  public handleError(error: any): void {
    this.lastError = error;
    logger.error(`Error occurred: ${JSON.stringify(error)}`);
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    if (this.authHandler) {
      await this.authHandler.clearAuth();
    }
    this.clearTestData();
    this.authenticatedUser = null;
    logger.info('World cleaned up');
  }

  /**
   * Get scenario info
   */
  public getScenarioInfo(): string {
    return `Scenario: ${this.scenarioName} | Environment: ${this.environment}`;
  }
}
