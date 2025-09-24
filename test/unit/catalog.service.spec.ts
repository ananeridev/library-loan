import { describe, it, beforeEach, assert } from 'poku';
import { CatalogService } from '../../src/catalog/catalog.service';
import { LoanStatus } from '@prisma/client';
import {
  MockPrismaService,
  BookBuilder,
  TestScenarios,
  AVAILABILITY_TEST_CASES,
  createBookWithAvailability,
  validateBookAvailabilityInvariants,
} from '../shared/mocks';

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: MockPrismaService;

  beforeEach(() => {
    prisma = new MockPrismaService();
    service = new CatalogService(prisma as any);
  });

  describe('Service Initialization', () => {
    it('should be properly initialized', () => {
      assert(!!service, 'CatalogService should exist');
      assert(
        typeof service.getCatalog === 'function',
        'getCatalog method should exist',
      );
    });
  });

  describe('Prisma Integration', () => {
    it('should call Prisma with correct query structure', async () => {
      // Arrange
      prisma.expectArgs((args) => {
        if (!args?.include?.loans?.where) {
          throw new Error('Expected include.loans.where to be present');
        }
        if (args.include.loans.where.status !== LoanStatus.ACTIVE) {
          throw new Error('Expected loans.where.status to be ACTIVE');
        }
      });

      prisma.setBooks([]);

      // Act & Assert
      await service.getCatalog(); // Will throw if contract is violated
    });
  });

  describe('Empty Catalog Scenarios', () => {
    it('should return empty array when no books exist', async () => {
      // Arrange
      prisma.setBooks([]);

      // Act
      const result = await service.getCatalog();

      // Assert
      assert(Array.isArray(result), 'Result should be an array');
      assert(result.length === 0, 'Should return empty array');
    });
  });

  describe('Availability Calculation', () => {
    it('should calculate availability correctly for all scenarios', async () => {
      for (const testCase of AVAILABILITY_TEST_CASES) {
        // Arrange
        const book = BookBuilder.create()
          .withId(`book-${testCase.name}`)
          .withSku(`SKU-${testCase.name}`)
          .withTitle(`Title ${testCase.name}`)
          .withAuthor(`Author ${testCase.name}`)
          .withCopiesTotal(testCase.copiesTotal)
          .withActiveLoans(testCase.activeLoans)
          .build();

        prisma.setBooks([book]);

        // Act
        const [result] = await service.getCatalog();

        // Assert
        assert(
          result.copiesTotal === testCase.copiesTotal,
          `[${testCase.name}] copiesTotal`,
        );
        assert(
          result.copiesInUse === testCase.activeLoans,
          `[${testCase.name}] copiesInUse`,
        );
        assert(
          result.copiesAvailable === testCase.expectedAvailable,
          `[${testCase.name}] copiesAvailable`,
        );
        assert(
          result.isAvailable === testCase.expectedIsAvailable,
          `[${testCase.name}] isAvailable`,
        );

        // Validate business invariants
        assert(
          validateBookAvailabilityInvariants(result),
          `[${testCase.name}] business invariants should hold`,
        );
      }
    });

    it('should handle books with no active loans', async () => {
      // Arrange
      const book = TestScenarios.BOOKS.CLEAN_CODE;
      prisma.setBooks([book]);

      // Act
      const [result] = await service.getCatalog();

      // Assert
      const expected = createBookWithAvailability(book, 0);
      assert(
        result.copiesTotal === expected.copiesTotal,
        'Should have correct total copies',
      );
      assert(
        result.copiesInUse === expected.copiesInUse,
        'Should have zero copies in use',
      );
      assert(
        result.copiesAvailable === expected.copiesAvailable,
        'Should have all copies available',
      );
      assert(
        result.isAvailable === expected.isAvailable,
        'Should be available',
      );
    });

    it('should handle books with all copies in use', async () => {
      // Arrange
      const book = TestScenarios.BOOKS.OUT_OF_STOCK;
      prisma.setBooks([book]);

      // Act
      const [result] = await service.getCatalog();

      // Assert
      const expected = createBookWithAvailability(book, book.loans.length);
      assert(
        result.copiesTotal === expected.copiesTotal,
        'Should have correct total copies',
      );
      assert(
        result.copiesInUse === expected.copiesInUse,
        'Should have all copies in use',
      );
      assert(
        result.copiesAvailable === expected.copiesAvailable,
        'Should have zero copies available',
      );
      assert(
        result.isAvailable === expected.isAvailable,
        'Should not be available',
      );
    });
  });

  describe('Data Filtering', () => {
    it('should only count ACTIVE loans in availability calculation', async () => {
      // Arrange
      const book = BookBuilder.create()
        .withCopiesTotal(3)
        .withLoans([
          { id: 'l1', status: LoanStatus.ACTIVE },
          { id: 'l2', status: LoanStatus.ACTIVE },
          { id: 'l3', status: LoanStatus.RETURNED }, // Should be filtered out by Prisma
        ])
        .build();

      // Simulate Prisma filtering (only ACTIVE loans returned)
      const filteredBook = {
        ...book,
        loans: book.loans.filter((l) => l.status === LoanStatus.ACTIVE),
      };

      prisma.setBooks([filteredBook]);

      // Act
      const [result] = await service.getCatalog();

      // Assert
      assert(result.copiesInUse === 2, 'Should count only ACTIVE loans');
      assert(
        result.copiesAvailable === 1,
        'Should calculate available copies correctly',
      );
      assert(result.isAvailable === true, 'Should be available');
    });
  });

  describe('Data Integrity', () => {
    it('should not mutate input data', async () => {
      // Arrange
      const originalBook = BookBuilder.create()
        .withCopiesTotal(2)
        .withActiveLoans(1)
        .build();

      const snapshot = JSON.parse(JSON.stringify(originalBook));
      prisma.setBooks([originalBook]);

      // Act
      await service.getCatalog();

      // Assert
      assert(
        JSON.stringify(originalBook) === JSON.stringify(snapshot),
        'Input data should remain unchanged',
      );
    });

    it('should return only public fields', async () => {
      // Arrange
      const book = BookBuilder.create()
        .withCopiesTotal(2)
        .withActiveLoans(1)
        .build();

      prisma.setBooks([book]);

      // Act
      const [result] = await service.getCatalog();

      // Assert
      const expectedKeys = [
        'id',
        'sku',
        'title',
        'author',
        'copiesTotal',
        'copiesInUse',
        'copiesAvailable',
        'isAvailable',
      ].sort();

      const actualKeys = Object.keys(result).sort();

      assert(
        JSON.stringify(actualKeys) === JSON.stringify(expectedKeys),
        'Should expose only public fields',
      );

      // Verify internal fields are not exposed
      assert(
        (result as any).createdAt === undefined,
        'Should not expose createdAt',
      );
      assert(
        (result as any).updatedAt === undefined,
        'Should not expose updatedAt',
      );
      assert(
        (result as any).loans === undefined,
        'Should not expose loans array',
      );
    });

    it('should maintain data type integrity', async () => {
      // Arrange
      const book = BookBuilder.create()
        .withCopiesTotal(2)
        .withActiveLoans(1)
        .build();

      prisma.setBooks([book]);

      // Act
      const [result] = await service.getCatalog();

      // Assert
      assert(typeof result.id === 'string', 'id should be string');
      assert(typeof result.sku === 'string', 'sku should be string');
      assert(typeof result.title === 'string', 'title should be string');
      assert(typeof result.author === 'string', 'author should be string');
      assert(
        typeof result.copiesTotal === 'number',
        'copiesTotal should be number',
      );
      assert(
        typeof result.copiesInUse === 'number',
        'copiesInUse should be number',
      );
      assert(
        typeof result.copiesAvailable === 'number',
        'copiesAvailable should be number',
      );
      assert(
        typeof result.isAvailable === 'boolean',
        'isAvailable should be boolean',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero copies total', async () => {
      // Arrange
      const book = BookBuilder.create()
        .withCopiesTotal(0)
        .withActiveLoans(0)
        .build();

      prisma.setBooks([book]);

      // Act
      const [result] = await service.getCatalog();

      // Assert
      assert(result.copiesTotal === 0, 'Should have zero total copies');
      assert(result.copiesInUse === 0, 'Should have zero copies in use');
      assert(result.copiesAvailable === 0, 'Should have zero copies available');
      assert(result.isAvailable === false, 'Should not be available');
    });
  });
});
