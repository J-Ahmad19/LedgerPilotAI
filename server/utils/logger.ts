import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'secret',
      'apiKey',
      'req.headers.authorization',
      '*.password',
      '*.token',
      'amount',
      'balance',
      'amountMinor',
      'accountNumber',
      'routingNumber',
      'ssn'
    ],
    censor: '[REDACTED]'
  },
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  },
  timestamp: pino.stdTimeFunctions.isoTime
});
