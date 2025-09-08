import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCatalog() {
    const books = await this.prisma.book.findMany({
      include: {
        loans: {
          where: { status: LoanStatus.ACTIVE },
        },
      },
    });

    return books.map((book) => {
      const activeLoans = book.loans.length;
      const availableCopies = book.copiesTotal - activeLoans;

      return {
        id: book.id,
        sku: book.sku,
        title: book.title,
        author: book.author,
        copiesTotal: book.copiesTotal,
        copiesInUse: activeLoans,
        copiesAvailable: availableCopies,
        isAvailable: availableCopies > 0,
      };
    });
  }
}
