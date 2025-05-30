export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateUniqueName?: boolean;
}

export interface FileUploadResult {
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface FileOperationResult {
  message: string;
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