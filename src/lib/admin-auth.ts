/**
 * Simple admin authentication
 * Uses a single password stored in environment variable
 * Session managed via cookies
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default for dev, override in production

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function getAdminPassword(): string {
  return ADMIN_PASSWORD;
}