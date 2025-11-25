/**
 * Base Response Wrapper
 * Generic response structure for all API calls
 */
export interface IResponse {
  status: number;
  data: any;
  headers: Record<string, any>;
}

export class BaseResponse {
  public status: number;
  public data: any;
  public headers: Record<string, any>;
  public timestamp: Date;

  constructor(response: IResponse) {
    this.status = response.status;
    this.data = response.data;
    this.headers = response.headers;
    this.timestamp = new Date();
  }

  /**
   * Check if response is successful (2xx status)
   */
  public isSuccess(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  /**
   * Check if response is client error (4xx status)
   */
  public isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if response is server error (5xx status)
   */
  public isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Get response body
   */
  public getBody(): any {
    return this.data;
  }

  /**
   * Get specific header
   */
  public getHeader(key: string): any {
    return this.headers[key.toLowerCase()];
  }

  /**
   * Get all headers
   */
  public getHeaders(): Record<string, any> {
    return this.headers;
  }

  /**
   * Get specific field from response body
   */
  public getField(fieldName: string): any {
    if (typeof this.data === 'object' && this.data !== null) {
      return this.data[fieldName];
    }
    return undefined;
  }

  /**
   * Validate response against expected values
   */
  public validate(expectedStatus: number, expectedFields?: Record<string, any>): boolean {
    if (this.status !== expectedStatus) {
      return false;
    }

    if (expectedFields) {
      for (const [key, expectedValue] of Object.entries(expectedFields)) {
        const actualValue = this.getField(key);
        if (actualValue !== expectedValue) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Pretty print response
   */
  public toString(): string {
    return JSON.stringify(
      {
        status: this.status,
        data: this.data,
        timestamp: this.timestamp.toISOString(),
      },
      null,
      2
    );
  }
}
