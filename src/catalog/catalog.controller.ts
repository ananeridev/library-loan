import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@ApiSecurity('x-user-id')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List book catalog with availability' })
  @ApiResponse({
    status: 200,
    description: 'List of books with availability information',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sku: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          copiesTotal: { type: 'number' },
          copiesInUse: { type: 'number' },
          copiesAvailable: { type: 'number' },
          isAvailable: { type: 'boolean' },
        },
      },
    },
  })
  async getCatalog() {
    return this.catalogService.getCatalog();
  }
}
