import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {
        // Production: JSON format for log aggregation
        transport: undefined,
      }
    : {
        // Development: Pretty print for readability
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      }),
});

// Helper for logging API requests
export function logRequest(req: any, label?: string) {
  logger.info({
    event: 'api_request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...(label && { label }),
  });
}

// Helper for logging API responses
export function logResponse(
  req: any,
  statusCode: number,
  duration: number,
  label?: string
) {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level]({
    event: 'api_response',
    method: req.method,
    path: req.path,
    statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    ...(label && { label }),
  });
}

// Helper for logging errors
export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    event: 'error',
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

// Helper for logging database operations
export function logDatabase(operation: string, duration: number, context?: Record<string, any>) {
  logger.debug({
    event: 'database_query',
    operation,
    duration: `${duration}ms`,
    ...context,
  });
}

// Helper for logging authentication
export function logAuth(event: string, userId?: string, context?: Record<string, any>) {
  logger.info({
    event: `auth_${event}`,
    userId,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export default logger;
