import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Loans E2E', () => {
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
    await prisma.loan.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /loans', () => {
    beforeEach(async () => {
      await prisma.book.create({
        data: {
          sku: 'LOAN-TEST-001',
          title: 'Livro para Empréstimo',
          author: 'Autor do Livro',
          copiesTotal: 2,
        },
      });
    });

    it('should create a loan successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user')
        .send({ sku: 'LOAN-TEST-001' })
        .expect(201);

      expect(response.body).toMatchObject({
        sku: 'LOAN-TEST-001',
        title: 'Livro para Empréstimo',
        author: 'Autor do Livro',
        userId: 'loan-user',
        status: 'ACTIVE',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.loanDate).toBeDefined();
    });

    it('should return 404 when book does not exist', async () => {
      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user')
        .send({ sku: 'NON-EXISTENT' })
        .expect(404);
    });

    it('should create user automatically', async () => {
      const response = await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'new-user')
        .send({ sku: 'LOAN-TEST-001' })
        .expect(201);

      expect(response.body.userId).toBe('new-user');
    });

    it('should return 409 when book is out of stock', async () => {
      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user-1')
        .send({ sku: 'LOAN-TEST-001' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user-2')
        .send({ sku: 'LOAN-TEST-001' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user-3')
        .send({ sku: 'LOAN-TEST-001' })
        .expect(409);
    });

    it('should return 409 when user has maximum active loans', async () => {
      await prisma.book.createMany({
        data: [
          {
            sku: 'LOAN-TEST-002',
            title: 'Livro 2',
            author: 'Autor 2',
            copiesTotal: 1,
          },
          {
            sku: 'LOAN-TEST-003',
            title: 'Livro 3',
            author: 'Autor 3',
            copiesTotal: 1,
          },
        ],
      });

      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user')
        .send({ sku: 'LOAN-TEST-001' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user')
        .send({ sku: 'LOAN-TEST-002' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'loan-user')
        .send({ sku: 'LOAN-TEST-003' })
        .expect(409);
    });

    it('should require x-user-id header', async () => {
      await request(app.getHttpServer())
        .post('/loans')
        .send({ sku: 'LOAN-TEST-001' })
        .expect(400);
    });
  });

  describe('PATCH /loans/:id/return', () => {
    let loanId: string;

    beforeEach(async () => {
      await prisma.book.create({
        data: {
          sku: 'RETURN-TEST-001',
          title: 'Livro para Devolução',
          author: 'Autor do Livro',
          copiesTotal: 1,
        },
      });

      const loan = await request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'return-user')
        .send({ sku: 'RETURN-TEST-001' })
        .expect(201);

      loanId = loan.body.id;
    });

    it('should return a loan successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/loans/${loanId}/return`)
        .set('x-user-id', 'return-user')
        .expect(200);

      expect(response.body).toMatchObject({
        id: loanId,
        sku: 'RETURN-TEST-001',
        status: 'RETURNED',
      });
      expect(response.body.returnDate).toBeDefined();
    });

    it('should return 404 when loan does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/loans/non-existent-id/return')
        .set('x-user-id', 'return-user')
        .expect(404);
    });

    it('should return 400 when loan does not belong to user', async () => {
      await request(app.getHttpServer())
        .patch(`/loans/${loanId}/return`)
        .set('x-user-id', 'other-user')
        .expect(400);
    });

    it('should return 409 when loan is already returned', async () => {
      await request(app.getHttpServer())
        .patch(`/loans/${loanId}/return`)
        .set('x-user-id', 'return-user')
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/loans/${loanId}/return`)
        .set('x-user-id', 'return-user')
        .expect(409);
    });
  });
});
