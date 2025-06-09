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
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '@users/users.service';
import { CreateProfileDto, UpdateProfileDto, VerifyProfileDto } from '@users/dto/user.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBearerAuth()
  async createUser(
    @Request() req: any,
    @Body() dto: CreateProfileDto,
  ) {
    return this.usersService.createUser(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  async getMyProfile(@Request() req: any) {
    return this.usersService.getUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'individual', 'repair_shop', 'organization', 'buyer', 'seller')
  async updateUser(
    @Request() req: any,
    @Body() dto: UpdateProfileDto,
  ) {
    if (req.user.role !== 'admin' && req.user.id !== req.user.id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.updateUser(req.user.id, dto);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify a user' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async verifyUser(@Param('id') id: string, @Body() dto: VerifyProfileDto) {
    return this.usersService.verifyUser(id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async searchUsers(@Query('query') query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get users by type' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getUsersByType(@Param('type') type: string) {
    return this.usersService.getUsersByType(type);
  }
}