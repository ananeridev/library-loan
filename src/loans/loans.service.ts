import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async createLoan(createLoanDto: CreateLoanDto, userId: string) {
    const { sku } = createLoanDto;

    const book = await this.prisma.book.findUnique({
      where: { sku },
      include: {
        loans: {
          where: { status: LoanStatus.ACTIVE }
        }
      }
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const activeLoans = book.loans.length;
    if (activeLoans >= book.copiesTotal) {
      throw new ConflictException('Book not available - out of stock');
    }

    const userActiveLoans = await this.prisma.loan.count({
      where: {
        user: { userId },
        status: LoanStatus.ACTIVE
      }
    });

    if (userActiveLoans >= 2) {
      throw new ConflictException('User already has maximum of 2 active loans');
    }

    const user = await this.prisma.user.findUnique({
      where: { userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const loan = await this.prisma.loan.create({
      data: {
        userId: user.id,
        bookId: book.id,
        status: LoanStatus.ACTIVE
      },
      include: {
        book: {
          select: {
            sku: true,
            title: true,
            author: true
          }
        },
        user: {
          select: {
            userId: true
          }
        }
      }
    });

    return {
      id: loan.id,
      sku: loan.book.sku,
      title: loan.book.title,
      author: loan.book.author,
      userId: loan.user.userId,
      loanDate: loan.loanDate,
      status: loan.status
    };
  }

  async returnLoan(loanId: string, userId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        book: {
          select: {
            sku: true,
            title: true,
            author: true
          }
        }
      }
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.user.userId !== userId) {
      throw new BadRequestException('Loan does not belong to user');
    }

    if (loan.status === LoanStatus.RETURNED) {
      throw new ConflictException('Loan already returned');
    }

    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.RETURNED,
        returnDate: new Date()
      },
      include: {
        book: {
          select: {
            sku: true,
            title: true,
            author: true
          }
        },
        user: {
          select: {
            userId: true
          }
        }
      }
    });

    return {
      id: updatedLoan.id,
      sku: updatedLoan.book.sku,
      title: updatedLoan.book.title,
      author: updatedLoan.book.author,
      userId: updatedLoan.user.userId,
      loanDate: updatedLoan.loanDate,
      returnDate: updatedLoan.returnDate,
      status: updatedLoan.status
    };
  }
}
