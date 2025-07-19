import { NextRequest, NextResponse } from 'next/server';
import { createFile, listFiles } from '@/lib/storage';
import { createFileSchema, listFilesSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createFileSchema.parse(body);
    
    const fileMetadata = await createFile(validatedData.filename, validatedData.content);
    
    return NextResponse.json(fileMetadata, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0'
    };
    
    const validatedParams = listFilesSchema.parse(params);
    const result = await listFiles(validatedParams.limit, validatedParams.offset);
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}