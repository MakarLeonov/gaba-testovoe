import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Activation, Promocode } from '@prisma/client';
import { ActivatePromocodeDto } from './dto/activate-promocode.dto';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { PromocodesService } from './promocodes.service';

@Controller('promocodes')
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePromocodeDto): Promise<Promocode> {
    return this.promocodesService.create(dto);
  }

  @Get()
  findAll(): Promise<Promocode[]> {
    return this.promocodesService.findAll();
  }

  @Get(':code')
  findOne(@Param('code') code: string): Promise<Promocode> {
    return this.promocodesService.findByCode(code);
  }

  @Post(':code/activate')
  @HttpCode(HttpStatus.OK)
  activate(
    @Param('code') code: string,
    @Body() dto: ActivatePromocodeDto,
  ): Promise<Activation> {
    return this.promocodesService.activateByCode(code, dto);
  }
}
