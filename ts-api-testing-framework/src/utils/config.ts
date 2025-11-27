import * as fs from 'fs';
import * as path from 'path';

export interface EnvironmentConfig {
  baseURL?: string;
  authURL?: string;
  client_id?: string;
  client_secret?: string;
  resource_url?: string;
  educationEndpoint?: string;
  [key: string]: any;   // allow additional config keys
}

let configCache: Map<string, EnvironmentConfig> = new Map();

/**
 * Load configuration for the selected environment exactly as in environment.json
 */
export function loadConfig(environment: string = 'dev'): EnvironmentConfig {
  // Return cached config if present
  if (configCache.has(environment)) {
    return configCache.get(environment)!;
  }

  try {
    const configPath = path.join(__dirname, '../../config/environment.json');
    const fileContents = fs.readFileSync(configPath, 'utf-8');
    const allConfigs = JSON.parse(fileContents);

    const envConfig = allConfigs[environment];
    if (!envConfig) {
      throw new Error(`Environment "${environment}" not found.`);
    }

    // Merge environment variables (if provided)
    const finalConfig: EnvironmentConfig = {
      ...envConfig,
      baseURL: process.env.BASE_URL || envConfig.baseURL,
      authURL: process.env.AUTH_URL || envConfig.authURL,
      client_id: process.env.CLIENT_ID || envConfig.client_id,
      client_secret: process.env.CLIENT_SECRET || envConfig.client_secret,
      resource_url: process.env.RESOURCE_URL || envConfig.resource_url
    };

    configCache.set(environment, finalConfig);
    return finalConfig;

  } catch (err) {
    throw new Error(`Failed to load config for environment "${environment}": ${err}`);
  }
}

/**
 * Get a nested config value (e.g. getConfigValue('endpoints.education'))
 */
export function getConfigValue(key: string, environment: string = 'dev') {
  const config = loadConfig(environment);
  return key.split('.').reduce((o, k) => (o || {})[k], config);
}

/**
 * Override a config value at runtime
 */
export function setConfigValue(key: string, value: any, environment: string = 'dev') {
  const config = loadConfig(environment);
  const keys = key.split('.');

  let obj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    obj[keys[i]] = obj[keys[i]] || {};
    obj = obj[keys[i]];
  }

  obj[keys[keys.length - 1]] = value;
}

/** Clear config cache */
export function clearConfigCache() {
  configCache.clear();
}
