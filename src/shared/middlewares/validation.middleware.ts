import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { StatusCodes } from 'http-status-codes';

type SchemaType<T> = z.ZodType<T, z.ZodTypeDef, T>;

export const validate = <T>(schema: SchemaType<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar el cuerpo de la petición
      if (Object.keys(req.body).length > 0) {
        req.body = await schema.parseAsync(req.body);
      }
      
      // Validar los parámetros de la ruta
      if (Object.keys(req.params).length > 0) {
        req.params = await schema.pick({
          ...Object.keys(req.params).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        }).parseAsync(req.params);
      }
      
      // Validar los query parameters
      if (Object.keys(req.query).length > 0) {
        req.query = await schema.pick({
          ...Object.keys(req.query).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        }).parseAsync(req.query);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`Error de validación: ${JSON.stringify(error.errors)}`);
        
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Error de validación',
          errors: formattedErrors,
        });
      } else {
        next(error);
      }
    }
  };
};

// Función de utilidad para validar parámetros de ruta
export const validateParams = <T>(schema: SchemaType<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new Error('Parámetros de ruta inválidos'));
      } else {
        next(error);
      }
    }
  };
};

// Función de utilidad para validar query parameters
export const validateQuery = <T>(schema: SchemaType<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new Error('Parámetros de consulta inválidos'));
      } else {
        next(error);
      }
    }
  };
};

// Función de utilidad para validar el cuerpo de la petición
export const validateBody = <T>(schema: SchemaType<T>) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new Error('Cuerpo de la petición inválido'));
      } else {
        next(error);
      }
    }
  };
};
