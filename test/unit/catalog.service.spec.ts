import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from '../../src/catalog/catalog.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

describe('CatalogService', () => {
  let service: CatalogService;
  let prismaService: PrismaService;

  const mockBooks = [
    {
      id: 'book-1',
      sku: 'TEST-001',
      title: 'Test Book 1',
      author: 'Test Author 1',
      copiesTotal: 3,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      loans: [
        { id: 'loan-1', status: LoanStatus.ACTIVE },
        { id: 'loan-2', status: LoanStatus.ACTIVE },
      ],
    },
    {
      id: 'book-2',
      sku: 'TEST-002',
      title: 'Test Book 2',
      author: 'Test Author 2',
      copiesTotal: 2,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      loans: [{ id: 'loan-3', status: LoanStatus.ACTIVE }],
    },
    {
      id: 'book-3',
      sku: 'TEST-003',
      title: 'Test Book 3',
      author: 'Test Author 3',
      copiesTotal: 1,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      loans: [{ id: 'loan-4', status: LoanStatus.ACTIVE }],
    },
    {
      id: 'book-4',
      sku: 'TEST-004',
      title: 'Test Book 4',
      author: 'Test Author 4',
      copiesTotal: 2,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      loans: [],
    },
    {
      id: 'book-5',
      sku: 'TEST-005',
      title: 'Test Book 5',
      author: 'Test Author 5',
      copiesTotal: 1,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      loans: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCatalog', () => {
    it('should return catalog with correct availability calculations', async () => {
      jest.spyOn(prismaService.book, 'findMany').mockResolvedValue(mockBooks);

      const result = await service.getCatalog();

      expect(prismaService.book.findMany).toHaveBeenCalledWith({
        include: {
          loans: {
            where: { status: LoanStatus.ACTIVE },
          },
        },
      });

      expect(result).toHaveLength(5);

      expect(result[0]).toEqual({
        id: 'book-1',
        sku: 'TEST-001',
        title: 'Test Book 1',
        author: 'Test Author 1',
        copiesTotal: 3,
        copiesInUse: 2,
        copiesAvailable: 1,
        isAvailable: true,
      });

      expect(result[1]).toEqual({
        id: 'book-2',
        sku: 'TEST-002',
        title: 'Test Book 2',
        author: 'Test Author 2',
        copiesTotal: 2,
        copiesInUse: 1,
        copiesAvailable: 1,
        isAvailable: true,
      });

      expect(result[2]).toEqual({
        id: 'book-3',
        sku: 'TEST-003',
        title: 'Test Book 3',
        author: 'Test Author 3',
        copiesTotal: 1,
        copiesInUse: 1,
        copiesAvailable: 0,
        isAvailable: false,
      });

      expect(result[3]).toEqual({
        id: 'book-4',
        sku: 'TEST-004',
        title: 'Test Book 4',
        author: 'Test Author 4',
        copiesTotal: 2,
        copiesInUse: 0,
        copiesAvailable: 2,
        isAvailable: true,
      });

      expect(result[4]).toEqual({
        id: 'book-5',
        sku: 'TEST-005',
        title: 'Test Book 5',
        author: 'Test Author 5',
        copiesTotal: 1,
        copiesInUse: 0,
        copiesAvailable: 1,
        isAvailable: true,
      });
    });

    it('should handle empty catalog', async () => {
      jest.spyOn(prismaService.book, 'findMany').mockResolvedValue([]);

      const result = await service.getCatalog();

      expect(result).toEqual([]);
    });

    it('should handle books with no loans', async () => {
      const booksWithoutLoans = [
        {
          id: 'book-1',
          sku: 'TEST-001',
          title: 'Test Book 1',
          author: 'Test Author 1',
          copiesTotal: 2,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          loans: [],
        },
      ];

      jest
        .spyOn(prismaService.book, 'findMany')
        .mockResolvedValue(booksWithoutLoans);

      const result = await service.getCatalog();

      expect(result[0]).toEqual({
        id: 'book-1',
        sku: 'TEST-001',
        title: 'Test Book 1',
        author: 'Test Author 1',
        copiesTotal: 2,
        copiesInUse: 0,
        copiesAvailable: 2,
        isAvailable: true,
      });
    });

    it('should handle books with all copies in use', async () => {
      const fullyBorrowedBook = [
        {
          id: 'book-1',
          sku: 'TEST-001',
          title: 'Test Book 1',
          author: 'Test Author 1',
          copiesTotal: 2,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          loans: [
            { id: 'loan-1', status: LoanStatus.ACTIVE },
            { id: 'loan-2', status: LoanStatus.ACTIVE },
          ],
        },
      ];

      jest
        .spyOn(prismaService.book, 'findMany')
        .mockResolvedValue(fullyBorrowedBook);

      const result = await service.getCatalog();

      expect(result[0]).toEqual({
        id: 'book-1',
        sku: 'TEST-001',
        title: 'Test Book 1',
        author: 'Test Author 1',
        copiesTotal: 2,
        copiesInUse: 2,
        copiesAvailable: 0,
        isAvailable: false,
      });
    });

    it('should filter only ACTIVE loans correctly', async () => {
      const bookWithMixedLoanStatuses = [
        {
          id: 'book-1',
          sku: 'TEST-001',
          title: 'Test Book 1',
          author: 'Test Author 1',
          copiesTotal: 3,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          loans: [
            { id: 'loan-1', status: LoanStatus.ACTIVE },
            { id: 'loan-3', status: LoanStatus.ACTIVE },
          ],
        },
      ];

      jest
        .spyOn(prismaService.book, 'findMany')
        .mockResolvedValue(bookWithMixedLoanStatuses);

      const result = await service.getCatalog();

      expect(result[0]).toEqual({
        id: 'book-1',
        sku: 'TEST-001',
        title: 'Test Book 1',
        author: 'Test Author 1',
        copiesTotal: 3,
        copiesInUse: 2,
        copiesAvailable: 1,
        isAvailable: true,
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      jest.spyOn(prismaService.book, 'findMany').mockRejectedValue(error);

      await expect(service.getCatalog()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle edge case with zero copies total', async () => {
      const bookWithZeroCopies = [
        {
          id: 'book-1',
          sku: 'TEST-001',
          title: 'Test Book 1',
          author: 'Test Author 1',
          copiesTotal: 0,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          loans: [],
        },
      ];

      jest
        .spyOn(prismaService.book, 'findMany')
        .mockResolvedValue(bookWithZeroCopies);

      const result = await service.getCatalog();

      expect(result[0]).toEqual({
        id: 'book-1',
        sku: 'TEST-001',
        title: 'Test Book 1',
        author: 'Test Author 1',
        copiesTotal: 0,
        copiesInUse: 0,
        copiesAvailable: 0,
        isAvailable: false,
      });
    });
  });
});
