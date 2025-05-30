import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EnvironmentalImpactService, ImpactMetrics } from './environmental-impact.service'; // Import ImpactMetrics here
import { AuthGuard } from '../../guards/auth.guard';

@ApiTags('environmental-impact')
@Controller('environmental-impact')
export class EnvironmentalImpactController {
  constructor(private readonly environmentalImpactService: EnvironmentalImpactService) {}

  @Get('product/:id')
  @ApiOperation({ summary: 'Get environmental impact of a product' })
  async getProductImpact(@Param('id') id: string): Promise<ImpactMetrics> {  // Explicit return type
    return this.environmentalImpactService.calculateProductImpact(id);
  }

  @Get('user/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get environmental impact of a user' })
  async getUserImpact(@Param('id') id: string): Promise<ImpactMetrics> {  // Explicit return type
    return this.environmentalImpactService.calculateUserImpact(id);
  }

  @Get('marketplace')
  @ApiOperation({ summary: 'Get total environmental impact of the marketplace' })
  async getMarketplaceImpact(): Promise<ImpactMetrics> {  // Explicit return type
    return this.environmentalImpactService.getMarketplaceImpact();
  }
}
