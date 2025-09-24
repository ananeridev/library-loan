import { describe, it, beforeEach, assert } from 'poku';
import { LoansService } from '../../src/loans/loans.service';
import { CreateLoanDto } from '../../src/loans/dto/create-loan.dto';
import { LoanStatus } from '@prisma/client';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MockLoansRepository } from '../shared/mocks';

describe('LoansService (business rules only)', function () {
  let service: LoansService;
  let repo: MockLoansRepository;

  const userId = 'u-1';
  const dto: CreateLoanDto = { sku: 'S-1' };

  beforeEach(function () {
    repo = new MockLoansRepository();
    service = new LoansService(repo as any);
  });

  it('creates a loan when stock is available and user is under limit', async function () {
    repo.setBook({ id: 'b-1', copiesTotal: 2, activeLoansCount: 1 });
    repo.setUserActiveLoans(1);
    repo.setUser({ id: 'db-u-1', userId });
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
    repo.setCreatedLoan(created);

    const res = await service.createLoan(dto, userId);

    assert(res.status === LoanStatus.ACTIVE, 'status ACTIVE');
    assert(typeof res.id === 'string', 'id is string');
    assert(res.sku === created.book.sku, 'sku matches source');
  });

  it('throws NotFound when book does not exist', async function () {
    repo.setBook(null);

    try {
      await service.createLoan(dto, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof NotFoundException, 'NotFoundException');
      assert(e.getStatus() === 404, 'status 404');
    }
  });

  it('throws Conflict when book is out of stock', async function () {
    repo.setBook({ id: 'b-1', copiesTotal: 2, activeLoansCount: 2 });

    try {
      await service.createLoan(dto, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof ConflictException, 'ConflictException');
      assert(e.getStatus() === 409, 'status 409');
    }
  });

  it('throws Conflict when user reached max active loans (2)', async function () {
    repo.setBook({ id: 'b-1', copiesTotal: 1, activeLoansCount: 0 });
    repo.setUserActiveLoans(2);

    try {
      await service.createLoan(dto, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof ConflictException, 'ConflictException');
      assert(e.getStatus() === 409, 'status 409');
    }
  });

  it('throws NotFound when user does not exist', async function () {
    repo.setBook({ id: 'b-1', copiesTotal: 1, activeLoansCount: 0 });
    repo.setUserActiveLoans(0);
    repo.setUser(null);

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
    repo.setLoan(active);
    repo.setUpdatedLoan(returned);

    const res = await service.returnLoan(active.id, userId);

    assert(res.status === LoanStatus.RETURNED, 'status RETURNED');
    assert(res.returnDate instanceof Date, 'has returnDate');
  });

  it('throws NotFound when loan does not exist', async function () {
    repo.setLoan(null);

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
    repo.setLoan(other);

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
    repo.setLoan(already);

    try {
      await service.returnLoan(already.id, userId);
      assert(false, 'should throw');
    } catch (e: any) {
      assert(e instanceof ConflictException, 'ConflictException');
      assert(e.getStatus() === 409, 'status 409');
    }
  });
});
