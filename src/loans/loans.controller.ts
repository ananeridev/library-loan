import { Controller, Post, Patch, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { AuthenticatedRequest } from '../auth/user-id.middleware';

@ApiTags('loans')
@ApiSecurity('x-user-id')
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Create new loan' })
  @ApiResponse({ 
    status: 201, 
    description: 'Loan created successfully' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - book unavailable or user loan limit reached' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Book not found' 
  })
  async create(
    @Body() createLoanDto: CreateLoanDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.loansService.createLoan(createLoanDto, req.userId);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Return borrowed book' })
  @ApiResponse({ 
    status: 200, 
    description: 'Book returned successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Loan not found' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Loan already returned' 
  })
  async returnLoan(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.loansService.returnLoan(id, req.userId);
  }
}
