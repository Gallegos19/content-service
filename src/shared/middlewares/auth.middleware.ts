import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar si el encabezado de autorización existe
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Intento de acceso sin token de autenticación');
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Token de autenticación requerido',
      });
    }

    // Verificar que el token tenga el formato correcto (Bearer token)
    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      logger.warn('Formato de token inválido');
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Formato de token inválido. Use Bearer token',
      });
    }

    // Adjuntar el token a la solicitud para su uso posterior si es necesario
    req.token = token;
    
    // Continuar con el siguiente middleware o controlador
    next();
  } catch (error: unknown) {
    logger.error(`Error en el middleware de autenticación: ${error instanceof Error ? error.message : 'Unknown error'}`);
    next(error instanceof Error ? error : new Error('Unknown error'));
  }
};

// Extender la interfaz Request de Express para incluir la propiedad token
declare global {
  namespace Express {
    interface Request {
      token?: string;
    }
  }
}
