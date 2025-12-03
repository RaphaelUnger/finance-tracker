/**
 * Validation utilities for forms and data
 */

import * as yup from 'yup';
import { ValidationError, ValidationResult } from '@/types/app';

/**
 * Common validation schemas
 */

export const TransactionValidationSchema = yup.object({
  amount: yup
    .number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount cannot exceed 1,000,000')
    .required('Amount is required'),

  description: yup
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description cannot exceed 500 characters')
    .required('Description is required'),

  date: yup
    .date()
    .max(new Date(), 'Date cannot be in the future')
    .required('Date is required'),

  type: yup
    .string()
    .oneOf(['income', 'expense'], 'Type must be income or expense')
    .required('Type is required'),

  categoryId: yup
    .string()
    .uuid('Invalid category ID')
    .required('Category is required'),

  notes: yup
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .nullable(),

  tags: yup
    .array()
    .of(yup.string())
    .max(10, 'Cannot have more than 10 tags')
    .nullable(),
});

export const CategoryValidationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .required('Name is required'),

  type: yup
    .string()
    .oneOf(['income', 'expense'], 'Type must be income or expense')
    .required('Type is required'),

  icon: yup
    .string()
    .min(1, 'Icon is required')
    .required('Icon is required'),

  color: yup
    .string()
    .matches(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .required('Color is required'),

  parentId: yup
    .string()
    .uuid('Invalid parent category ID')
    .nullable(),
});

export const RecurrenceValidationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .required('Name is required'),

  amount: yup
    .number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount cannot exceed 1,000,000')
    .required('Amount is required'),

  description: yup
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description cannot exceed 500 characters')
    .required('Description is required'),

  categoryId: yup
    .string()
    .uuid('Invalid category ID')
    .required('Category is required'),

  pattern: yup
    .string()
    .min(1, 'Pattern is required')
    .required('Pattern is required'),

  startDate: yup
    .date()
    .required('Start date is required'),

  endDate: yup
    .date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .nullable(),
});

export const PinValidationSchema = yup.object({
  pin: yup
    .string()
    .matches(/^\d{4,8}$/, 'PIN must be 4-8 digits')
    .required('PIN is required'),

  confirmPin: yup
    .string()
    .oneOf([yup.ref('pin')], 'PINs do not match')
    .required('PIN confirmation is required'),
});

/**
 * Validate data against schema
 */
export const validateData = async <T>(
  data: T,
  schema: yup.Schema<T>
): Promise<ValidationResult> => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: ValidationError[] = error.inner.map(err => ({
        field: err.path || 'unknown',
        message: err.message,
        code: err.type || 'validation_error',
      }));
      return { isValid: false, errors };
    }
    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Validation failed', code: 'unknown_error' }],
    };
  }
};

/**
 * Validate single field
 */
export const validateField = async (
  value: any,
  fieldSchema: yup.Schema
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    await fieldSchema.validate(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { isValid: false, error: error.message };
    }
    return { isValid: false, error: 'Validation failed' };
  }
};

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone number validation (basic)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * URL validation
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * UUID validation
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Password strength validation
 */
export const validatePasswordStrength = (password: string): {
  score: number; // 0-5
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  // Length
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Uppercase
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Use at least one uppercase letter');
  }

  // Lowercase
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Use at least one lowercase letter');
  }

  // Numbers
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Use at least one number');
  }

  // Special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Use at least one special character');
  }

  return {
    score,
    feedback,
    isStrong: score >= 4,
  };
};

/**
 * File validation
 */
export const validateFileSize = (
  fileSizeBytes: number,
  maxSizeMB: number = 10
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSizeBytes <= maxSizeBytes;
};

export const validateFileType = (
  fileName: string,
  allowedExtensions: string[]
): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};

/**
 * Credit card validation (basic Luhn algorithm)
 */
export const validateCreditCard = (cardNumber: string): {
  isValid: boolean;
  type?: string;
} => {
  // Remove spaces and hyphens
  const cleaned = cardNumber.replace(/[\s\-]/g, '');

  // Check if all digits
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  const isValid = sum % 10 === 0;

  // Determine card type
  let type: string | undefined;
  if (cleaned.startsWith('4')) type = 'Visa';
  else if (/^5[1-5]/.test(cleaned)) type = 'Mastercard';
  else if (/^3[47]/.test(cleaned)) type = 'American Express';

  return { isValid, type };
};

/**
 * Date range validation
 */
export const validateDateRange = (
  startDate: Date,
  endDate: Date,
  maxDaysRange: number = 365
): { isValid: boolean; error?: string } => {
  if (startDate >= endDate) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffInDays > maxDaysRange) {
    return { isValid: false, error: `Date range cannot exceed ${maxDaysRange} days` };
  }

  return { isValid: true };
};

/**
 * Amount range validation
 */
export const validateAmountRange = (
  amount: number,
  min: number = 0.01,
  max: number = 1000000
): { isValid: boolean; error?: string } => {
  if (amount < min) {
    return { isValid: false, error: `Amount must be at least ${min}` };
  }

  if (amount > max) {
    return { isValid: false, error: `Amount cannot exceed ${max}` };
  }

  return { isValid: true };
};
