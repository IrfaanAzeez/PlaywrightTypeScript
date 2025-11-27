import { APIClient } from '../clients/APIClient';
import { loadConfig } from '../../utils/config';
import { logger } from '../../utils/logger';

export class SraRequestService {
  private apiClient: APIClient;
  private baseURL: string;
  private authURL: string;
  private sraToken: string | null = null;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;

    const config = loadConfig('dev'); // minimal change; loads dev environment
    this.baseURL = config.baseURL || '';
    this.authURL = config.authURL || '';

    logger.info(`SraRequestService initialized`);
    logger.info(`  - Base URL: ${this.baseURL}`);
    logger.info(`  - Auth URL: ${this.authURL}`);
  }

  /**
   * Authenticate using client credentials
   */
  public async authenticateSra(): Promise<string> {
    const config = loadConfig('dev'); 
    const authURL = config.authURL;
    const clientId = config.client_id;        
    const clientSecret = config.client_secret; 
    const resourceUrl = config.resource_url;   

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
   * Make GET request to a specific endpoint using JWT token
   */
  public async getSraSprCopyParam(token: string, endpoint: string): Promise<any> {
    const authToken = token || this.sraToken;
    if (!authToken) {
      throw new Error('Token not available. Please authenticate first.');
    }

    const fullUrl = `${this.baseURL}${endpoint}`;
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
}
