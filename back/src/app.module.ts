import { Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';

import { LoggerModule } from './logger/logger.module';
import { GraphqlConfigModule } from './modules/graphql.module';
import { SalesModule } from './modules/sales/sales.module';

@Module({
  imports: [LoggerModule, GraphqlConfigModule, SalesModule],
})
export class AppModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);

  onApplicationBootstrap() {
    process.on('uncaughtException', error =>
      this.logger.error(`uncaughtException: ${(error as Error).message}`, error as Error),
    );
    process.on('unhandledRejection', reason => this.logger.error('unhandledRejection', reason as Error));
  }

  onApplicationShutdown(signal: string) {
    if (signal === 'SIGTERM') {
      this.logger.log(`${signal} signal received: closing application`);
    }
  }
}
