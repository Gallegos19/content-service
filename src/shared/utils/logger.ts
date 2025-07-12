import winston from 'winston';
import path from 'path';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Formato personalizado para los logs
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

// Directorio de logs
const logDir = path.join(process.cwd(), 'logs');

// Configuración del transporte de archivo con rotación diaria
const fileTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'application-%DATE%.log', // Patrón de nomenclatura de archivos
  datePattern: 'YYYY-MM-DD', // Rotación diaria
  zippedArchive: true, // Comprimir archivos antiguos
  maxSize: '20m', // Tamaño máximo del archivo antes de la rotación
  maxFiles: '14d', // Conservar logs de los últimos 14 días
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
});

// Configuración del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Escribir logs a la consola
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      ),
    }),
    // Escribir logs a archivo
    fileTransport,
  ],
  exitOnError: false, // No salir en excepciones manejadas
});

// Capturar excepciones no manejadas
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      json()
    ),
  })
);

// Capturar promesas rechazadas no manejadas
process.on('unhandledRejection', (reason) => {
  throw reason;
});

export { logger };
