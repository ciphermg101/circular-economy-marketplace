import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../config/supabase.config';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';
import { ApiProperty } from '@nestjs/swagger';
import { SupabaseClient } from '@supabase/supabase-js';

export class FileUploadOptions {
  @ApiProperty({ description: 'Maximum file size in bytes', required: false })
  maxSize?: number;

  @ApiProperty({ description: 'List of allowed MIME types', required: false })
  allowedTypes?: string[];

  @ApiProperty({ description: 'Whether to generate a unique filename', required: false })
  generateUniqueName?: boolean;
}

export class FileUploadResult {
  @ApiProperty({ description: 'Path of the uploaded file' })
  path: string;

  @ApiProperty({ description: 'Public URL of the uploaded file' })
  url: string;

  @ApiProperty({ description: 'Size of the file in bytes' })
  size: number;

  @ApiProperty({ description: 'MIME type of the file' })
  mimetype: string;
}

export class FileOperationResult {
  @ApiProperty({ description: 'Operation result message' })
  message: string;

  @ApiProperty({ description: 'Additional data if applicable', required: false })
  data?: any;
}

export interface BucketConfig {
  maxSize: number;
  allowedTypes: string[];
  path: string;
  isPublic: boolean;
  generateUniqueName: boolean;
}

export interface BucketConfigs {
  products: BucketConfig;
  profiles: BucketConfig;
  tutorials: BucketConfig;
  [key: string]: BucketConfig;
}

interface File {
  size: number;
  mimetype: string;
  buffer: Buffer;
  originalname: string;
}

const DEFAULT_OPTIONS: FileUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  generateUniqueName: true,
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly defaultBucket: string;
  private readonly bucketConfigs: BucketConfigs;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseConfig: SupabaseConfig,
  ) {
    this.supabase = this.supabaseConfig.getClient();
    this.defaultBucket = this.configService.get('storage.defaultBucket', 'public');
    this.bucketConfigs = {
      products: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        path: 'products',
        isPublic: true,
        generateUniqueName: true
      },
      profiles: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        path: 'profiles',
        isPublic: true,
        generateUniqueName: true
      },
      tutorials: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'application/pdf'],
        path: 'tutorials',
        isPublic: false,
        generateUniqueName: true
      }
    };
  }

  private validateFile(file: Express.Multer.File, bucket: keyof BucketConfigs): void {
    const config = this.bucketConfigs[bucket];
    if (!config) {
      throw new BadRequestException(`Invalid bucket: ${bucket}`);
    }

    if (file.size > config.maxSize) {
      throw new BadRequestException(`File size exceeds the limit of ${config.maxSize / (1024 * 1024)}MB`);
    }

    if (!config.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string = this.defaultBucket,
    filePath?: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      const config = this.bucketConfigs[bucket];
      if (!config) {
        throw new BadRequestException(`Invalid bucket: ${bucket}`);
      }

      const { maxSize = config.maxSize, allowedTypes = config.allowedTypes, generateUniqueName = config.generateUniqueName } = options;

      // Validate file size
      if (file.size > maxSize) {
        const error = new BadRequestException(`File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`);
        this.logger.warn('File size validation failed', { 
          size: file.size,
          maxSize,
          filename: file.originalname 
        });
        throw error;
      }

      // Validate file type
      if (!allowedTypes.includes(file.mimetype)) {
        const error = new BadRequestException(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        this.logger.warn('File type validation failed', { 
          mimetype: file.mimetype,
          allowedTypes,
          filename: file.originalname 
        });
        throw error;
      }

      // Generate unique file path if needed
      const finalPath = generateUniqueName
        ? this.generateUniqueFilePath(file.originalname, filePath)
        : path.join(filePath || '', file.originalname);

      this.logger.debug('Uploading file', {
        bucket,
        path: finalPath,
        size: file.size,
        mimetype: file.mimetype
      });

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(finalPath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error('Error uploading file:', {
          error: error.message,
          bucket,
          path: finalPath
        });
        throw new InternalServerErrorException('Failed to upload file');
      }

      const { data: urlData } = await this.supabase.storage
        .from(bucket)
        .getPublicUrl(finalPath);

      const result = {
        path: finalPath,
        url: urlData.publicUrl,
        size: file.size,
        mimetype: file.mimetype,
      };

      this.logger.debug('File uploaded successfully', result);
      return result;
    } catch (error) {
      this.logger.error('Error in file upload:', {
        error: error.message,
        stack: error.stack,
        filename: file.originalname,
        bucket
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process file upload');
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<FileOperationResult> {
    try {
      this.logger.debug('Deleting file', { bucket, path: filePath });

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        this.logger.error('Error deleting file:', {
          error: error.message,
          bucket,
          path: filePath
        });
        throw new InternalServerErrorException('Failed to delete file');
      }

      const result = { message: 'File deleted successfully' };
      this.logger.debug('File deleted successfully', { bucket, path: filePath });
      return result;
    } catch (error) {
      this.logger.error('Error in file deletion:', {
        error: error.message,
        stack: error.stack,
        bucket,
        path: filePath
      });
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async getSignedUrl(bucket: string, filePath: string, expiresIn: number = 3600) {
    try {
      this.logger.debug('Generating signed URL', {
        bucket,
        path: filePath,
        expiresIn
      });

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        this.logger.error('Error generating signed URL:', {
          error: error.message,
          bucket,
          path: filePath
        });
        throw new InternalServerErrorException('Failed to generate signed URL');
      }

      const result = { 
        signedUrl: data.signedUrl, 
        expiresAt: new Date(Date.now() + expiresIn * 1000) 
      };
      this.logger.debug('Signed URL generated successfully', {
        bucket,
        path: filePath,
        expiresAt: result.expiresAt
      });
      return result;
    } catch (error) {
      this.logger.error('Error generating signed URL:', {
        error: error.message,
        stack: error.stack,
        bucket,
        path: filePath
      });
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  async listFiles(bucket: string, prefix?: string) {
    try {
      this.logger.debug('Listing files', { bucket, prefix });

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(prefix || '');

      if (error) {
        this.logger.error('Error listing files:', {
          error: error.message,
          bucket,
          prefix
        });
        throw new InternalServerErrorException('Failed to list files');
      }

      this.logger.debug('Files listed successfully', {
        bucket,
        prefix,
        count: data.length
      });
      return data;
    } catch (error) {
      this.logger.error('Error listing files:', {
        error: error.message,
        stack: error.stack,
        bucket,
        prefix
      });
      throw new InternalServerErrorException('Failed to list files');
    }
  }

  async moveFile(bucket: string, fromPath: string, toPath: string): Promise<FileOperationResult> {
    try {
      this.logger.debug('Moving file', {
        bucket,
        fromPath,
        toPath
      });

      // First copy the file to new location
      const { error: copyError } = await this.supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (copyError) {
        this.logger.error('Error copying file:', {
          error: copyError.message,
          bucket,
          fromPath,
          toPath
        });
        throw new InternalServerErrorException('Failed to move file');
      }

      // Then delete the original file
      const { error: deleteError } = await this.supabase.storage
        .from(bucket)
        .remove([fromPath]);

      if (deleteError) {
        this.logger.error('Error deleting original file:', {
          error: deleteError.message,
          bucket,
          path: fromPath
        });
        // Try to rollback the copy
        await this.supabase.storage.from(bucket).remove([toPath]);
        throw new InternalServerErrorException('Failed to move file');
      }

      const result = { 
        message: 'File moved successfully', 
        data: { newPath: toPath } 
      };
      this.logger.debug('File moved successfully', {
        bucket,
        fromPath,
        toPath
      });
      return result;
    } catch (error) {
      this.logger.error('Error moving file:', {
        error: error.message,
        stack: error.stack,
        bucket,
        fromPath,
        toPath
      });
      throw new InternalServerErrorException('Failed to move file');
    }
  }

  private generateUniqueFilePath(originalName: string, basePath?: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const uniqueName = `${path.basename(originalName, ext)}_${timestamp}_${hash}${ext}`;
    return path.join(basePath || '', uniqueName);
  }
} 