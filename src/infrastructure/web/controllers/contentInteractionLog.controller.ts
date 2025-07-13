import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { GetInteractionLogsUseCase } from '../../../application/use-cases/content/get-interaction-logs.use-case';
import { BaseController } from './base.controller';

export class ContentInteractionLogController extends BaseController {
  constructor(
    @inject(GetInteractionLogsUseCase)
    private readonly getInteractionLogsUseCase: GetInteractionLogsUseCase
  ) {
    super();
  }

  async getLogsByContentId(req: Request, res: Response): Promise<void> {
    try {
      const { contentId } = req.params;
      const logs = await this.getInteractionLogsUseCase.execute(contentId);
      this.ok(res, logs);
    } catch (error) {
      this.fail(res, error instanceof Error ? error.message : 'Failed to get interaction logs');
    }
  }
}
