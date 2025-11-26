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
  private logFilePath: string = 'test.log';

  constructor() {
    // Set log level from environment variable
    const level = process.env.LOG_LEVEL?.toUpperCase();
    if (level && Object.values(LogLevel).includes(level as LogLevel)) {
      this.logLevel = level as LogLevel;
    }
    // Clear log file at start
    const fs = require('fs');
    try {
      fs.writeFileSync(this.logFilePath, '');
    } catch (e) {
      // Ignore file errors
    }
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  private writeToFile(message: string): void {
    const fs = require('fs');
    try {
      fs.appendFileSync(this.logFilePath, message + '\n');
    } catch (e) {
      // Ignore file errors
    }
  }

  /**
   * Log debug message
   */
  public debug(message: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const msg = this.formatMessage(LogLevel.DEBUG, message);
      console.log(msg);
      this.writeToFile(msg);
    }
  }

  /**
   * Log info message
   */
  public info(message: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const msg = this.formatMessage(LogLevel.INFO, message);
      console.log(msg);
      this.writeToFile(msg);
    }
  }

  /**
   * Log warning message
   */
  public warn(message: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const msg = this.formatMessage(LogLevel.WARN, message);
      console.warn(msg);
      this.writeToFile(msg);
    }
  }

  /**
   * Log error message
   */
  public error(message: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const msg = this.formatMessage(LogLevel.ERROR, message);
      console.error(msg);
      this.writeToFile(msg);
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
