import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
  const books = await Promise.all([
    prisma.book.create({
      data: {
        sku: 'BOOK-001',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        copiesTotal: 3,
      },
    }),
    prisma.book.create({
      data: {
        sku: 'BOOK-002',
        title: 'The Pragmatic Programmer',
        author: 'David Thomas, Andrew Hunt',
        copiesTotal: 2,
      },
    }),
    prisma.book.create({
      data: {
        sku: 'BOOK-003',
        title: 'Design Patterns',
        author: 'Gang of Four',
        copiesTotal: 1,
      },
    }),
    prisma.book.create({
      data: {
        sku: 'BOOK-004',
        title: 'Refactoring',
        author: 'Martin Fowler',
        copiesTotal: 2,
      },
    }),
    prisma.book.create({
      data: {
        sku: 'BOOK-005',
        title: 'Domain-Driven Design',
        author: 'Eric Evans',
        copiesTotal: 1,
      },
    }),
  ]);

  console.log(`✅ Created ${books.length} books`);


  const users = await Promise.all([
    prisma.user.create({
      data: {
        userId: 'user-1',
      },
    }),
    prisma.user.create({
      data: {
        userId: 'user-2',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
