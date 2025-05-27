import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private supabase;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get('supabaseConfig.url');
    const key = this.configService.get('supabaseConfig.key');

    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Upload a file to Supabase Storage
   * @param bucket - The bucket name to upload to
   * @param file - The file buffer to upload
   * @param path - Optional path within the bucket
   * @returns The URL of the uploaded file
   */
  async uploadFile(
    bucket: string,
    file: Buffer,
    options: {
      path?: string;
      contentType?: string;
      isPublic?: boolean;
    } = {}
  ): Promise<{ url: string; path: string }> {
    const {
      path = '',
      contentType = 'application/octet-stream',
      isPublic = true,
    } = options;

    // Generate a unique filename
    const ext = contentType.split('/')[1] || 'bin';
    const filename = `${path}${uuidv4()}.${ext}`.replace(/^\//, '');

    // Upload the file
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filename, file, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // If the file should be public, make it publicly accessible
    if (isPublic) {
      const { data: publicUrl } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      return {
        url: publicUrl.publicUrl,
        path: filename,
      };
    }

    // For private files, return a signed URL
    const { data: signedUrl } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(filename, 3600); // 1 hour expiry

    return {
      url: signedUrl.signedUrl,
      path: filename,
    };
  }

  /**
   * Delete a file from Supabase Storage
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }
  }

  /**
   * Get a temporary signed URL for a private file
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @param expiresIn - Expiry time in seconds (default: 3600)
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }

  /**
   * List files in a bucket
   * @param bucket - The bucket name
   * @param path - Optional path prefix to filter by
   */
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(path || '');

    if (error) {
      throw error;
    }

    return data;
  }
} 