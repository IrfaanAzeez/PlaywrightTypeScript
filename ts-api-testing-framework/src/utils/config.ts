import * as fs from 'fs';
import * as path from 'path';

interface EnvironmentConfig {
  baseURL?: string;
  apiURL?: string;
  authURL?: string;
  clientId?: string;
  clientSecret?: string;
  credentials?: {
    username: string;
    password: string;
  };
  timeout: number;
  retries: number;
  email?: string;
  resourceUrl?: string;
}

let configCache: Map<string, EnvironmentConfig> = new Map();

/**
 * Load configuration for specified environment
 */
export function loadConfig(environment: string = 'dev'): EnvironmentConfig {
  // Return from cache if already loaded
  if (configCache.has(environment)) {
    return configCache.get(environment)!;
  }

  try {
    // Construct path to environment.json
    const configPath = path.join(__dirname, '../../config/environment.json');

    // Read and parse config file
    const configFile = fs.readFileSync(configPath, 'utf-8');
    const allConfigs = JSON.parse(configFile);

    // Get specific environment config
    const envConfig = allConfigs[environment];

    if (!envConfig) {
      throw new Error(`Environment "${environment}" not found in config file`);
    }

    // Normalize keys to support both camelCase and snake_case
    const finalConfig: EnvironmentConfig & { resourceUrl?: string } = {
      baseURL: process.env.BASE_URL || envConfig.baseURL,
      apiURL: process.env.API_URL || envConfig.apiURL,
      authURL: process.env.AUTH_URL || envConfig.authURL,
      clientId: process.env.CLIENT_ID || envConfig.clientId || envConfig.client_id,
      clientSecret: process.env.CLIENT_SECRET || envConfig.clientSecret || envConfig.client_secret,
      resourceUrl: process.env.RESOURCE_URL || envConfig.resourceUrl || envConfig.resource_url,
      credentials: envConfig.credentials ? {
        username: process.env.TEST_USERNAME || envConfig.credentials.username,
        password: process.env.TEST_PASSWORD || envConfig.credentials.password,
      } : undefined,
      timeout: parseInt(process.env.API_TIMEOUT || String(envConfig.timeout), 10),
      retries: parseInt(process.env.API_RETRIES || String(envConfig.retries), 10),
      email: process.env.TEST_EMAIL || envConfig.email,
    };

    // Cache the config
    configCache.set(environment, finalConfig);

    return finalConfig;
  } catch (error) {
    throw new Error(`Failed to load config for environment "${environment}": ${error}`);
  }
}

/**
 * Get configuration value
 */
export function getConfigValue(key: string, environment: string = 'dev'): any {
  const config = loadConfig(environment);
  const keys = key.split('.');
  let value: any = config;

  for (const k of keys) {
    value = value?.[k];
  }

  return value;
}

/**
 * Override configuration value at runtime
 */
export function setConfigValue(key: string, value: any, environment: string = 'dev'): void {
  const config = loadConfig(environment);
  const keys = key.split('.');

  let obj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    obj[k] = obj[k] || {};
    obj = obj[k];
  }

  obj[keys[keys.length - 1]] = value;
}

/**
 * Clear config cache
 */
export function clearConfigCache(): void {
  configCache.clear();
}
