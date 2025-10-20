const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const normalize = (s = '') => s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();

async function main() {
  const target = {
    name: 'Сапоги утепленные',
    classification: '(Тн)',
    quantity: 1,
    period: '24',
    periodType: 'months',
  };

  const all = await prisma.sizNorm.findMany();
  const exists = all.find((n) => normalize(n.name) === normalize(target.name));

  if (exists) {
    console.log('Норматив уже существует:', exists.name);
    const desired = '(Тн)';
    const current = exists.classification || '';
    const normalized = current.trim();
    if (normalized !== desired) {
      await prisma.sizNorm.update({
        where: { id: exists.id },
        data: { classification: desired },
      });
      console.log(`Классификация обновлена: "${normalized}" → "${desired}"`);
    }
  } else {
    await prisma.sizNorm.create({ data: target });
    console.log('Добавлен норматив:', target.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


