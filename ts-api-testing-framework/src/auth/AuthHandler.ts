import { TokenManager } from './TokenManager';

interface Credentials {
  username: string;
  password: string;
}

interface AuthHeaders {
  Authorization: string;
  [key: string]: string;
}

/**
 * Auth Handler - Manages credentials and tokens
 * - Stores and retrieves credentials
 * - Manages bearer tokens
 * - Builds auth headers for API requests
 * - Integrates with TokenManager for token lifecycle
 */
export class AuthHandler {
  private credentials: Credentials | null = null;
  private tokenManager: TokenManager;
  private currentToken: string | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor(authUrl: string, clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokenManager = new TokenManager(authUrl, clientId, clientSecret);
  }

  /**
   * Set credentials for auth operations
   */
  public setCredentials(username: string, password: string): void {
    this.credentials = { username, password };
  }

  /**
   * Get current credentials
   */
  public getCredentials(): Credentials | null {
    return this.credentials;
  }

  /**
   * Get bearer token (uses cache from TokenManager)
   */
  public async getBearerToken(): Promise<string> {
    if (!this.credentials) {
      throw new Error('Credentials not set. Call setCredentials() first.');
    }

    const token = await this.tokenManager.getToken(this.credentials.username, this.credentials.password);
    this.currentToken = token;
    return token;
  }

  /**
   * Build authorization headers
   */
  public async getAuthHeaders(): Promise<AuthHeaders> {
    const token = await this.getBearerToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get additional headers
   */
  public getAdditionalHeaders(): Record<string, string> {
    return {
      'X-Client-ID': this.clientId,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build complete headers for API request
   */
  public async buildRequestHeaders(additionalHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const authHeaders = await this.getAuthHeaders();
    const defaultHeaders = this.getAdditionalHeaders();
    return {
      ...defaultHeaders,
      ...authHeaders,
      ...additionalHeaders,
    };
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(): boolean {
    if (!this.credentials) return true;
    return this.tokenManager.isTokenExpired(this.credentials.username, this.credentials.password);
  }

  /**
   * Refresh token
   */
  public async refreshToken(): Promise<string> {
    if (!this.credentials) {
      throw new Error('Credentials not set. Cannot refresh token.');
    }

    this.tokenManager.invalidateToken(this.credentials.username, this.credentials.password);
    return this.getBearerToken();
  }

  /**
   * Clear all auth data
   */
  public clearAuth(): void {
    this.credentials = null;
    this.currentToken = null;
    this.tokenManager.clearAllTokens();
  }

  /**
   * Get current token (without fetching)
   */
  public getCurrentToken(): string | null {
    return this.currentToken;
  }
}
