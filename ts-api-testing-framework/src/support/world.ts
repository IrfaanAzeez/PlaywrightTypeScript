import { World, IWorldOptions } from '@cucumber/cucumber';
import { APIClient } from '../api/clients/APIClient';
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
  //public authHandler!: AuthHandler;
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
    const apiURL = this.config.baseURL || this.config.apiURL || '';
    const allowInsecure = (process.env.SRA_ALLOW_INSECURE === 'true');
    
    this.apiClient = new APIClient(apiURL, this.config.timeout || 5000, allowInsecure);

    this.sraRequestService = new SraRequestService(this.apiClient);    

    logger.info(`Initialized API clients for environment: ${this.environment}`);
  }


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
   * Get scenario info
   */
  public getScenarioInfo(): string {
    return `Scenario: ${this.scenarioName} | Environment: ${this.environment}`;
  }
}
