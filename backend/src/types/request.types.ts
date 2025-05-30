import { Request } from 'express';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedUser extends User {
  role: string;
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  sessionID?: string;
}

export interface FileUploadRequest extends AuthenticatedRequest {
  file: Express.Multer.File;
  files?: Express.Multer.File[];
}

export interface PaginatedRequest extends Request {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  };
}

export default AuthenticatedRequest; 