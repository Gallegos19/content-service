import { Router } from 'express';
import { inject, injectable } from 'inversify';
import { ContentInteractionLogController } from '../controllers/contentInteractionLog.controller';

export interface IContentInteractionLogRoutes {
  setupRoutes(): Router;
}

@injectable()
export class ContentInteractionLogRoutes implements IContentInteractionLogRoutes {
  private readonly router: Router;

  constructor(
    @inject(ContentInteractionLogController)
    private readonly controller: ContentInteractionLogController
  ) {
    this.router = Router();
  }

  setupRoutes(): Router {
    this.router.get('/:contentId/logs', (req, res) => this.controller.getLogsByContentId(req, res));
    return this.router;
  }
}
