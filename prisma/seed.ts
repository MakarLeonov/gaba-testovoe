import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.activation.deleteMany();
  await prisma.promocode.deleteMany();

  const active = await prisma.promocode.create({
    data: {
      code: 'SAVE20',
      discount: 20,
      limit: 10,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.promocode.create({
    data: {
      code: 'EXPIRED50',
      discount: 50,
      limit: 100,
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const full = await prisma.promocode.create({
    data: {
      code: 'FULL15',
      discount: 15,
      limit: 2,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.activation.createMany({
    data: [
      { promocodeId: full.id, email: 'user1@example.com' },
      { promocodeId: full.id, email: 'user2@example.com' },
    ],
  });

  await prisma.activation.create({
    data: {
      promocodeId: active.id,
      email: 'existing@example.com',
    },
  });
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + '\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
