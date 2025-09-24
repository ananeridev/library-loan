import { describe, it, beforeEach, assert } from 'poku';
import { CatalogService } from '../../src/catalog/catalog.service';
import { LoanStatus } from '@prisma/client';

class MockPrismaService {
  _books: any[] = [];
  book = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    findMany: async (_args?: unknown) => this._books,
  };
  setBooks(books: any[]) {
    this._books = books;
  }
}

describe('CatalogService (business rules only)', function () {
  let service: CatalogService;
  let prisma: MockPrismaService;

  beforeEach(function () {
    prisma = new MockPrismaService();
    service = new CatalogService(prisma as any);
  });

  it('returns [] when there are no books', async function () {
    prisma.setBooks([]);

    const res = await service.getCatalog();

    assert(Array.isArray(res), 'result is array');
    assert(res.length === 0, 'empty');
  });

  it('computes availability from ACTIVE loans (table-driven)', async function () {
    const cases = [
      { total: 3, active: 0, available: 3, isAvailable: true },
      { total: 3, active: 2, available: 1, isAvailable: true },
      { total: 1, active: 1, available: 0, isAvailable: false },
      { total: 0, active: 0, available: 0, isAvailable: false },
    ];

    for (const c of cases) {
      const loans = Array.from({ length: c.active }, (_, i) => ({
        id: `l-${i}`,
        status: LoanStatus.ACTIVE,
      }));
      const book = {
        id: 'b',
        sku: 'S',
        title: 'T',
        author: 'A',
        copiesTotal: c.total,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        loans,
      };
      prisma.setBooks([book]);

      const [row] = await service.getCatalog();

      assert(row.copiesTotal === c.total, 'copiesTotal');
      assert(row.copiesInUse === c.active, 'copiesInUse');
      assert(row.copiesAvailable === c.available, 'copiesAvailable');
      assert(row.isAvailable === c.isAvailable, 'isAvailable');
      assert(
        row.copiesInUse + row.copiesAvailable === row.copiesTotal,
        'invariant: inUse + available === total',
      );
    }
  });

  it('does not mutate input and exposes only public fields', async function () {
    const book = {
      id: 'b',
      sku: 'S',
      title: 'T',
      author: 'A',
      copiesTotal: 2,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      loans: [{ id: 'l-1', status: LoanStatus.ACTIVE }],
    };
    const snapshot = JSON.stringify(book);
    prisma.setBooks([book]);

    const [row] = await service.getCatalog();

    // no mutation
    assert(JSON.stringify(book) === snapshot, 'no mutation');

    // public shape only
    const expected = [
      'id',
      'sku',
      'title',
      'author',
      'copiesTotal',
      'copiesInUse',
      'copiesAvailable',
      'isAvailable',
    ].sort();
    const actual = Object.keys(row).sort();
    assert(JSON.stringify(actual) === JSON.stringify(expected), 'shape');

    assert((row as any).createdAt === undefined, 'no createdAt');
    assert((row as any).updatedAt === undefined, 'no updatedAt');
    assert((row as any).loans === undefined, 'no loans array');
  });
});
