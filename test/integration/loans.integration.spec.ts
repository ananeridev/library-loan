import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from '../../src/loans/loans.service';
import { LoansRepository } from '../../src/loans/repositories/loans.repository';
import { CreateLoanDto } from '../../src/loans/dto/create-loan.dto';
import { LoanStatus } from '@prisma/client';

describe('Loans Integration Tests', () => {
  let service: LoansService;
  let repository: LoansRepository;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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

  afterAll(async () => {
    await module.close();
  });

  describe('createLoan integration', () => {
    it('should integrate with repository correctly', async () => {
      const createLoanDto: CreateLoanDto = { sku: 'INTEGRATION-001' };
      const userId = 'integration-user';

      const mockBook = {
        id: 'book-1',
        sku: 'INTEGRATION-001',
        title: 'Integration Book',
        author: 'Integration Author',
        copiesTotal: 2,
        activeLoansCount: 1,
      };

      const mockUser = {
        id: 'user-1',
        userId: 'integration-user',
      };

      const mockLoan = {
        id: 'loan-1',
        userId: 'user-1',
        bookId: 'book-1',
        loanDate: new Date('2023-01-01'),
        returnDate: null,
        status: LoanStatus.ACTIVE,
        book: {
          sku: 'INTEGRATION-001',
          title: 'Integration Book',
          author: 'Integration Author',
        },
        user: {
          userId: 'integration-user',
        },
      };

      jest
        .spyOn(repository, 'findBookBySkuWithActiveLoans')
        .mockResolvedValue(mockBook);
      jest.spyOn(repository, 'countUserActiveLoans').mockResolvedValue(1);
      jest.spyOn(repository, 'findUserByUserId').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'createLoan').mockResolvedValue(mockLoan);

      const result = await service.createLoan(createLoanDto, userId);

      expect(repository.findBookBySkuWithActiveLoans).toHaveBeenCalledWith(
        'INTEGRATION-001',
      );
      expect(repository.countUserActiveLoans).toHaveBeenCalledWith(
        'integration-user',
      );
      expect(repository.findUserByUserId).toHaveBeenCalledWith(
        'integration-user',
      );
      expect(repository.createLoan).toHaveBeenCalledWith('user-1', 'book-1');

      expect(result).toEqual({
        id: 'loan-1',
        sku: 'INTEGRATION-001',
        title: 'Integration Book',
        author: 'Integration Author',
        userId: 'integration-user',
        loanDate: new Date('2023-01-01'),
        status: LoanStatus.ACTIVE,
      });
    });
  });

  describe('returnLoan integration', () => {
    it('should integrate with repository correctly', async () => {
      const loanId = 'loan-1';
      const userId = 'integration-user';

      const mockLoan = {
        id: 'loan-1',
        userId: 'user-1',
        bookId: 'book-1',
        loanDate: new Date('2023-01-01'),
        returnDate: null,
        status: LoanStatus.ACTIVE,
        book: {
          sku: 'INTEGRATION-001',
          title: 'Integration Book',
          author: 'Integration Author',
        },
        user: {
          userId: 'integration-user',
        },
      };

      const mockReturnedLoan = {
        ...mockLoan,
        status: LoanStatus.RETURNED,
        returnDate: new Date('2023-01-02'),
      };

      jest
        .spyOn(repository, 'findLoanByIdWithDetails')
        .mockResolvedValue(mockLoan);
      jest
        .spyOn(repository, 'updateLoanToReturned')
        .mockResolvedValue(mockReturnedLoan);

      const result = await service.returnLoan(loanId, userId);

      expect(repository.findLoanByIdWithDetails).toHaveBeenCalledWith(loanId);
      expect(repository.updateLoanToReturned).toHaveBeenCalledWith(loanId);

      expect(result).toEqual({
        id: 'loan-1',
        sku: 'INTEGRATION-001',
        title: 'Integration Book',
        author: 'Integration Author',
        userId: 'integration-user',
        loanDate: new Date('2023-01-01'),
        returnDate: new Date('2023-01-02'),
        status: LoanStatus.RETURNED,
      });
    });
  });
});
