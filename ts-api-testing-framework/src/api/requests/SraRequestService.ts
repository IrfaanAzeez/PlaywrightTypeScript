import { APIClient } from '../clients/APIClient';
import { AuthHandler } from '../../auth/AuthHandler';
import { loadConfig } from '../../utils/config';
import { logger } from '../../utils/logger';

/**
 * SRA Request Service
 * Handles authentication and API calls to SRA endpoints
 * 
 * Architecture:
 * 1. Use authURL + email from config to generate JWT token
 * 2. Use baseURL + endpointPath to make authenticated requests with Bearer token
 * 3. Reusable for different endpoints by overriding endpointPath
 */
export class SraRequestService {
  private apiClient: APIClient;
  private authHandler: AuthHandler;
  private baseURL: string;
  private authURL: string;
  private email: string;
  private sraToken: string | null = null;

  // Endpoint path - can be overridden in subclasses or passed as parameter
  // For SRA Copy Parameters
  protected endpointPath: string = '/api/srasprcopyparam/getSraSprCopyParam';

  constructor(apiClient: APIClient, authHandler: AuthHandler) {
    this.apiClient = apiClient;
    this.authHandler = authHandler;
    
    const config = loadConfig('dev');
    this.baseURL = config.baseURL || 'https://localhost:3000';
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
    try {
      const sraEmail = email || this.email;

      if (!sraEmail) {
        throw new Error('Email not provided and not configured in environment');
      }

      if (!this.authURL) {
        throw new Error('Auth URL not configured');
      }

      logger.info(`Authenticating with SRA API for email: ${sraEmail}`);

      const response = await this.apiClient.post(
        this.authURL,
        { email: sraEmail },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200 || response.status === 201) {
        // Handle different response formats
        const token = response.data.token || response.data.access_token || response.data;
        this.sraToken = token;
        logger.info('SRA Authentication successful - JWT Token received');
        return token;
      }

      throw new Error(`Authentication failed with status ${response.status}`);
    } catch (error: any) {
      logger.error(`SRA Authentication error: ${JSON.stringify(error)}`);
      throw error;
    }
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
      throw new Error('SRA token not available. Please authenticate first.');
    }

    if (!this.endpointPath) {
      throw new Error('Endpoint path not configured');
    }

    const fullUrl = `${this.baseURL}${this.endpointPath}`;
    logger.info(`Making GET request to: ${fullUrl}`);

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
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