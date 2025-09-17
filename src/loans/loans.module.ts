import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { LoansRepository } from './repositories/loans.repository';
import { UserIdMiddleware } from '../auth/user-id.middleware';

@Module({
  controllers: [LoansController],
  providers: [LoansService, LoansRepository],
})
export class LoansModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserIdMiddleware).forRoutes(LoansController);
  }
}
