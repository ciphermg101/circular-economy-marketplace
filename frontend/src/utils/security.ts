import { logger } from './logger';

export class SecurityUtils {
  private static instance: SecurityUtils;

  private constructor() {
    this.setupSecurityHeaders();
    this.setupCSPReporting();
  }

  static getInstance(): SecurityUtils {
    if (!SecurityUtils.instance) {
      SecurityUtils.instance = new SecurityUtils();
    }
    return SecurityUtils.instance;
  }

  private setupSecurityHeaders(): void {
    // These headers should be set on the server side, but we can check them here
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !document.head.querySelector(`meta[http-equiv="${header}"]`)
    );

    if (missingHeaders.length > 0) {
      logger.warn('Missing security headers:', { missingHeaders });
    }
  }

  private setupCSPReporting(): void {
    // Setup CSP violation reporting
    document.addEventListener('securitypolicyviolation', (e) => {
      logger.error('CSP violation:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
      });
    });
  }

  sanitizeInput(input: string): string {
    // Basic XSS prevention
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  validateFileUpload(file: File): boolean {
    // Define allowed file types and max size (e.g., 5MB)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      logger.warn('Invalid file type attempted:', { fileType: file.type });
      return false;
    }

    if (file.size > maxSize) {
      logger.warn('File too large:', { fileSize: file.size, maxSize });
      return false;
    }

    return true;
  }

  validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        logger.warn('Invalid URL protocol:', { protocol: parsedUrl.protocol });
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  hashData(data: string): string {
    // Simple hash function for client-side data
    // Note: This is NOT for cryptographic purposes
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  generateNonce(): string {
    // Generate a random nonce for CSP
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export a singleton instance
export const security = SecurityUtils.getInstance(); 