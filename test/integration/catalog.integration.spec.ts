import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from '../../src/catalog/catalog.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

describe('Catalog Integration Tests', () => {
  let service: CatalogService;
  let prismaService: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('getCatalog integration', () => {
    it('should integrate with PrismaService correctly', async () => {
      const mockBooks = [
        {
          id: 'book-1',
          sku: 'INTEGRATION-001',
          title: 'Integration Test Book',
          author: 'Integration Author',
          copiesTotal: 2,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          loans: [{ id: 'loan-1', status: LoanStatus.ACTIVE }],
        },
      ];

      jest.spyOn(prismaService.book, 'findMany').mockResolvedValue(mockBooks);

      const result = await service.getCatalog();

      expect(prismaService.book.findMany).toHaveBeenCalledWith({
        include: {
          loans: {
            where: { status: LoanStatus.ACTIVE },
          },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'book-1',
        sku: 'INTEGRATION-001',
        title: 'Integration Test Book',
        author: 'Integration Author',
        copiesTotal: 2,
        copiesInUse: 1,
        copiesAvailable: 1,
        isAvailable: true,
      });
    });

    it('should handle complex loan scenarios', async () => {
      // O mock deve simular o comportamento real do Prisma que filtra apenas empréstimos ativos
      const complexBooks = [
        {
          id: 'book-1',
          sku: 'COMPLEX-001',
          title: 'Complex Book',
          author: 'Complex Author',
          copiesTotal: 5,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          loans: [
            { id: 'loan-1', status: LoanStatus.ACTIVE },
            { id: 'loan-2', status: LoanStatus.ACTIVE },
            { id: 'loan-3', status: LoanStatus.ACTIVE },
          ],
        },
      ];

      jest
        .spyOn(prismaService.book, 'findMany')
        .mockResolvedValue(complexBooks);

      const result = await service.getCatalog();

      expect(result[0]).toEqual({
        id: 'book-1',
        sku: 'COMPLEX-001',
        title: 'Complex Book',
        author: 'Complex Author',
        copiesTotal: 5,
        copiesInUse: 3, // Apenas empréstimos ativos
        copiesAvailable: 2,
        isAvailable: true,
      });
    });
  });
});
