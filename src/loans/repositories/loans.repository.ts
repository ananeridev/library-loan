import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

export interface BookWithActiveLoans {
  id: string;
  sku: string;
  title: string;
  author: string;
  copiesTotal: number;
  activeLoansCount: number;
}

export interface LoanWithDetails {
  id: string;
  userId: string;
  bookId: string;
  loanDate: Date;
  returnDate: Date | null;
  status: LoanStatus;
  book: {
    sku: string;
    title: string;
    author: string;
  };
  user: {
    userId: string;
  };
}

@Injectable()
export class LoansRepository {
  constructor(private prisma: PrismaService) {}

  async findBookBySkuWithActiveLoans(sku: string): Promise<BookWithActiveLoans | null> {
    const book = await this.prisma.book.findUnique({
      where: { sku },
      include: {
        loans: {
          where: { status: LoanStatus.ACTIVE }
        }
      }
    });

    if (!book) {
      return null;
    }

    return {
      id: book.id,
      sku: book.sku,
      title: book.title,
      author: book.author,
      copiesTotal: book.copiesTotal,
      activeLoansCount: book.loans.length
    };
  }

  async countUserActiveLoans(userId: string): Promise<number> {
    return this.prisma.loan.count({
      where: {
        user: { userId },
        status: LoanStatus.ACTIVE
      }
    });
  }

  async findUserByUserId(userId: string): Promise<{ id: string; userId: string } | null> {
    return this.prisma.user.findUnique({
      where: { userId },
      select: { id: true, userId: true }
    });
  }

  async createLoan(userId: string, bookId: string): Promise<LoanWithDetails> {
    return this.prisma.loan.create({
      data: {
        userId,
        bookId,
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
  }

  async findLoanByIdWithDetails(loanId: string): Promise<LoanWithDetails | null> {
    return this.prisma.loan.findUnique({
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
  }

  async updateLoanToReturned(loanId: string): Promise<LoanWithDetails> {
    return this.prisma.loan.update({
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
  }
}
