import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { TutorialsService } from './tutorials.service';
import { CreateTutorialDto, UpdateTutorialDto, SearchTutorialsDto } from '../../dtos/tutorial.dto';
import { PaginationParams } from '../../types/common.types';
import { AuthGuard } from '../../guards/auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../types/request.types';
import { TutorialCategory } from '../../dtos/tutorial.dto';

@ApiTags('tutorials')
@Controller('tutorials')
export class TutorialsController {
  constructor(private readonly tutorialsService: TutorialsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new tutorial' })
  @ApiBearerAuth()
  async createTutorial(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateTutorialDto,
  ) {
    return this.tutorialsService.create(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tutorial by ID' })
  async getTutorial(@Param('id') id: string) {
    return this.tutorialsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update a tutorial' })
  @ApiBearerAuth()
  async updateTutorial(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTutorialDto,
  ) {
    return this.tutorialsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a tutorial' })
  @ApiBearerAuth()
  async deleteTutorial(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.tutorialsService.delete(id, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Search tutorials' })
  async searchTutorials(
    @Query() searchDto: SearchTutorialsDto,
    @Query() pagination: PaginationParams,
  ) {
    return this.tutorialsService.search(searchDto, pagination);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Like/unlike a tutorial' })
  @ApiBearerAuth()
  async likeTutorial(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.tutorialsService.like(req.user.id, id);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular tutorials' })
  async getPopularTutorials(@Query('limit') limit: number) {
    return this.tutorialsService.getPopular(limit);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get tutorials by category' })
  async getTutorialsByCategory(
    @Param('category') categoryParam: string,
    @Query() pagination: PaginationParams,
  ) {
    if (!Object.values(TutorialCategory).includes(categoryParam as TutorialCategory)) {
      throw new BadRequestException(`Invalid category: ${categoryParam}`);
    }
    const category = categoryParam as TutorialCategory;
    const searchDto: SearchTutorialsDto = { category };
    return this.tutorialsService.search(searchDto, pagination);
  }

}
