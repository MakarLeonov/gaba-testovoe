import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivationsModule } from './activations/activations.module';
import { PrismaModule } from './prisma/prisma.module';
import { PromocodesModule } from './promocodes/promocodes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ActivationsModule,
    PromocodesModule,
  ],
})
export class AppModule {}
