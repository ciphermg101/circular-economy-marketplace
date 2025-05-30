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
  ParseFilePipeBuilder,
  MaxFileSizeValidator,
  FileTypeValidator,
  Body,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../guards/auth.guard';
import { StorageService } from '../../services/storage.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileUploadOptions } from '../../types/storage.types';
import { MonitoringService } from '../../services/monitoring.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@ApiTags('storage')
@Controller('storage')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly monitoringService: MonitoringService,
  ) {}

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
        options: {
          type: 'object',
          properties: {
            maxSize: { type: 'number' },
            allowedTypes: { type: 'array', items: { type: 'string' } },
            generateUniqueName: { type: 'boolean' },
          },
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })
        )
        .addValidator(
          new FileTypeValidator({ fileType: ALLOWED_MIME_TYPES.join('|') })
        )
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: 400,
        }),
    ) file: Express.Multer.File,
    @Param('bucket') bucket: string,
    @Body('path') path?: string,
    @Body('options') options?: FileUploadOptions
  ) {
    try {
      // Validate bucket name
      if (!/^[a-z0-9-]+$/.test(bucket)) {
        throw new BadRequestException('Invalid bucket name');
      }

      // Merge default and custom options
      const finalOptions: FileUploadOptions = {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_MIME_TYPES,
        generateUniqueName: true,
        ...options,
      };

      const result = await this.storageService.uploadFile(file, bucket, path, finalOptions);
      
      // Track successful upload
      this.monitoringService.captureEvent('file_upload', {
        bucket,
        fileType: file.mimetype,
        fileSize: file.size,
      });

      return result;
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      this.monitoringService.captureError(error, {
        module: 'storage',
        operation: 'upload',
        bucket,
        fileType: file.mimetype,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  @Delete(':bucket/:path')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
  ) {
    try {
      // Validate bucket name
      if (!/^[a-z0-9-]+$/.test(bucket)) {
        throw new BadRequestException('Invalid bucket name');
      }

      // Validate path
      if (!path || path.includes('..')) {
        throw new BadRequestException('Invalid file path');
      }

      await this.storageService.deleteFile(bucket, path);
      
      // Track successful deletion
      this.monitoringService.captureEvent('file_delete', {
        bucket,
        path,
      });

      return { message: 'File deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      this.monitoringService.captureError(error, {
        module: 'storage',
        operation: 'delete',
        bucket,
        path,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  @Get('url/:bucket/:path')
  @ApiOperation({ summary: 'Get a signed URL for a private file' })
  async getSignedUrl(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
  ) {
    try {
      // Validate bucket name
      if (!/^[a-z0-9-]+$/.test(bucket)) {
        throw new BadRequestException('Invalid bucket name');
      }

      // Validate path
      if (!path || path.includes('..')) {
        throw new BadRequestException('Invalid file path');
      }

      const url = await this.storageService.getSignedUrl(bucket, path);
      
      // Track URL generation
      this.monitoringService.captureEvent('signed_url_generated', {
        bucket,
        path,
      });

      return { url };
    } catch (error) {
      this.logger.error('Error generating signed URL:', error);
      this.monitoringService.captureError(error, {
        module: 'storage',
        operation: 'getSignedUrl',
        bucket,
        path,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  @Get('list/:bucket')
  @ApiOperation({ summary: 'List files in a bucket' })
  async listFiles(
    @Param('bucket') bucket: string,
    @Query('path') path?: string,
  ) {
    try {
      // Validate bucket name
      if (!/^[a-z0-9-]+$/.test(bucket)) {
        throw new BadRequestException('Invalid bucket name');
      }

      // Validate path if provided
      if (path && path.includes('..')) {
        throw new BadRequestException('Invalid path');
      }

      const files = await this.storageService.listFiles(bucket, path);
      
      // Track list operation
      this.monitoringService.captureEvent('files_listed', {
        bucket,
        path: path || 'root',
        fileCount: files.length,
      });

      return files;
    } catch (error) {
      this.logger.error('Error listing files:', error);
      this.monitoringService.captureError(error, {
        module: 'storage',
        operation: 'listFiles',
        bucket,
        path,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to list files');
    }
  }
} 