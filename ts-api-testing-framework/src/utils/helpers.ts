
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `test.${timestamp}.${random}@example.com`;
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate random user ID
 */
export function generateRandomUserId(): string {
  return Math.floor(Math.random() * 10000000).toString();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate response structure
 */
export function validateUserStructure(user: any): boolean {
  const requiredFields = ['id', 'firstName', 'lastName', 'email'];
  return requiredFields.every(field => field in user);
}

/**
 * Compare two user objects
 */
export function compareUsers(user1: any, user2: any): boolean {
  const fieldsToCompare = ['firstName', 'lastName', 'email'];
  return fieldsToCompare.every(field => user1[field] === user2[field]);
}

/**
 * Extract user ID from response
 */

/**
 * Get error message from response
 */


/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeoutMs: number = 5000,
  checkIntervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone((obj as any)[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Check if objects are equal (shallow)
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
