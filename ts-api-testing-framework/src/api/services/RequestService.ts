import { APIClient } from '../clients/APIClient';
import { AuthHandler } from '../../auth/AuthHandler';

/**
 * Request Service - Unified request handler with auth integration
 * Centralizes all API request logic with automatic auth header injection
 */
export class RequestService {
  private apiClient: APIClient;
  private authHandler: AuthHandler;

  constructor(apiClient: APIClient, authHandler: AuthHandler) {
    this.apiClient = apiClient;
    this.authHandler = authHandler;
  }

  /**
   * Make authenticated GET request
   */
  public async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const headers = await this.authHandler.buildRequestHeaders();
    return this.apiClient.get(endpoint, { headers, params });
  }

  /**
   * Make authenticated POST request
   */
  public async post(endpoint: string, data: any, params?: Record<string, any>): Promise<any> {
    const headers = await this.authHandler.buildRequestHeaders();
    return this.apiClient.post(endpoint, data, { headers, params });
  }

  /**
   * Make authenticated PUT request
   */
  public async put(endpoint: string, data: any, params?: Record<string, any>): Promise<any> {
    const headers = await this.authHandler.buildRequestHeaders();
    return this.apiClient.put(endpoint, data, { headers, params });
  }

  /**
   * Make authenticated DELETE request
   */
  public async delete(endpoint: string, params?: Record<string, any>): Promise<any> {
    const headers = await this.authHandler.buildRequestHeaders();
    return this.apiClient.delete(endpoint, { headers, params });
  }

  /**
   * Make authenticated PATCH request
   */
  public async patch(endpoint: string, data: any, params?: Record<string, any>): Promise<any> {
    const headers = await this.authHandler.buildRequestHeaders();
    return this.apiClient.patch(endpoint, data, { headers, params });
  }

  /**
   * Make unauthenticated GET request
   */
  public async publicGet(endpoint: string, params?: Record<string, any>): Promise<any> {
    return this.apiClient.get(endpoint, { params });
  }

  /**
   * Make unauthenticated POST request
   */
  public async publicPost(endpoint: string, data: any, params?: Record<string, any>): Promise<any> {
    return this.apiClient.post(endpoint, data, { params });
  }

  /**
   * Refresh authentication and retry request
   */
  public async requestWithRetry(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<any> {
    try {
      switch (method) {
        case 'get':
          return await this.get(endpoint, params);
        case 'post':
          return await this.post(endpoint, data, params);
        case 'put':
          return await this.put(endpoint, data, params);
        case 'delete':
          return await this.delete(endpoint, params);
        case 'patch':
          return await this.patch(endpoint, data, params);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } catch (error: any) {
      // If 401 (Unauthorized), try to refresh token and retry
      if (error.status === 401) {
        await this.authHandler.refreshToken();

        switch (method) {
          case 'get':
            return await this.get(endpoint, params);
          case 'post':
            return await this.post(endpoint, data, params);
          case 'put':
            return await this.put(endpoint, data, params);
          case 'delete':
            return await this.delete(endpoint, params);
          case 'patch':
            return await this.patch(endpoint, data, params);
        }
      }
      throw error;
    }
  }
}
