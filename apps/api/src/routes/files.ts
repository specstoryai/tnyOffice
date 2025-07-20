import express, { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../utils/logger.js';
import { getDB } from '../db/database.js';
import { createFileSchema, listFilesSchema, updateFileSchema, isValidUUID } from '../validation.js';
import { ZodError } from 'zod';
import type { 
  FileMetadata, 
  FileWithContent, 
  ListFilesResponse, 
  CreateFileRequest,
  UpdateFileRequest,
  ErrorResponse 
} from '../types.js';

const router: Router = express.Router();

// Database row types
interface FileRow {
  id: string;
  filename: string;
  content: string;
  created_at: number;
  updated_at: number;
}

interface FileListRow {
  id: string;
  filename: string;
  created_at: number;
  updated_at: number;
  size: number;
}

// Create a new file
router.post('/', async (req: Request<object, object, CreateFileRequest>, res: Response<FileMetadata | ErrorResponse>) => {
  log.info('POST /api/v1/files - Request received');
  
  try {
    const validatedData = createFileSchema.parse(req.body);
    const db = getDB();
    
    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = db.prepare(`
      INSERT INTO files (id, filename, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, validatedData.filename, validatedData.content, now, now);
    
    const fileMetadata: FileMetadata = {
      id,
      filename: validatedData.filename,
      createdAt: new Date(now * 1000).toISOString(),
      updatedAt: new Date(now * 1000).toISOString(),
      size: Buffer.byteLength(validatedData.content, 'utf8')
    };
    
    log.info('POST /api/v1/files - Created:', fileMetadata);
    return res.status(201).json(fileMetadata);
    
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.issues 
      });
    }
    
    log.error('Error creating file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List all files
router.get('/', async (req: Request, res: Response<ListFilesResponse | ErrorResponse>) => {
  log.info('GET /api/v1/files - Request received');
  
  try {
    const params = listFilesSchema.parse(req.query);
    const db = getDB();
    
    // Get total count
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM files');
    const { total } = countStmt.get() as { total: number };
    
    // Get paginated files
    const stmt = db.prepare(`
      SELECT id, filename, created_at, updated_at, LENGTH(content) as size
      FROM files
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(params.limit, params.offset) as FileListRow[];
    
    const files: FileMetadata[] = rows.map(row => ({
      id: row.id,
      filename: row.filename,
      createdAt: new Date(row.created_at * 1000).toISOString(),
      updatedAt: new Date(row.updated_at * 1000).toISOString(),
      size: row.size
    }));
    
    const result: ListFilesResponse = {
      files,
      total,
      limit: params.limit,
      offset: params.offset
    };
    
    log.info('GET /api/v1/files - Result:', result);
    return res.json(result);
    
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: 'Invalid query parameters', 
        details: error.issues 
      });
    }
    
    log.error('Error listing files:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a file by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response<FileWithContent | ErrorResponse>) => {
  log.info('GET /api/v1/files/[id] - Request received');
  
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }
    
    const db = getDB();
    const stmt = db.prepare(`
      SELECT id, filename, content, created_at, updated_at
      FROM files
      WHERE id = ?
    `);
    
    const file = stmt.get(id) as FileRow | undefined;
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const result: FileWithContent = {
      id: file.id,
      filename: file.filename,
      content: file.content,
      createdAt: new Date(file.created_at * 1000).toISOString(),
      updatedAt: new Date(file.updated_at * 1000).toISOString(),
      size: Buffer.byteLength(file.content, 'utf8')
    };
    
    log.info('GET /api/v1/files/[id] - Found:', result.id);
    return res.json(result);
    
  } catch (error) {
    log.error('Error getting file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a file by ID
router.put('/:id', async (req: Request<{ id: string }, object, UpdateFileRequest>, res: Response<FileWithContent | ErrorResponse>) => {
  log.info('PUT /api/v1/files/[id] - Request received');
  
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }
    
    const validatedData = updateFileSchema.parse(req.body);
    const db = getDB();
    
    // Check if file exists
    const checkStmt = db.prepare('SELECT id FROM files WHERE id = ?');
    const exists = checkStmt.get(id);
    
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: unknown[] = [];
    
    if (validatedData.filename !== undefined) {
      updates.push('filename = ?');
      values.push(validatedData.filename);
    }
    
    if (validatedData.content !== undefined) {
      updates.push('content = ?');
      values.push(validatedData.content);
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at = ?');
    values.push(Math.floor(Date.now() / 1000));
    
    // Add ID at the end for WHERE clause
    values.push(id);
    
    const updateStmt = db.prepare(`
      UPDATE files 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    updateStmt.run(...values);
    
    // Fetch the updated file
    const selectStmt = db.prepare(`
      SELECT id, filename, content, created_at, updated_at
      FROM files
      WHERE id = ?
    `);
    
    const file = selectStmt.get(id) as FileRow;
    
    const result: FileWithContent = {
      id: file.id,
      filename: file.filename,
      content: file.content,
      createdAt: new Date(file.created_at * 1000).toISOString(),
      updatedAt: new Date(file.updated_at * 1000).toISOString(),
      size: Buffer.byteLength(file.content, 'utf8')
    };
    
    log.info('PUT /api/v1/files/[id] - Updated:', result.id);
    return res.json(result);
    
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.issues 
      });
    }
    
    log.error('Error updating file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;