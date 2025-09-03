import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
  @ApiProperty({
    description: 'Book SKU for loan',
    example: 'BOOK-001'
  })
  @IsString()
  @IsNotEmpty()
  sku: string;
}
