import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Replace control characters (CR, LF, ANSI escapes) and Unicode line separators in
// user-controlled values before they are interpolated into a log line, so crafted
// input cannot forge extra log entries (log injection).
export const sanitizeLog = (value) => String(value).replaceAll(/[\p{Cc}\u2028\u2029]/gu, ' ');

export default logger;
