import { ExpressAdapter } from '@bull-board/express';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';

@Injectable()
export class QueueUIProvider {
  static router = null;
  constructor(
    @InjectQueue('UserWeeklyPlaner') private weeklyPlanerQueue: Queue,
    @InjectQueue('UserGoal') private goalQueue: Queue,
    @InjectQueue('mail-otp') private readonly mailQueue: Queue,
  ) {
    const serverAdapter = new ExpressAdapter().setBasePath('/admin/queues');
    createBullBoard({
      queues: [
        new BullAdapter(this.weeklyPlanerQueue),
        new BullAdapter(this.goalQueue),
        new BullAdapter(this.mailQueue),
      ],
      serverAdapter: serverAdapter
    });
    QueueUIProvider.router = serverAdapter.getRouter();
  }
}
