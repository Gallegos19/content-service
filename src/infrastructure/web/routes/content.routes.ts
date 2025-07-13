import { Router } from 'express';
import { inject, injectable } from 'inversify';
import { ContentController } from '../controllers/content.controller';

export interface IContentRoutes {
  setupRoutes(): Router;
}

@injectable()
export class ContentRoutes implements IContentRoutes {
  private readonly router: Router;

  constructor(
    @inject(ContentController)
    private readonly controller: ContentController
  ) {
    this.router = Router();
  }

  setupRoutes(): Router {
    this.router.post(
      '/',
      this.controller.validateContentRequest.bind(this.controller),
      this.controller.createContent.bind(this.controller)
    );
    return this.router;
  }
}
