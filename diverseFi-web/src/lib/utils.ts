import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Password validation utility
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 capital letter
 * - At least 1 number
 * - At least 1 special character
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 capital letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least 1 special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getPasswordValidationMessage = (password: string): string | null => {
  const result = validatePassword(password);
  if (result.isValid) return null;
  return result.errors.join('. ');
};

export const PASSWORD_REQUIREMENTS =
  'Minimum 8 characters with at least 1 capital letter, 1 number, and 1 special character';
