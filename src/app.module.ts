import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { LoansModule } from './loans/loans.module';
import { CatalogModule } from './catalog/catalog.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, LoansModule, CatalogModule],
})
export class AppModule {}
