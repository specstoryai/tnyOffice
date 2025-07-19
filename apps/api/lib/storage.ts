import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface FileMetadata {
  id: string;
  filename: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

export interface FileWithContent extends FileMetadata {
  content: string;
}

const STORAGE_PATH = process.env.STORAGE_PATH || './storage/markdown';
const METADATA_FILE = path.join(STORAGE_PATH, 'metadata.json');

async function ensureStorageExists() {
  try {
    await fs.access(STORAGE_PATH);
  } catch {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
    await fs.writeFile(METADATA_FILE, JSON.stringify({ files: {} }));
  }
}

async function loadMetadata(): Promise<Record<string, FileMetadata>> {
  await ensureStorageExists();
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data).files || {};
  } catch {
    return {};
  }
}

async function saveMetadata(metadata: Record<string, FileMetadata>) {
  await fs.writeFile(METADATA_FILE, JSON.stringify({ files: metadata }, null, 2));
}

export async function createFile(filename: string, content: string): Promise<FileMetadata> {
  await ensureStorageExists();
  
  const id = randomUUID();
  const filePath = path.join(STORAGE_PATH, `${id}.md`);
  const now = new Date().toISOString();
  const size = Buffer.byteLength(content, 'utf-8');
  
  await fs.writeFile(filePath, content, 'utf-8');
  
  const metadata = await loadMetadata();
  const fileMetadata: FileMetadata = {
    id,
    filename,
    createdAt: now,
    updatedAt: now,
    size
  };
  
  metadata[id] = fileMetadata;
  await saveMetadata(metadata);
  
  return fileMetadata;
}

export async function getFile(id: string): Promise<FileWithContent | null> {
  const metadata = await loadMetadata();
  const fileMetadata = metadata[id];
  
  if (!fileMetadata) {
    return null;
  }
  
  const filePath = path.join(STORAGE_PATH, `${id}.md`);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      ...fileMetadata,
      content
    };
  } catch {
    return null;
  }
}

export async function listFiles(limit: number = 20, offset: number = 0): Promise<{
  files: FileMetadata[];
  total: number;
  limit: number;
  offset: number;
}> {
  const metadata = await loadMetadata();
  const allFiles = Object.values(metadata);
  
  allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const files = allFiles.slice(offset, offset + limit);
  
  return {
    files,
    total: allFiles.length,
    limit,
    offset
  };
}