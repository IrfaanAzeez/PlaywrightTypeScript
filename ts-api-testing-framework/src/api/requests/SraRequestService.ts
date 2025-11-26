import { APIClient } from '../clients/APIClient';
import { AuthHandler } from '../../auth/AuthHandler';
import { loadConfig } from '../../utils/config';
import { logger } from '../../utils/logger';

export class SraRequestService {
  private apiClient: APIClient;
  private authHandler: AuthHandler;
  private baseURL: string;
  private authURL: string;
  private email: string;
  private sraToken: string | null = null;

  // Endpoint path for education detail
  protected endpointPath: string = '/clients/3115/orders/8345413/education/detail';

  constructor(apiClient: APIClient, authHandler: AuthHandler) {
    this.apiClient = apiClient;
    this.authHandler = authHandler;
    
    const config = loadConfig('dev');
    this.baseURL = config.baseURL || '';
    this.authURL = config.authURL || '';
    this.email = config.email || '';

    logger.info(`SraRequestService initialized`);
    logger.info(`  - Base URL: ${this.baseURL}`);
    logger.info(`  - Auth URL: ${this.authURL}`);
    logger.info(`  - Endpoint Path: ${this.endpointPath}`);
  }

  /**
   * Set a custom endpoint path for this service
   * Allows reusing the service for different endpoints
   * @param endpointPath - The API endpoint path (e.g., '/api/users', '/api/products')
   */
  public setEndpointPath(endpointPath: string): void {
    this.endpointPath = endpointPath;
    logger.info(`Endpoint path updated to: ${endpointPath}`);
  }

  /**
   * Get current endpoint path
   */
  public getEndpointPath(): string {
    return this.endpointPath;
  }

  /**
   * Authenticate with SRA API using email
   * Sends POST request to authURL with email and receives JWT token
   * @param email - Email for authentication (optional, uses config email if not provided)
   * @returns Promise<string> - JWT token
   */
  public async authenticateSra(email?: string): Promise<string> {
    // Use client credentials for token
    const config = loadConfig('dev');
    const authURL = config.authURL;
    const clientId = config.clientId;
    const clientSecret = config.clientSecret;
    const resourceUrl = config.resourceUrl;

    if (!authURL || !clientId || !clientSecret || !resourceUrl) {
      throw new Error('Missing auth config for client credentials');
    }

    logger.info('Authenticating with client credentials');
    const response = await this.apiClient.post(
      authURL,
      `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent(resourceUrl)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (response.status === 200 || response.status === 201) {
      const token = response.data.access_token;
      this.sraToken = token;
      logger.info('Client credentials authentication successful - Token received');
      return token;
    }
    throw new Error(`Authentication failed with status ${response.status}`);
  }

  /**
   * Make authenticated GET request to SRA endpoint
   * Constructs full URL using baseURL + current endpointPath
   * Passes Bearer token in Authorization header
   * @param token - JWT token (optional, uses cached token if not provided)
   * @returns Promise<any> - API response
   */
  public async getSraSprCopyParam(token?: string): Promise<any> {
    const authToken = token || this.sraToken;
    if (!authToken) {
      throw new Error('Token not available. Please authenticate first.');
    }
    const fullUrl = `${this.baseURL}${this.endpointPath}`;
    logger.info(`Making GET request to: ${fullUrl}`);
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'api-version': '1'
    };
    try {
      const response = await this.apiClient.get(fullUrl, { headers });
      logger.info(`API request successful. Status: ${response.status}`);
      return response;
    } catch (error: any) {
      logger.error(`API request failed: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Complete flow: Authenticate and fetch data
   * @param email - Email for authentication (optional)
   * @returns Promise<any> - API response data
   */
  public async fetchSraData(email?: string): Promise<any> {
    const token = await this.authenticateSra(email);
    const response = await this.getSraSprCopyParam(token);
    return response;
  }

  /**
   * Get cached SRA token
   */
  public getSraToken(): string | null {
    return this.sraToken;
  }

  /**
   * Set SRA token manually
   */
  public setSraToken(token: string): void {
    this.sraToken = token;
  }

  /**
   * Clear cached token
   */
  public clearSraToken(): void {
    this.sraToken = null;
  }
}