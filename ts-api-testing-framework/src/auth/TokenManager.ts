/**
 * Token Manager - Handles bearer token lifecycle
 * - Fetches tokens from auth endpoint
 * - Caches tokens in memory
 * - Checks token expiry
 * - Auto-refreshes expired tokens
 */

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface TokenData {
  token: string;
  expiresAt: number;
  issuedAt: number;
}

export class TokenManager {
  private tokens: Map<string, TokenData> = new Map();
  private tokenRefreshUrl: string;
  private clientId: string;
  private clientSecret: string;
  private refreshThresholdMs: number = 30000; // Refresh 30 seconds before expiry

  constructor(authUrl: string, clientId: string, clientSecret: string) {
    this.tokenRefreshUrl = `${authUrl}/token`;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Get or fetch a new token
   */
  public async getToken(username: string, password: string): Promise<string> {
    const key = this.getTokenKey(username, password);

    // Check if token exists and is still valid
    if (this.isTokenValid(key)) {
      return this.tokens.get(key)!.token;
    }

    // Fetch new token
    const newToken = await this.fetchToken(username, password);
    return newToken;
  }

  /**
   * Fetch token from auth endpoint
   */
  private async fetchToken(username: string, password: string): Promise<string> {
    try {
      const response = await fetch(this.tokenRefreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token fetch failed with status ${response.status}`);
      }

      const data: TokenResponse = await response.json();
      const key = this.getTokenKey(username, password);
      const expiresAt = Date.now() + data.expires_in * 1000;

      this.tokens.set(key, {
        token: data.access_token,
        expiresAt,
        issuedAt: Date.now(),
      });

      return data.access_token;
    } catch (error) {
      throw new Error(`Failed to fetch token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if cached token is valid
   */
  private isTokenValid(key: string): boolean {
    const tokenData = this.tokens.get(key);
    if (!tokenData) return false;

    const timeUntilExpiry = tokenData.expiresAt - Date.now();
    return timeUntilExpiry > this.refreshThresholdMs;
  }

  /**
   * Check token expiry
   */
  public isTokenExpired(username: string, password: string): boolean {
    const key = this.getTokenKey(username, password);
    const tokenData = this.tokens.get(key);
    if (!tokenData) return true;
    return Date.now() > tokenData.expiresAt;
  }

  /**
   * Invalidate token (force refresh on next request)
   */
  public invalidateToken(username: string, password: string): void {
    const key = this.getTokenKey(username, password);
    this.tokens.delete(key);
  }

  /**
   * Clear all cached tokens
   */
  public clearAllTokens(): void {
    this.tokens.clear();
  }

  /**
   * Get token expiry timestamp
   */
  public getTokenExpiry(username: string, password: string): number | null {
    const key = this.getTokenKey(username, password);
    const tokenData = this.tokens.get(key);
    return tokenData?.expiresAt || null;
  }

  /**
   * Generate cache key
   */
  private getTokenKey(username: string, password: string): string {
    return `${username}:${password}`;
  }
}
