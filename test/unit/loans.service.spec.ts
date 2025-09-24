import { describe, it, beforeEach, assert } from 'poku';
import { LoansService } from '../../src/loans/loans.service';
import { CreateLoanDto } from '../../src/loans/dto/create-loan.dto';
import { LoanStatus } from '@prisma/client';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LoansRepository } from 'src/loans/repositories/loans.repository';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('LoansService (business rules only)', function () {
  let service: LoansService;
  let repo: LoansRepository;
  let mockPrisma: any;

  const userId = 'u-1';
  const dto: CreateLoanDto = { sku: 'S-1' };

  beforeEach(function () {
    mockPrisma = {
      book: {
        findUnique: () => Promise.resolve(null),
      },
      loan: {
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        findUnique: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
      },
      user: {
        findUnique: () => Promise.resolve(null),
      },
    };

    const prismaService = Object.assign(mockPrisma, {
      onModuleInit: () => Promise.resolve(),
      onModuleDestroy: () => Promise.resolve(),
    }) as unknown as PrismaService;

    repo = new LoansRepository(prismaService);
    service = new LoansService(repo);
  });

  it('creates a loan when stock is available and user is under limit', async function () {
    mockPrisma.book.findUnique = () =>
      Promise.resolve({
        id: 'b-1',
        sku: dto.sku,
        title: 'T',
        author: 'A',
        copiesTotal: 2,
        loans: [{ id: 'l-existing' }],
      });

    mockPrisma.loan.count = () => Promise.resolve(1);

    mockPrisma.user.findUnique = () =>
      Promise.resolve({
        id: 'db-u-1',
        userId,
      });

    const created = {
      id: 'l-1',
      userId: 'db-u-1',
      bookId: 'b-1',
      loanDate: new Date('2024-01-01'),
      returnDate: null,
      status: LoanStatus.ACTIVE,
      book: { sku: dto.sku, title: 'T', author: 'A' },
      user: { userId },
    };
    mockPrisma.loan.create = () => Promise.resolve(created);

    const res = await service.createLoan(dto, userId);

    assert(res.status === LoanStatus.ACTIVE, 'status ACTIVE');
    assert(typeof res.id === 'string', 'id is string');
    assert(res.sku === created.book.sku, 'sku matches source');
  });

  it('throws NotFound when book does not exist', async function () {
    mockPrisma.book.findUnique = () => Promise.resolve(null);

    try {
      await service.createLoan(dto, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof NotFoundException, 'NotFoundException');
      assert(e.getStatus() === 404, 'status 404');
    }
  });

  it('throws Conflict when book is out of stock', async function () {
    mockPrisma.book.findUnique = () =>
      Promise.resolve({
        id: 'b-1',
        sku: dto.sku,
        title: 'T',
        author: 'A',
        copiesTotal: 2,
        loans: [{ id: 'l-1' }, { id: 'l-2' }],
      });

    try {
      await service.createLoan(dto, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof ConflictException, 'ConflictException');
      assert(e.getStatus() === 409, 'status 409');
    }
  });

  it('throws Conflict when user reached max active loans (2)', async function () {
    mockPrisma.book.findUnique = () =>
      Promise.resolve({
        id: 'b-1',
        sku: dto.sku,
        title: 'T',
        author: 'A',
        copiesTotal: 1,
        loans: [],
      });

    mockPrisma.loan.count = () => Promise.resolve(2);

    try {
      await service.createLoan(dto, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof ConflictException, 'ConflictException');
      assert(e.getStatus() === 409, 'status 409');
    }
  });

  it('throws NotFound when user does not exist', async function () {
    mockPrisma.book.findUnique = () =>
      Promise.resolve({
        id: 'b-1',
        sku: dto.sku,
        title: 'T',
        author: 'A',
        copiesTotal: 1,
        loans: [],
      });

    mockPrisma.loan.count = () => Promise.resolve(0);

    mockPrisma.user.findUnique = () => Promise.resolve(null);

    try {
      await service.createLoan(dto, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof NotFoundException, 'NotFoundException');
      assert(e.getStatus() === 404, 'status 404');
    }
  });

  it('returns a loan when owner matches and status is ACTIVE', async function () {
    const active = {
      id: 'l-1',
      userId: 'db-u-1',
      bookId: 'b-1',
      loanDate: new Date('2024-01-01'),
      returnDate: null,
      status: LoanStatus.ACTIVE,
      book: { sku: 'S-1', title: 'T', author: 'A' },
      user: { userId },
    };
    const returned = {
      ...active,
      status: LoanStatus.RETURNED,
      returnDate: new Date('2024-01-02'),
    };

    mockPrisma.loan.findUnique = () => Promise.resolve(active);
    mockPrisma.loan.update = () => Promise.resolve(returned);

    const res = await service.returnLoan(active.id, userId);

    assert(res.status === LoanStatus.RETURNED, 'status RETURNED');
    assert(res.returnDate instanceof Date, 'has returnDate');
  });

  it('throws NotFound when loan does not exist', async function () {
    mockPrisma.loan.findUnique = () => Promise.resolve(null);

    try {
      await service.returnLoan('l-x', userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof NotFoundException, 'NotFoundException');
      assert(e.getStatus() === 404, 'status 404');
    }
  });

  it('throws BadRequest when loan belongs to another user', async function () {
    const other = {
      id: 'l-1',
      userId: 'db-u-2',
      bookId: 'b-1',
      loanDate: new Date(),
      returnDate: null,
      status: LoanStatus.ACTIVE,
      book: { sku: 'S-1', title: 'T', author: 'A' },
      user: { userId: 'someone-else' },
    };

    mockPrisma.loan.findUnique = () => Promise.resolve(other);

    try {
      await service.returnLoan(other.id, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof BadRequestException, 'BadRequestException');
      assert(e.getStatus() === 400, 'status 400');
    }
  });

  it('throws Conflict when loan is already RETURNED', async function () {
    const already = {
      id: 'l-1',
      userId: 'db-u-1',
      bookId: 'b-1',
      loanDate: new Date(),
      returnDate: new Date(),
      status: LoanStatus.RETURNED,
      book: { sku: 'S-1', title: 'T', author: 'A' },
      user: { userId },
    };

    mockPrisma.loan.findUnique = () => Promise.resolve(already);

    try {
      await service.returnLoan(already.id, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof ConflictException, 'ConflictException');
      assert(e.getStatus() === 409, 'status 409');
    }
  });
});
