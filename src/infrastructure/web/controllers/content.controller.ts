import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { CreateContentUseCase } from '../../../application/use-cases/content/create-content.use-case';
import { BaseController } from './base.controller';

export class ContentController extends BaseController {
  constructor(
    @inject(CreateContentUseCase)
    private readonly createContentUseCase: CreateContentUseCase
  ) {
    super();
  }

  validateContentRequest(req: Request, res: Response, next: Function): void {
    if (req.is('text/plain')) {
      req.body = { text: req.body };
      return next();
    }
    
    if (!req.is('application/json')) {
      return this.badRequest(res, 'Content-Type must be application/json or text/plain');
    }
    
    try {
      if (typeof req.body !== 'object' || req.body === null) {
        throw new Error('Request body must be a JSON object');
      }
      next();
    } catch (error) {
      this.badRequest(res, error instanceof Error ? error.message : 'Invalid JSON');
    }
  }

  async createContent(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return this.badRequest(res, 'Invalid request body - must be valid JSON object');
      }
      // Process the validated JSON request
      const result = await this.createContentUseCase.execute(req.body);
      this.created(res);
      res.status(201).json(result);
    } catch (error) {
      this.fail(res, error instanceof Error ? error.message : 'Failed to create content');
    }
  }
}
