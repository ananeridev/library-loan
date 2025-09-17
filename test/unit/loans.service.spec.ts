import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from '../../src/loans/loans.service';
import { LoansRepository } from '../../src/loans/repositories/loans.repository';
import { CreateLoanDto } from '../../src/loans/dto/create-loan.dto';
import { LoanStatus } from '@prisma/client';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('LoansService', () => {
  let service: LoansService;
  let repository: LoansRepository;

  const mockBook = {
    id: 'book-1',
    sku: 'TEST-001',
    title: 'Test Book',
    author: 'Test Author',
    copiesTotal: 2,
    activeLoansCount: 1,
  };

  const mockUser = {
    id: 'user-1',
    userId: 'test-user',
  };

  const mockLoan = {
    id: 'loan-1',
    sku: 'TEST-001',
    title: 'Test Book',
    author: 'Test Author',
    userId: 'test-user',
    loanDate: new Date('2023-01-01'),
    status: LoanStatus.ACTIVE,
  };

  const mockLoanWithDetails = {
    id: 'loan-1',
    userId: 'user-1',
    bookId: 'book-1',
    loanDate: new Date('2023-01-01'),
    returnDate: null,
    status: LoanStatus.ACTIVE,
    book: {
      sku: 'TEST-001',
      title: 'Test Book',
      author: 'Test Author',
    },
    user: {
      userId: 'test-user',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: LoansRepository,
          useValue: {
            findBookBySkuWithActiveLoans: jest.fn(),
            countUserActiveLoans: jest.fn(),
            findUserByUserId: jest.fn(),
            createLoan: jest.fn(),
            findLoanByIdWithDetails: jest.fn(),
            updateLoanToReturned: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    repository = module.get<LoansRepository>(LoansRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLoan', () => {
    const createLoanDto: CreateLoanDto = { sku: 'TEST-001' };
    const userId = 'test-user';

    it('should create a loan successfully', async () => {
      jest
        .spyOn(repository, 'findBookBySkuWithActiveLoans')
        .mockResolvedValue(mockBook);
      jest.spyOn(repository, 'countUserActiveLoans').mockResolvedValue(1);
      jest.spyOn(repository, 'findUserByUserId').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'createLoan')
        .mockResolvedValue(mockLoanWithDetails);

      const result = await service.createLoan(createLoanDto, userId);

      expect(repository.findBookBySkuWithActiveLoans).toHaveBeenCalledWith(
        'TEST-001',
      );
      expect(repository.countUserActiveLoans).toHaveBeenCalledWith('test-user');
      expect(repository.findUserByUserId).toHaveBeenCalledWith('test-user');
      expect(repository.createLoan).toHaveBeenCalledWith('user-1', 'book-1');

      expect(result).toEqual(mockLoan);
    });

    it('should throw NotFoundException when book is not found', async () => {
      jest
        .spyOn(repository, 'findBookBySkuWithActiveLoans')
        .mockResolvedValue(null);

      await expect(service.createLoan(createLoanDto, userId)).rejects.toThrow(
        new NotFoundException('Book not found'),
      );
    });

    it('should throw ConflictException when book is out of stock', async () => {
      const outOfStockBook = { ...mockBook, activeLoansCount: 2 };
      jest
        .spyOn(repository, 'findBookBySkuWithActiveLoans')
        .mockResolvedValue(outOfStockBook);

      await expect(service.createLoan(createLoanDto, userId)).rejects.toThrow(
        new ConflictException('Book not available - out of stock'),
      );
    });

    it('should throw ConflictException when user has maximum active loans', async () => {
      jest
        .spyOn(repository, 'findBookBySkuWithActiveLoans')
        .mockResolvedValue(mockBook);
      jest.spyOn(repository, 'countUserActiveLoans').mockResolvedValue(2);

      await expect(service.createLoan(createLoanDto, userId)).rejects.toThrow(
        new ConflictException('User already has maximum of 2 active loans'),
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
      jest
        .spyOn(repository, 'findBookBySkuWithActiveLoans')
        .mockResolvedValue(mockBook);
      jest.spyOn(repository, 'countUserActiveLoans').mockResolvedValue(1);
      jest.spyOn(repository, 'findUserByUserId').mockResolvedValue(null);

      await expect(service.createLoan(createLoanDto, userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should handle edge case with zero active loans', async () => {
      const availableBook = { ...mockBook, activeLoansCount: 0 };
      jest
        .spyOn(repository, 'findBookBySkuWithActiveLoans')
        .mockResolvedValue(availableBook);
      jest.spyOn(repository, 'countUserActiveLoans').mockResolvedValue(0);
      jest.spyOn(repository, 'findUserByUserId').mockResolvedValue(mockUser);
      jest
        .spyOn(repository, 'createLoan')
        .mockResolvedValue(mockLoanWithDetails);

      const result = await service.createLoan(createLoanDto, userId);

      expect(result).toEqual(mockLoan);
    });
  });

  describe('returnLoan', () => {
    const loanId = 'loan-1';
    const userId = 'test-user';

    it('should return a loan successfully', async () => {
      const returnedLoan = {
        ...mockLoanWithDetails,
        status: LoanStatus.RETURNED,
        returnDate: new Date('2023-01-02'),
      };

      jest
        .spyOn(repository, 'findLoanByIdWithDetails')
        .mockResolvedValue(mockLoanWithDetails);
      jest
        .spyOn(repository, 'updateLoanToReturned')
        .mockResolvedValue(returnedLoan);

      const result = await service.returnLoan(loanId, userId);

      expect(repository.findLoanByIdWithDetails).toHaveBeenCalledWith(loanId);
      expect(repository.updateLoanToReturned).toHaveBeenCalledWith(loanId);

      expect(result).toEqual({
        id: returnedLoan.id,
        sku: returnedLoan.book.sku,
        title: returnedLoan.book.title,
        author: returnedLoan.book.author,
        userId: returnedLoan.user.userId,
        loanDate: returnedLoan.loanDate,
        returnDate: returnedLoan.returnDate,
        status: returnedLoan.status,
      });
    });

    it('should throw NotFoundException when loan is not found', async () => {
      jest.spyOn(repository, 'findLoanByIdWithDetails').mockResolvedValue(null);

      await expect(service.returnLoan(loanId, userId)).rejects.toThrow(
        new NotFoundException('Loan not found'),
      );
    });

    it('should throw BadRequestException when loan does not belong to user', async () => {
      const otherUserLoan = {
        ...mockLoanWithDetails,
        user: { userId: 'other-user' },
      };

      jest
        .spyOn(repository, 'findLoanByIdWithDetails')
        .mockResolvedValue(otherUserLoan);

      await expect(service.returnLoan(loanId, userId)).rejects.toThrow(
        new BadRequestException('Loan does not belong to user'),
      );
    });

    it('should throw ConflictException when loan is already returned', async () => {
      const alreadyReturnedLoan = {
        ...mockLoanWithDetails,
        status: LoanStatus.RETURNED,
      };

      jest
        .spyOn(repository, 'findLoanByIdWithDetails')
        .mockResolvedValue(alreadyReturnedLoan);

      await expect(service.returnLoan(loanId, userId)).rejects.toThrow(
        new ConflictException('Loan already returned'),
      );
    });
  });
});
