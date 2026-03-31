import { Module } from '@nestjs/common';
import { ActivationsService } from './activations.service';

@Module({
  providers: [ActivationsService],
  exports: [ActivationsService],
})
export class ActivationsModule {}
