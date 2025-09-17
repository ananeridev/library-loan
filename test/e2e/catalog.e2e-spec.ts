import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Catalog E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Limpar todos os dados
    await prisma.loan.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /catalog', () => {
    it('should return empty catalog initially', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog')
        .set('x-user-id', 'catalog-user')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return catalog with books', async () => {
      // Criar livros com SKUs únicos
      await prisma.book.createMany({
        data: [
          {
            sku: 'CAT-TEST-001',
            title: 'Livro 1',
            author: 'Autor 1',
            copiesTotal: 3,
          },
          {
            sku: 'CAT-TEST-002',
            title: 'Livro 2',
            author: 'Autor 2',
            copiesTotal: 2,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/catalog')
        .set('x-user-id', 'catalog-user')
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((book: any) => {
        expect(book).toHaveProperty('id');
        expect(book).toHaveProperty('sku');
        expect(book).toHaveProperty('title');
        expect(book).toHaveProperty('author');
        expect(book).toHaveProperty('copiesTotal');
        expect(book).toHaveProperty('copiesInUse');
        expect(book).toHaveProperty('copiesAvailable');
        expect(book).toHaveProperty('isAvailable');
      });
    });

    it('should show correct availability when books are borrowed', async () => {
      // Criar livro com SKU único
      await prisma.book.create({
        data: {
          sku: 'CAT-TEST-003',
          title: 'Livro 3',
          author: 'Autor 3',
          copiesTotal: 2,
        },
      });

      // Emprestar livro
      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'catalog-user-1')
        .send({ sku: 'CAT-TEST-003' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/catalog')
        .set('x-user-id', 'catalog-user-1')
        .expect(200);

      const book = response.body.find((b: any) => b.sku === 'CAT-TEST-003');
      expect(book).toMatchObject({
        sku: 'CAT-TEST-003',
        copiesTotal: 2,
        copiesInUse: 1,
        copiesAvailable: 1,
        isAvailable: true,
      });
    });

    it('should require x-user-id header', async () => {
      await request(app.getHttpServer()).get('/catalog').expect(400);
    });
  });
});
