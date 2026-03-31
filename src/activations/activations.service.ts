import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Activation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivationsService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(code: string, email: string): Promise<Activation> {
    return this.prisma.$transaction(async (tx) => {
      const promocode = await tx.promocode.findUnique({
        where: { code },
      });

      if (!promocode) {
        throw new NotFoundException(`Promocode '${code}' not found`);
      }

      if (promocode.expiresAt < new Date()) {
        throw new GoneException('Promocode has expired');
      }

      const count = await tx.activation.count({
        where: { promocodeId: promocode.id },
      });

      if (count >= promocode.limit) {
        throw new ConflictException('Activation limit reached');
      }

      return tx.activation.create({
        data: { promocodeId: promocode.id, email },
      });
    });
  }
}
