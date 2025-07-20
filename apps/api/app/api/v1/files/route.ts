import { NextRequest, NextResponse } from 'next/server';
import { createFile, listFiles } from '@/lib/storage';
import { createFileSchema, listFilesSchema } from '@/lib/validation';
import { corsHeaders, corsResponse } from '@/lib/cors';
import { ZodError } from 'zod';
import { log } from '@tnyoffice/logger';

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  log.info('POST /api/v1/files - Request received');
  try {
    const body = await request.json();
    log.debug('POST /api/v1/files - Body:', body);
    const validatedData = createFileSchema.parse(body);
    
    const fileMetadata = await createFile(validatedData.filename, validatedData.content);
    log.info('POST /api/v1/files - Created:', fileMetadata);
    
    return corsResponse(fileMetadata, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return corsResponse(
        { error: 'Invalid request', details: error.issues },
        400
      );
    }
    
    log.error('Error creating file:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

export async function GET(request: NextRequest) {
  log.info('GET /api/v1/files - Request received');
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0'
    };
    
    log.debug('GET /api/v1/files - Params:', params);
    const validatedParams = listFilesSchema.parse(params);
    const result = await listFiles(validatedParams.limit, validatedParams.offset);
    log.info('GET /api/v1/files - Result:', result);
    
    return corsResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return corsResponse(
        { error: 'Invalid query parameters', details: error.issues },
        400
      );
    }
    
    log.error('Error listing files:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}