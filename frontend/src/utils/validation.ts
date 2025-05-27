import { z } from 'zod';
import DOMPurify from 'dompurify';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email is too short')
  .max(255, 'Email is too long');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  );

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format. Please use international format (e.g., +1234567890)',
  );

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL is too long');

// Common sanitization functions
export const sanitizers = {
  text: (input: string): string => {
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  },

  html: (input: string): string => {
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
    });
  },

  markdown: (input: string): string => {
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
    });
  },

  email: (input: string): string => {
    return input.trim().toLowerCase();
  },

  username: (input: string): string => {
    return input.trim().toLowerCase();
  },

  phone: (input: string): string => {
    return input.trim().replace(/[^\d+]/g, '');
  },

  url: (input: string): string => {
    try {
      const url = new URL(input.trim());
      return url.toString();
    } catch {
      return '';
    }
  },
};

// Validation helper functions
export const validators = {
  isStrongPassword: (password: string): boolean => {
    return passwordSchema.safeParse(password).success;
  },

  isValidEmail: (email: string): boolean => {
    return emailSchema.safeParse(email).success;
  },

  isValidUsername: (username: string): boolean => {
    return usernameSchema.safeParse(username).success;
  },

  isValidPhone: (phone: string): boolean => {
    return phoneSchema.safeParse(phone).success;
  },

  isValidUrl: (url: string): boolean => {
    return urlSchema.safeParse(url).success;
  },
};

// Custom error formatter for Zod validation
export const formatZodError = (error: z.ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return errors;
};

// Type-safe validation function
export async function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): Promise<z.infer<T>> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(JSON.stringify(formatZodError(error)));
    }
    throw error;
  }
} 