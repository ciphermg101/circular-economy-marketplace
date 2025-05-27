import {
  Controller,
  Post,
  Delete,
  Get,
  UseGuards,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../guards/auth.guard';
import { StorageService } from '../../services/storage.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('storage')
@Controller('storage')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/:bucket')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        path: {
          type: 'string',
          description: 'Optional path within the bucket',
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether the file should be publicly accessible',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('bucket') bucket: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('path') path?: string,
    @Query('isPublic') isPublic?: boolean,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.storageService.uploadFile(bucket, file.buffer, {
      path,
      contentType: file.mimetype,
      isPublic: isPublic !== undefined ? isPublic : true,
    });
  }

  @Delete(':bucket/:path(*)')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
  ) {
    await this.storageService.deleteFile(bucket, path);
    return { message: 'File deleted successfully' };
  }

  @Get('signed-url/:bucket/:path(*)')
  @ApiOperation({ summary: 'Get a signed URL for a private file' })
  async getSignedUrl(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const url = await this.storageService.getSignedUrl(bucket, path, expiresIn);
    return { url };
  }

  @Get('list/:bucket')
  @ApiOperation({ summary: 'List files in a bucket' })
  async listFiles(
    @Param('bucket') bucket: string,
    @Query('path') path?: string,
  ) {
    return this.storageService.listFiles(bucket, path);
  }
} 