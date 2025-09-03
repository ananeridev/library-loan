import { Module } from '@nestjs/common';
import { UserIdMiddleware } from './user-id.middleware';

@Module({
  providers: [UserIdMiddleware],
  exports: [UserIdMiddleware],
})
export class AuthModule {}
