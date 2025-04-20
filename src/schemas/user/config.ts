import z from 'zod';
import { nonEmptySchema } from '@/schemas/app';
import { CurrencyOptions, DateFormat, Theme, TimeFormat } from '@/types';
import { getCurrencySymbol } from '@/utils/helpers';

/**
 * Schema for updating user profile (fullName and userName)
 */
export const updateProfileSchema = nonEmptySchema({
  message: 'At least one field (fullName or userName) must be provided',
  schema: z
    .object({
      fullName: z.string().max(50, { message: 'Full name cannot exceed 50 characters' }),
      userName: z
        .string()
        .max(15, { message: 'Username cannot exceed 15 characters' })
        .regex(/^[A-Za-z_]+$/, {
          message: 'Usernames must contain only alphabetic characters and underscores.',
        }),
    })
    .partial()
    .strict(),
});

/**
 * Schema for updating user role
 */
export const updateRoleSchema = nonEmptySchema({
  schema: z
    .object({
      roles: z
        .array(
          z.enum(['user', 'admin'], { invalid_type_error: 'Role must be either "user" or "admin"' })
        )
        .min(1, { message: 'At least one role must be provided' }),
    })
    .strict(),
});

/**
 * Schema for updating user preferences
 */
export const updatePreferencesSchema = nonEmptySchema({
  message: 'At least one preference field must be provided',
  schema: z
    .object({
      timeFormat: z.nativeEnum(TimeFormat, { invalid_type_error: 'Invalid time format' }),
      dateFormat: z.nativeEnum(DateFormat, { invalid_type_error: 'Invalid date format' }),
      notifications: z.boolean({ invalid_type_error: 'Notifications must be a boolean value' }),
      currency: z.nativeEnum(CurrencyOptions, { invalid_type_error: 'Invalid currency option' }),
      theme: z.enum([Theme.Light, Theme.Dark], {
        invalid_type_error: 'Theme must be either "light" or "dark"',
      }),
    })
    .partial()
    .strict()
    .transform((data) => {
      if (data.currency) {
        return {
          ...data,
          currencySym: getCurrencySymbol(data.currency),
        };
      }

      return data;
    }),
});

/**
 * Schema for updating profile image
 */
export const updateProfileImageSchema = nonEmptySchema({
  schema: z
    .object({
      profileImage: z
        .instanceof(File, { message: 'Please upload a valid file' })
        .refine((file) => file.size <= 1024 * 1024, {
          message: 'Profile image must be less than 1MB',
        })
        .refine((file) => ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type), {
          message: 'File must be a valid image (JPEG, PNG, GIF, or JPG)',
        }),
    })
    .strict(),
});
