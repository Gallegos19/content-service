import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log del error
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);

  // Si el error ya tiene un código de estado, usarlo; de lo contrario, usar 500
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  
  // Mensaje de error predeterminado
  const message = err.message || 'Error interno del servidor';

  // Respuesta de error
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Clase personalizada para errores de la API
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Clase para errores de validación
export class ValidationError extends ApiError {
  errors: any[];

  constructor(errors: any[]) {
    super(StatusCodes.BAD_REQUEST, 'Error de validación');
    this.errors = errors;
  }
}

// Clase para errores de no encontrado
export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(StatusCodes.NOT_FOUND, `${resource} no encontrado`);
  }
}

// Clase para errores de no autorizado
export class UnauthorizedError extends ApiError {
  constructor(message = 'No autorizado') {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}

// Clase para errores de prohibido
export class ForbiddenError extends ApiError {
  constructor(message = 'No tiene permiso para realizar esta acción') {
    super(StatusCodes.FORBIDDEN, message);
  }
}
