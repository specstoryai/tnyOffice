import { z } from 'zod';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Filename validation: alphanumeric with dashes/underscores, .md extension
const FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.md$/;

export const createFileSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(FILENAME_REGEX, 'Invalid filename format. Use alphanumeric characters, dashes, or underscores with .md extension'),
  content: z.string()
    .max(5 * 1024 * 1024, 'Content too large (max 5MB)')
});

export const listFilesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export const updateFileSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(FILENAME_REGEX, 'Invalid filename format. Use alphanumeric characters, dashes, or underscores with .md extension')
    .optional(),
  content: z.string()
    .max(5 * 1024 * 1024, 'Content too large (max 5MB)')
    .optional()
}).refine(data => data.filename || data.content, {
  message: 'At least one field (filename or content) must be provided'
});

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export type CreateFileInput = z.infer<typeof createFileSchema>;
export type ListFilesInput = z.infer<typeof listFilesSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;