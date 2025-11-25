// Entry point for the framework - exports all public APIs

// API Clients
export { APIClient } from './src/api/clients/APIClient';

// Authentication
export { AuthHandler } from './src/auth/AuthHandler';
export { TokenManager } from './src/auth/TokenManager';

// Request Services
export { UserRequestService } from './src/api/requests/UserRequestService';
export { RequestService } from './src/api/services/RequestService';

// Responses
export { BaseResponse } from './src/api/responses/BaseResponse';
export { UserResponse } from './src/api/responses/UserResponse';
export type { User } from './src/api/responses/UserResponse';
export type { IResponse } from './src/api/responses/BaseResponse';

// Cucumber Support
export { ApiWorld } from './src/support/world';

// Utilities
export { loadConfig, getConfigValue, setConfigValue, clearConfigCache } from './src/utils/config';
export { logger } from './src/utils/logger';

// Type exports for TypeScript users
export type { EnvironmentConfig } from './src/utils/config';
