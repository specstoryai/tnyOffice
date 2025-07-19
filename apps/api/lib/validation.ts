import { z } from 'zod';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

export const createFileSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .regex(/^[a-zA-Z0-9_-]+\.md$/, 'Filename must be alphanumeric with dashes/underscores and .md extension')
    .max(255, 'Filename too long'),
  content: z.string()
    .min(1, 'Content is required')
    .refine((content) => Buffer.byteLength(content, 'utf-8') <= MAX_FILE_SIZE, {
      message: `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`
    })
});

export const listFilesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}