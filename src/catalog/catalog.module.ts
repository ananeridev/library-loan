import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { UserIdMiddleware } from '../auth/user-id.middleware';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserIdMiddleware).forRoutes(CatalogController);
  }
}
