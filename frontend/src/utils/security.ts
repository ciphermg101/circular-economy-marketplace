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
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
    ];

    const missingHeaders = requiredHeaders.filter(
      header => !document.head.querySelector(`meta[http-equiv="${header}"]`)
    );

    // Removed logger.warn call
  }

  private setupCSPReporting(): void {
    document.addEventListener('securitypolicyviolation', (e) => {
      // Removed logger.error call
    });
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  validateFileUpload(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      // Removed logger.warn call
      return false;
    }

    if (file.size > maxSize) {
      // Removed logger.warn call
      return false;
    }

    return true;
  }

  validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:'];

      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        // Removed logger.warn call
        return false;
      }

      return true;
    } catch {
      // Removed logger.warn call
      return false;
    }
  }

  hashData(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
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

    // Removed logger.warn call

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export a singleton instance
export const security = SecurityUtils.getInstance();
