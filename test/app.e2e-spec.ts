import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  beforeEach(async () => {
    await prisma.loan.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();

    await prisma.book.create({
      data: {
        sku: 'TEST-001',
        title: 'Test Book',
        author: 'Test Author',
        copiesTotal: 2,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/catalog (GET)', () => {
    it('should return catalog with availability', () => {
      return request(app.getHttpServer())
        .get('/catalog')
        .set('x-user-id', 'test-user')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0]).toHaveProperty('sku', 'TEST-001');
          expect(res.body[0]).toHaveProperty('isAvailable', true);
          expect(res.body[0]).toHaveProperty('copiesAvailable', 2);
        });
    });

    it('should require x-user-id header', () => {
      return request(app.getHttpServer())
        .get('/catalog')
        .expect(400);
    });
  });

  describe('/loans (POST)', () => {
    it('should create a new loan', () => {
      return request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'test-user')
        .send({ sku: 'TEST-001' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sku', 'TEST-001');
          expect(res.body).toHaveProperty('status', 'ACTIVE');
        });
    });

    it('should reject loan for non-existent book', () => {
      return request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'test-user')
        .send({ sku: 'NON-EXISTENT' })
        .expect(404);
    });

    it('should require sku in body', () => {
      return request(app.getHttpServer())
        .post('/loans')
        .set('x-user-id', 'test-user')
        .send({})
        .expect(400);
    });
  });
});
