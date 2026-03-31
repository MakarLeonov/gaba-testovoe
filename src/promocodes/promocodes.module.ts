import { Module } from '@nestjs/common';
import { ActivationsModule } from '../activations/activations.module';
import { PromocodesController } from './promocodes.controller';
import { PromocodesService } from './promocodes.service';

@Module({
  imports: [ActivationsModule],
  controllers: [PromocodesController],
  providers: [PromocodesService],
})
export class PromocodesModule {}
