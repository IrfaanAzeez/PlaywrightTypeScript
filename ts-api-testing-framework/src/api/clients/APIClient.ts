import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import https from 'https';

interface RequestConfig {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  url: string;
  headers?: Record<string, any>;
  data?: any;
  params?: Record<string, any>;
  timeout?: number;
}

interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, any>;
}

export class APIClient {
  private client: AxiosInstance;
  private baseURL: string;
  private timeout: number;

  /**
   * @param baseURL - base URL for requests
   * @param timeout - request timeout
   * @param allowInsecureTLS - if true, disables TLS certificate verification (use only for internal/test envs)
   */
  constructor(baseURL: string, timeout: number = 5000, allowInsecureTLS: boolean = false) {
    this.baseURL = baseURL;
    this.timeout = timeout;

    const httpsAgent = allowInsecureTLS ? new https.Agent({ rejectUnauthorized: false }) : undefined;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Add an authorization header to all requests
   */
  public setAuthHeader(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization header
   */
  public removeAuthHeader(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Set custom headers
   */
  public setHeaders(headers: Record<string, any>): void {
    Object.assign(this.client.defaults.headers.common, headers);
  }

  /**
   * GET request
   */
  public async get(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse> {
    return this.request({
      method: 'get',
      url,
      ...config,
    });
  }

  /**
   * POST request
   */
  public async post(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse> {
    return this.request({
      method: 'post',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT request
   */
  public async put(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse> {
    return this.request({
      method: 'put',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  public async delete(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse> {
    return this.request({
      method: 'delete',
      url,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  public async patch(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse> {
    return this.request({
      method: 'patch',
      url,
      data,
      ...config,
    });
  }

  /**
   * Generic request handler
   */
  private async request(config: RequestConfig): Promise<ApiResponse> {
    try {
      const response: AxiosResponse = await this.client({
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
        timeout: config.timeout || this.timeout,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      throw {
        status: axiosError.response?.status || 500,
        data: axiosError.response?.data || { message: axiosError.message },
        headers: axiosError.response?.headers || {},
        message: axiosError.message,
      };
    }
  }
}
