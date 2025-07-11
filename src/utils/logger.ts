import { Config } from '@/types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  component?: string;
}

export class Logger {
  private config: Config;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: Config) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.logLevel];
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, component } = entry;
    
    switch (this.config.logFormat) {
      case 'json':
        return JSON.stringify(entry);
      case 'structured': {
        const parts = [timestamp, `[${level.toUpperCase()}]`];
        if (component) parts.push(`{${component}}`);
        parts.push(message);
        if (context && Object.keys(context).length > 0) {
          parts.push(JSON.stringify(context));
        }
        return parts.join(' ');
      }
      case 'text':
      default:
        return `${timestamp} [${level.toUpperCase()}] ${message}`;
    }
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, component?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      component,
    };
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formatted = this.formatLog(entry);
    
    // Write to console (stderr for warnings/errors, stdout for others)
    if (entry.level === 'error' || entry.level === 'warn') {
      console.error(formatted);
    } else {
      console.log(formatted);
    }

    // TODO: Add file logging if logFilePath is configured
    // if (this.config.logFilePath) {
    //   // Append to file
    // }
  }

  debug(message: string, context?: Record<string, any>, component?: string): void {
    this.writeLog(this.createLogEntry('debug', message, context, component));
  }

  info(message: string, context?: Record<string, any>, component?: string): void {
    this.writeLog(this.createLogEntry('info', message, context, component));
  }

  warn(message: string, context?: Record<string, any>, component?: string): void {
    this.writeLog(this.createLogEntry('warn', message, context, component));
  }

  error(message: string, context?: Record<string, any>, component?: string): void {
    this.writeLog(this.createLogEntry('error', message, context, component));
  }

  // Performance logging
  performance(operation: string, durationMs: number, context?: Record<string, any>, component?: string): void {
    if (this.config.enablePerformanceLogging) {
      this.info(`Performance: ${operation} completed in ${durationMs}ms`, {
        operation,
        durationMs,
        ...context,
      }, component);
    }
  }

  // Access logging
  access(method: string, path: string, statusCode: number, durationMs: number, context?: Record<string, any>): void {
    if (this.config.enableAccessLogging) {
      this.info(`Access: ${method} ${path} ${statusCode} ${durationMs}ms`, {
        method,
        path,
        statusCode,
        durationMs,
        ...context,
      }, 'access');
    }
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function initializeLogger(config: Config): Logger {
  globalLogger = new Logger(config);
  return globalLogger;
}

export function getLogger(): Logger {
  if (!globalLogger) {
    throw new Error('Logger not initialized. Call initializeLogger() first.');
  }
  return globalLogger;
}