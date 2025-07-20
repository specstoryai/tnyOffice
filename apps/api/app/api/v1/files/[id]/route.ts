import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/storage';
import { isValidUUID } from '@/lib/validation';
import { corsHeaders, corsResponse } from '@/lib/cors';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('GET /api/v1/files/[id] - Request received');
  try {
    const { id } = await params;
    console.log('GET /api/v1/files/[id] - ID:', id);
    
    if (!isValidUUID(id)) {
      return corsResponse(
        { error: 'Invalid file ID format' },
        400
      );
    }
    
    const file = await getFile(id);
    
    if (!file) {
      return corsResponse(
        { error: 'File not found' },
        404
      );
    }
    
    return corsResponse(file);
  } catch (error) {
    console.error('Error retrieving file:', error);
    return corsResponse(
      { error: 'Internal server error' },
      500
    );
  }
}