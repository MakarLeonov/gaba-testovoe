import { Injectable, NotFoundException } from '@nestjs/common';
import { Activation, Promocode } from '@prisma/client';
import { ActivationsService } from '../activations/activations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivatePromocodeDto } from './dto/activate-promocode.dto';
import { CreatePromocodeDto } from './dto/create-promocode.dto';

@Injectable()
export class PromocodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activations: ActivationsService,
  ) {}

  async create(dto: CreatePromocodeDto): Promise<Promocode> {
    return this.prisma.promocode.create({
      data: {
        code: dto.code,
        discount: dto.discount,
        limit: dto.limit,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async findAll(): Promise<Promocode[]> {
    return this.prisma.promocode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCode(code: string): Promise<Promocode> {
    const promocode = await this.prisma.promocode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promocode) {
      throw new NotFoundException(`Promocode '${code}' not found`);
    }

    return promocode;
  }

  async activateByCode(
    code: string,
    dto: ActivatePromocodeDto,
  ): Promise<Activation> {
    return this.activations.activate(code.toUpperCase(), dto.email);
  }
}
