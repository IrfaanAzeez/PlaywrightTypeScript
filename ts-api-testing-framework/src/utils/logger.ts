/**
 * Logger Utility
 * Simple logging utility for test execution
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Set log level from environment variable
    const level = process.env.LOG_LEVEL?.toUpperCase();
    if (level && Object.values(LogLevel).includes(level as LogLevel)) {
      this.logLevel = level as LogLevel;
    }
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * Log debug message
   */
  public debug(message: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  /**
   * Log info message
   */
  public info(message: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message));
    }
  }

  /**
   * Log warning message
   */
  public warn(message: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message));
    }
  }

  /**
   * Log error message
   */
  public error(message: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message));
    }
  }

  /**
   * Check if message should be logged based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Set log level
   */
  public setLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Export singleton logger instance
export const logger = new Logger();
