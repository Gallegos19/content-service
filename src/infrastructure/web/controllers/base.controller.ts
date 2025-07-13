import { Response } from 'express';

export abstract class BaseController {
  protected ok<T>(res: Response, dto?: T): void {
    if (dto) {
      res.status(200).json(dto);
    } else {
      res.sendStatus(200);
    }
  }

  protected created(res: Response): void {
    res.sendStatus(201);
  }

  protected fail(res: Response, error: Error | string): void {
    console.error(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : error
    });
  }

  protected notFound(res: Response, message?: string): void {
    res.status(404).json({
      message: message || 'Not found'
    });
  }

  protected badRequest(res: Response, message?: string): void {
    res.status(400).json({
      message: message || 'Bad request'
    });
  }
}
