import { LoanStatus } from '@prisma/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BookData {
  id: string;
  sku: string;
  title: string;
  author: string;
  copiesTotal: number;
  createdAt: Date;
  updatedAt: Date;
  loans: Array<{ id: string; status: LoanStatus }>;
}

export interface UserData {
  id: string;
  userId: string;
}

export interface LoanData {
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

export interface BookWithAvailability {
  id: string;
  sku: string;
  title: string;
  author: string;
  copiesTotal: number;
  copiesInUse: number;
  copiesAvailable: number;
  isAvailable: boolean;
}

// ============================================================================
// MOCK REPOSITORIES
// ============================================================================

export class MockPrismaService {
  private _books: BookData[] = [];
  private _validateArgs: ((args: any) => void) | null = null;

  book = {
    findMany: async (args?: unknown) => {
      if (this._validateArgs) this._validateArgs(args);
      return this._books;
    },
  };

  // Configuration methods
  setBooks(books: BookData[]) {
    this._books = books;
  }

  expectArgs(validator: (args: any) => void) {
    this._validateArgs = validator;
  }

  clearExpectations() {
    this._validateArgs = null;
  }
}

export class MockLoansRepository {
  private _book: any = null;
  private _userActiveLoans: number = 0;
  private _user: UserData | null = null;
  private _createdLoan: LoanData | null = null;
  private _loan: LoanData | null = null;
  private _updatedLoan: LoanData | null = null;

  // Repository methods
  findBookBySkuWithActiveLoans = async (sku: string) => this._book;
  countUserActiveLoans = async (userId: string) => this._userActiveLoans;
  findUserByUserId = async (userId: string) => this._user;
  createLoan = async (userId: string, bookId: string) => this._createdLoan;
  findLoanByIdWithDetails = async (loanId: string) => this._loan;
  updateLoanToReturned = async (loanId: string) => this._updatedLoan;

  // Configuration methods
  setBook(book: any) {
    this._book = book;
  }

  setUserActiveLoans(count: number) {
    this._userActiveLoans = count;
  }

  setUser(user: UserData | null) {
    this._user = user;
  }

  setCreatedLoan(loan: LoanData | null) {
    this._createdLoan = loan;
  }

  setLoan(loan: LoanData | null) {
    this._loan = loan;
  }

  setUpdatedLoan(loan: LoanData | null) {
    this._updatedLoan = loan;
  }
}

// ============================================================================
// DATA BUILDERS
// ============================================================================

export class BookBuilder {
  private data: Partial<BookData> = {
    id: 'book-1',
    sku: 'BOOK-001',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    copiesTotal: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    loans: [],
  };

  static create(): BookBuilder {
    return new BookBuilder();
  }

  withId(id: string): BookBuilder {
    this.data.id = id;
    return this;
  }

  withSku(sku: string): BookBuilder {
    this.data.sku = sku;
    return this;
  }

  withTitle(title: string): BookBuilder {
    this.data.title = title;
    return this;
  }

  withAuthor(author: string): BookBuilder {
    this.data.author = author;
    return this;
  }

  withCopiesTotal(total: number): BookBuilder {
    this.data.copiesTotal = total;
    return this;
  }

  withActiveLoans(count: number): BookBuilder {
    this.data.loans = Array.from({ length: count }, (_, i) => ({
      id: `loan-${i + 1}`,
      status: LoanStatus.ACTIVE,
    }));
    return this;
  }

  withLoans(loans: Array<{ id: string; status: LoanStatus }>): BookBuilder {
    this.data.loans = loans;
    return this;
  }

  build(): BookData {
    return this.data as BookData;
  }
}

export class UserBuilder {
  private data: Partial<UserData> = {
    id: 'user-1',
    userId: 'test-user',
  };

  static create(): UserBuilder {
    return new UserBuilder();
  }

  withId(id: string): UserBuilder {
    this.data.id = id;
    return this;
  }

  withUserId(userId: string): UserBuilder {
    this.data.userId = userId;
    return this;
  }

  build(): UserData {
    return this.data as UserData;
  }
}

export class LoanBuilder {
  private data: Partial<LoanData> = {
    id: 'loan-1',
    userId: 'user-1',
    bookId: 'book-1',
    loanDate: new Date('2023-01-01'),
    returnDate: null,
    status: LoanStatus.ACTIVE,
    book: {
      sku: 'BOOK-001',
      title: 'Clean Code',
      author: 'Robert C. Martin',
    },
    user: {
      userId: 'test-user',
    },
  };

  static create(): LoanBuilder {
    return new LoanBuilder();
  }

  withId(id: string): LoanBuilder {
    this.data.id = id;
    return this;
  }

  withUserId(userId: string): LoanBuilder {
    this.data.userId = userId;
    return this;
  }

  withBookId(bookId: string): LoanBuilder {
    this.data.bookId = bookId;
    return this;
  }

  withStatus(status: LoanStatus): LoanBuilder {
    this.data.status = status;
    return this;
  }

  withReturnDate(date: Date | null): LoanBuilder {
    this.data.returnDate = date;
    return this;
  }

  withBook(book: { sku: string; title: string; author: string }): LoanBuilder {
    this.data.book = book;
    return this;
  }

  withUser(user: { userId: string }): LoanBuilder {
    this.data.user = user;
    return this;
  }

  build(): LoanData {
    return this.data as LoanData;
  }
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

export class TestScenarios {
  static readonly BOOKS = {
    CLEAN_CODE: BookBuilder.create()
      .withId('book-1')
      .withSku('BOOK-001')
      .withTitle('Clean Code')
      .withAuthor('Robert C. Martin')
      .withCopiesTotal(3)
      .build(),

    DESIGN_PATTERNS: BookBuilder.create()
      .withId('book-2')
      .withSku('BOOK-002')
      .withTitle('Design Patterns')
      .withAuthor('Gang of Four')
      .withCopiesTotal(1)
      .build(),

    OUT_OF_STOCK: BookBuilder.create()
      .withId('book-3')
      .withSku('BOOK-003')
      .withTitle('Out of Stock Book')
      .withAuthor('Unknown Author')
      .withCopiesTotal(2)
      .withActiveLoans(2)
      .build(),
  };

  static readonly USERS = {
    TEST_USER: UserBuilder.create()
      .withId('user-1')
      .withUserId('test-user')
      .build(),

    OTHER_USER: UserBuilder.create()
      .withId('user-2')
      .withUserId('other-user')
      .build(),
  };

  static readonly LOANS = {
    ACTIVE_LOAN: LoanBuilder.create()
      .withId('loan-1')
      .withUserId('user-1')
      .withBookId('book-1')
      .withStatus(LoanStatus.ACTIVE)
      .withReturnDate(null)
      .build(),

    RETURNED_LOAN: LoanBuilder.create()
      .withId('loan-2')
      .withUserId('user-1')
      .withBookId('book-1')
      .withStatus(LoanStatus.RETURNED)
      .withReturnDate(new Date('2023-01-02'))
      .build(),
  };
}

// ============================================================================
// AVAILABILITY TEST CASES
// ============================================================================

export interface AvailabilityTestCase {
  name: string;
  copiesTotal: number;
  activeLoans: number;
  expectedAvailable: number;
  expectedIsAvailable: boolean;
}

export const AVAILABILITY_TEST_CASES: AvailabilityTestCase[] = [
  {
    name: 'no loans',
    copiesTotal: 3,
    activeLoans: 0,
    expectedAvailable: 3,
    expectedIsAvailable: true,
  },
  {
    name: 'partially loaned',
    copiesTotal: 3,
    activeLoans: 2,
    expectedAvailable: 1,
    expectedIsAvailable: true,
  },
  {
    name: 'fully loaned',
    copiesTotal: 1,
    activeLoans: 1,
    expectedAvailable: 0,
    expectedIsAvailable: false,
  },
  {
    name: 'zero stock',
    copiesTotal: 0,
    activeLoans: 0,
    expectedAvailable: 0,
    expectedIsAvailable: false,
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createBookWithAvailability(
  book: BookData,
  activeLoansCount: number,
): BookWithAvailability {
  const availableCopies = book.copiesTotal - activeLoansCount;
  return {
    id: book.id,
    sku: book.sku,
    title: book.title,
    author: book.author,
    copiesTotal: book.copiesTotal,
    copiesInUse: activeLoansCount,
    copiesAvailable: availableCopies,
    isAvailable: availableCopies > 0,
  };
}

export function validateBookAvailabilityInvariants(
  book: BookWithAvailability,
): boolean {
  return (
    book.copiesInUse >= 0 &&
    book.copiesTotal >= 0 &&
    book.copiesAvailable >= 0 &&
    book.copiesInUse + book.copiesAvailable === book.copiesTotal &&
    book.isAvailable === book.copiesAvailable > 0
  );
}
