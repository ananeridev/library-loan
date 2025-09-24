import { describe, it, beforeEach, assert } from 'poku';
import { LoansService } from '../../src/loans/loans.service';
import { CreateLoanDto } from '../../src/loans/dto/create-loan.dto';
import { LoanStatus } from '@prisma/client';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  MockLoansRepository,
  BookBuilder,
  LoanBuilder,
  TestScenarios,
} from '../shared/mocks';

describe('LoansService', () => {
  let service: LoansService;
  let repository: MockLoansRepository;

  beforeEach(() => {
    repository = new MockLoansRepository();
    service = new LoansService(repository as any);
  });

  describe('Service Initialization', () => {
    it('should be properly initialized', () => {
      assert(!!service, 'LoansService should exist');
    });
  });

  describe('createLoan', () => {
    const createLoanDto: CreateLoanDto = { sku: 'TEST-001' };
    const userId = 'test-user';

    describe('Success Scenarios', () => {
      it('should create a loan successfully when all conditions are met', async () => {
        // Arrange
        const book = BookBuilder.create()
          .withId('book-1')
          .withSku('TEST-001')
          .withCopiesTotal(2)
          .withActiveLoans(1) // 1 copy available
          .build();

        const user = TestScenarios.USERS.TEST_USER;
        const loan = LoanBuilder.create()
          .withId('loan-1')
          .withUserId('user-1')
          .withBookId('book-1')
          .withStatus(LoanStatus.ACTIVE)
          .withBook({
            sku: 'TEST-001',
            title: 'Test Book',
            author: 'Test Author',
          })
          .withUser({ userId: 'test-user' })
          .build();

        repository.setBook(book);
        repository.setUserActiveLoans(1); // User has 1 active loan (under limit)
        repository.setUser(user);
        repository.setCreatedLoan(loan);

        // Act
        const result = await service.createLoan(createLoanDto, userId);

        // Assert
        assert(result !== undefined, 'Result should be defined');
        assert(result.id === 'loan-1', 'Should return correct loan id');
        assert(result.sku === 'TEST-001', 'Should return correct book sku');
        assert(
          result.title === 'Test Book',
          'Should return correct book title',
        );
        assert(
          result.author === 'Test Author',
          'Should return correct book author',
        );
        assert(result.userId === 'test-user', 'Should return correct user id');
        assert(
          result.loanDate instanceof Date,
          'Should return loan date as Date',
        );
        assert(
          result.status === LoanStatus.ACTIVE,
          'Should return correct loan status',
        );
      });

      it('should create loan when user has zero active loans', async () => {
        // Arrange
        const book = BookBuilder.create()
          .withCopiesTotal(1)
          .withActiveLoans(0)
          .build();

        const user = TestScenarios.USERS.TEST_USER;
        const loan = TestScenarios.LOANS.ACTIVE_LOAN;

        repository.setBook(book);
        repository.setUserActiveLoans(0);
        repository.setUser(user);
        repository.setCreatedLoan(loan);

        // Act
        const result = await service.createLoan(createLoanDto, userId);

        // Assert
        assert(result !== undefined, 'Should create loan successfully');
        assert(
          result.status === LoanStatus.ACTIVE,
          'Should have ACTIVE status',
        );
      });
    });

    describe('Book Validation Errors', () => {
      it('should throw NotFoundException when book is not found', async () => {
        // Arrange
        repository.setBook(null);

        // Act & Assert
        let caughtError: Error | null = null;
        try {
          await service.createLoan(createLoanDto, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(caughtError !== null, 'Should have thrown an error');
        assert(
          caughtError instanceof NotFoundException,
          'Should throw NotFoundException',
        );
        assert(
          caughtError.message === 'Book not found',
          'Should throw correct error message',
        );
      });

      it('should throw ConflictException when book is out of stock', async () => {
        // Arrange
        const outOfStockBook = BookBuilder.create()
          .withCopiesTotal(2)
          .withActiveLoans(2) // All copies are loaned
          .build();

        repository.setBook(outOfStockBook);

        // Act & Assert
        let caughtError: Error | null = null;
        try {
          await service.createLoan(createLoanDto, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(caughtError !== null, 'Should have thrown an error');
        assert(
          caughtError instanceof ConflictException,
          'Should throw ConflictException',
        );
        assert(
          caughtError.message === 'Book not available - out of stock',
          'Should throw correct error message',
        );
      });
    });

    describe('User Validation Errors', () => {
      it('should throw ConflictException when user has maximum active loans', async () => {
        // Arrange
        const book = BookBuilder.create()
          .withCopiesTotal(2)
          .withActiveLoans(1)
          .build();

        repository.setBook(book);
        repository.setUserActiveLoans(2); // Maximum allowed

        // Act & Assert
        let caughtError: Error | null = null;
        try {
          await service.createLoan(createLoanDto, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(caughtError !== null, 'Should have thrown an error');
        assert(
          caughtError instanceof ConflictException,
          'Should throw ConflictException',
        );
        assert(
          caughtError.message === 'User already has maximum of 2 active loans',
          'Should throw correct error message',
        );
      });

      it('should throw NotFoundException when user is not found', async () => {
        // Arrange
        const book = BookBuilder.create()
          .withCopiesTotal(2)
          .withActiveLoans(1)
          .build();

        repository.setBook(book);
        repository.setUserActiveLoans(1);
        repository.setUser(null);

        // Act & Assert
        let caughtError: Error | null = null;
        try {
          await service.createLoan(createLoanDto, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(caughtError !== null, 'Should have thrown an error');
        assert(
          caughtError instanceof NotFoundException,
          'Should throw NotFoundException',
        );
        assert(
          caughtError.message === 'User not found',
          'Should throw correct error message',
        );
      });
    });

    describe('Business Rule Validation', () => {
      it('should enforce maximum loan limit boundary conditions', async () => {
        // Test with exactly 2 active loans (should fail)
        const book = BookBuilder.create()
          .withCopiesTotal(1)
          .withActiveLoans(0)
          .build();

        repository.setBook(book);
        repository.setUserActiveLoans(2);

        let caughtError: Error | null = null;
        try {
          await service.createLoan(createLoanDto, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(
          caughtError instanceof ConflictException,
          'Should reject at maximum limit',
        );

        // Test with 1 active loan (should succeed)
        const book2 = BookBuilder.create()
          .withCopiesTotal(1)
          .withActiveLoans(0)
          .build();

        repository.setBook(book2);
        repository.setUserActiveLoans(1);
        repository.setUser(TestScenarios.USERS.TEST_USER);
        repository.setCreatedLoan(TestScenarios.LOANS.ACTIVE_LOAN);

        const result = await service.createLoan(createLoanDto, userId);
        assert(result !== undefined, 'Should allow under maximum limit');
      });
    });
  });

  describe('returnLoan', () => {
    const loanId = 'loan-1';
    const userId = 'test-user';

    describe('Success Scenarios', () => {
      it('should return a loan successfully when all conditions are met', async () => {
        // Arrange
        const activeLoan = LoanBuilder.create()
          .withId('loan-1')
          .withUserId('user-1')
          .withBookId('book-1')
          .withStatus(LoanStatus.ACTIVE)
          .withReturnDate(null)
          .withBook({
            sku: 'TEST-001',
            title: 'Test Book',
            author: 'Test Author',
          })
          .withUser({ userId: 'test-user' })
          .build();

        const returnedLoan = LoanBuilder.create()
          .withId('loan-1')
          .withUserId('user-1')
          .withBookId('book-1')
          .withStatus(LoanStatus.RETURNED)
          .withReturnDate(new Date('2023-01-02'))
          .withBook({
            sku: 'TEST-001',
            title: 'Test Book',
            author: 'Test Author',
          })
          .withUser({ userId: 'test-user' })
          .build();

        repository.setLoan(activeLoan);
        repository.setUpdatedLoan(returnedLoan);

        // Act
        const result = await service.returnLoan(loanId, userId);

        // Assert
        assert(result !== undefined, 'Result should be defined');
        assert(result.id === returnedLoan.id, 'Should return correct loan id');
        assert(
          result.sku === returnedLoan.book.sku,
          'Should return correct book sku',
        );
        assert(
          result.title === returnedLoan.book.title,
          'Should return correct book title',
        );
        assert(
          result.author === returnedLoan.book.author,
          'Should return correct book author',
        );
        assert(
          result.userId === returnedLoan.user.userId,
          'Should return correct user id',
        );
        assert(
          result.loanDate instanceof Date,
          'Should return loan date as Date',
        );
        assert(
          result.returnDate instanceof Date,
          'Should return return date as Date',
        );
        assert(
          result.status === LoanStatus.RETURNED,
          'Should return correct loan status',
        );
      });
    });

    describe('Loan Validation Errors', () => {
      it('should throw NotFoundException when loan is not found', async () => {
        // Arrange
        repository.setLoan(null);

        // Act & Assert
        let caughtError: Error | null = null;
        try {
          await service.returnLoan(loanId, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(caughtError !== null, 'Should have thrown an error');
        assert(
          caughtError instanceof NotFoundException,
          'Should throw NotFoundException',
        );
        assert(
          caughtError.message === 'Loan not found',
          'Should throw correct error message',
        );
      });

      it('should throw BadRequestException when loan does not belong to user', async () => {
        // Arrange
        const otherUserLoan = LoanBuilder.create()
          .withUserId('user-2')
          .withUser({ userId: 'other-user' })
          .build();

        repository.setLoan(otherUserLoan);

        // Act & Assert
        let caughtError: Error | null = null;
        try {
          await service.returnLoan(loanId, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(caughtError !== null, 'Should have thrown an error');
        assert(
          caughtError instanceof BadRequestException,
          'Should throw BadRequestException',
        );
        assert(
          caughtError.message === 'Loan does not belong to user',
          'Should throw correct error message',
        );
      });

      it('should throw ConflictException when loan is already returned', async () => {
        // Arrange
        const alreadyReturnedLoan = LoanBuilder.create()
          .withStatus(LoanStatus.RETURNED)
          .withReturnDate(new Date('2023-01-02'))
          .withUser({ userId: 'test-user' })
          .build();

        repository.setLoan(alreadyReturnedLoan);

        // Act & Assert
        let caughtError: Error | null = null;
        try {
          await service.returnLoan(loanId, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(caughtError !== null, 'Should have thrown an error');
        assert(
          caughtError instanceof ConflictException,
          'Should throw ConflictException',
        );
        assert(
          caughtError.message === 'Loan already returned',
          'Should throw correct error message',
        );
      });
    });

    describe('Data Validation', () => {
      it('should validate return loan data structure', async () => {
        // Arrange
        const activeLoan = TestScenarios.LOANS.ACTIVE_LOAN;
        const returnedLoan = TestScenarios.LOANS.RETURNED_LOAN;

        repository.setLoan(activeLoan);
        repository.setUpdatedLoan(returnedLoan);

        // Act
        const result = await service.returnLoan(loanId, userId);

        // Assert
        assert(typeof result.id === 'string', 'Loan id should be string');
        assert(typeof result.sku === 'string', 'Book sku should be string');
        assert(typeof result.title === 'string', 'Book title should be string');
        assert(
          typeof result.author === 'string',
          'Book author should be string',
        );
        assert(typeof result.userId === 'string', 'User id should be string');
        assert(
          result.loanDate instanceof Date,
          'Loan date should be Date instance',
        );
        assert(
          result.returnDate instanceof Date,
          'Return date should be Date instance',
        );
        assert(
          result.status === LoanStatus.RETURNED,
          'Status should be RETURNED',
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle user ownership validation edge cases', async () => {
        // Test with exact user match (should succeed)
        const correctUserLoan = LoanBuilder.create()
          .withUser({ userId: 'test-user' })
          .build();

        repository.setLoan(correctUserLoan);
        repository.setUpdatedLoan(TestScenarios.LOANS.RETURNED_LOAN);

        const result = await service.returnLoan(loanId, 'test-user');
        assert(result !== undefined, 'Should succeed with correct user');

        // Test with different user (should fail)
        const differentUserLoan = LoanBuilder.create()
          .withUser({ userId: 'different-user' })
          .build();

        repository.setLoan(differentUserLoan);

        let caughtError: Error | null = null;
        try {
          await service.returnLoan(loanId, 'test-user');
        } catch (error) {
          caughtError = error as Error;
        }

        assert(
          caughtError instanceof BadRequestException,
          'Should fail with different user',
        );
      });

      it('should handle loan status validation edge cases', async () => {
        // Test with ACTIVE loan (should succeed)
        const activeLoan = TestScenarios.LOANS.ACTIVE_LOAN;
        repository.setLoan(activeLoan);
        repository.setUpdatedLoan(TestScenarios.LOANS.RETURNED_LOAN);

        const result = await service.returnLoan(loanId, userId);
        assert(result !== undefined, 'Should succeed with ACTIVE loan');

        // Test with already RETURNED loan (should fail)
        const returnedLoan = TestScenarios.LOANS.RETURNED_LOAN;
        repository.setLoan(returnedLoan);

        let caughtError: Error | null = null;
        try {
          await service.returnLoan(loanId, userId);
        } catch (error) {
          caughtError = error as Error;
        }

        assert(
          caughtError instanceof ConflictException,
          'Should fail with already returned loan',
        );
      });
    });
  });
});
