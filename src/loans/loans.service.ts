import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanStatus } from '@prisma/client';
import { LoansRepository } from './repositories/loans.repository';

@Injectable()
export class LoansService {
  constructor(private loansRepository: LoansRepository) {}

  async createLoan(createLoanDto: CreateLoanDto, userId: string) {
    const { sku } = createLoanDto;

    const book = await this.loansRepository.findBookBySkuWithActiveLoans(sku);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.activeLoansCount >= book.copiesTotal) {
      throw new ConflictException('Book not available - out of stock');
    }

    const userActiveLoans =
      await this.loansRepository.countUserActiveLoans(userId);
    if (userActiveLoans >= 2) {
      throw new ConflictException('User already has maximum of 2 active loans');
    }

    const user = await this.loansRepository.findUserByUserId(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const loan = await this.loansRepository.createLoan(user.id, book.id);

    return {
      id: loan.id,
      sku: loan.book.sku,
      title: loan.book.title,
      author: loan.book.author,
      userId: loan.user.userId,
      loanDate: loan.loanDate,
      status: loan.status,
    };
  }

  async returnLoan(loanId: string, userId: string) {
    const loan = await this.loansRepository.findLoanByIdWithDetails(loanId);
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.user.userId !== userId) {
      throw new BadRequestException('Loan does not belong to user');
    }

    if (loan.status === LoanStatus.RETURNED) {
      throw new ConflictException('Loan already returned');
    }

    const updatedLoan = await this.loansRepository.updateLoanToReturned(loanId);

    return {
      id: updatedLoan.id,
      sku: updatedLoan.book.sku,
      title: updatedLoan.book.title,
      author: updatedLoan.book.author,
      userId: updatedLoan.user.userId,
      loanDate: updatedLoan.loanDate,
      returnDate: updatedLoan.returnDate,
      status: updatedLoan.status,
    };
  }
}
