import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { UserIdMiddleware } from '../auth/user-id.middleware';

@Module({
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserIdMiddleware)
      .forRoutes(LoansController);
  }
}
