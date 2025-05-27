import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto, VerifyProfileDto } from '../../dtos/profile.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../types/request.types';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiBearerAuth()
  async createProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateProfileDto,
  ) {
    return this.profilesService.createProfile(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  async getMyProfile(@Request() req: AuthenticatedRequest) {
    return this.profilesService.getProfile(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a profile by ID' })
  async getProfile(@Param('id') id: string) {
    return this.profilesService.getProfile(id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(req.user.id, dto);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify a profile' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async verifyProfile(@Param('id') id: string, @Body() dto: VerifyProfileDto) {
    return this.profilesService.verifyProfile(id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search profiles' })
  async searchProfiles(@Query('query') query: string) {
    return this.profilesService.searchProfiles(query);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get profiles by type' })
  async getProfilesByType(@Param('type') type: string) {
    return this.profilesService.getProfilesByType(type);
  }
} 