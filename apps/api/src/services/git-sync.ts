import { simpleGit, SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { log } from '../utils/logger.js';
import { getDB } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GitSyncResult {
  success: boolean;
  commitHash?: string;
  changes: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  error?: string;
}

export class GitSyncService {
  private gitRepoPath: string;
  private git: SimpleGit;

  constructor() {
    this.gitRepoPath = process.env.NODE_ENV === 'production' 
      ? '/data/git-repo'
      : path.join(__dirname, '../../git-repo');
    
    this.git = simpleGit();
  }

  async initializeRepo(): Promise<void> {
    try {
      // Create the git repo directory if it doesn't exist
      await fs.mkdir(this.gitRepoPath, { recursive: true });
      
      // Initialize git if not already initialized
      const gitDir = path.join(this.gitRepoPath, '.git');
      try {
        await fs.access(gitDir);
        log.info('Git repository already initialized at:', this.gitRepoPath);
      } catch {
        log.info('Initializing new git repository at:', this.gitRepoPath);
        this.git = simpleGit(this.gitRepoPath);
        await this.git.init();
        
        // Create documents directory
        const documentsDir = path.join(this.gitRepoPath, 'documents');
        await fs.mkdir(documentsDir, { recursive: true });
        
        // Create .gitignore
        const gitignoreContent = '# OS files\n.DS_Store\nThumbs.db\n\n# Editor files\n*.swp\n*.swo\n*~\n';
        await fs.writeFile(path.join(this.gitRepoPath, '.gitignore'), gitignoreContent);
        
        // Initial commit
        await this.git.add('.gitignore');
        await this.git.commit('Initial commit');
        log.info('Git repository initialized successfully');
      }
      
      // Set git instance to work in the repo directory
      this.git = simpleGit(this.gitRepoPath);
    } catch (error) {
      log.error('Failed to initialize git repository:', error);
      throw error;
    }
  }

  async syncDocuments(): Promise<GitSyncResult> {
    const result: GitSyncResult = {
      success: false,
      changes: {
        added: [],
        modified: [],
        deleted: []
      }
    };

    try {
      // Ensure repo is initialized
      await this.initializeRepo();

      // Get all documents from database
      const db = getDB();
      const documents = db.prepare('SELECT id, filename, content, updated_at FROM files').all() as Array<{
        id: string;
        filename: string;
        content: string | null;
        updated_at: number;
      }>;

      const documentsDir = path.join(this.gitRepoPath, 'documents');
      
      // Get all existing files in git repo
      const existingFiles = new Set<string>();
      try {
        const files = await fs.readdir(documentsDir);
        files.forEach(file => existingFiles.add(file));
      } catch (error) {
        // Directory might not exist yet
        await fs.mkdir(documentsDir, { recursive: true });
      }

      // Track which files we've processed
      const processedFiles = new Set<string>();

      // Process each document
      for (const doc of documents) {
        const sanitizedFilename = this.sanitizeFilename(doc.filename);
        const gitFilename = `${doc.id}-${sanitizedFilename}`;
        const filePath = path.join(documentsDir, gitFilename);
        
        processedFiles.add(gitFilename);

        try {
          // Check if file exists and compare timestamps
          const fileExists = existingFiles.has(gitFilename);
          
          if (!fileExists) {
            // New file
            await fs.writeFile(filePath, doc.content || '');
            await this.git.add(path.join('documents', gitFilename));
            result.changes.added.push(gitFilename);
            log.info('Added new file to git:', gitFilename);
          } else {
            // Check if content has changed
            const existingContent = await fs.readFile(filePath, 'utf-8');
            if (existingContent !== (doc.content || '')) {
              // Modified file
              await fs.writeFile(filePath, doc.content || '');
              await this.git.add(path.join('documents', gitFilename));
              result.changes.modified.push(gitFilename);
              log.info('Updated file in git:', gitFilename);
            }
          }
        } catch (error) {
          log.error(`Failed to process document ${doc.id}:`, error);
        }
      }

      // Find deleted files (exist in git but not in database)
      for (const existingFile of existingFiles) {
        if (!processedFiles.has(existingFile)) {
          // File was deleted from database
          const filePath = path.join(documentsDir, existingFile);
          await fs.unlink(filePath);
          await this.git.rm(path.join('documents', existingFile));
          result.changes.deleted.push(existingFile);
          log.info('Deleted file from git:', existingFile);
        }
      }

      // Check if there are any changes to commit
      const status = await this.git.status();
      if (!status.isClean()) {
        // Commit all changes
        const timestamp = new Date().toISOString();
        const commitMessage = `Sync documents from database - ${timestamp}`;
        const commit = await this.git.commit(commitMessage);
        result.commitHash = commit.commit;
        result.success = true;
        
        log.info('Git sync completed successfully:', {
          commitHash: result.commitHash,
          added: result.changes.added.length,
          modified: result.changes.modified.length,
          deleted: result.changes.deleted.length
        });
      } else {
        result.success = true;
        log.info('No changes to commit');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Git sync failed:', error);
      result.error = errorMessage;
      return result;
    }
  }

  private sanitizeFilename(filename: string): string {
    // Remove or replace characters that might cause issues in filenames
    return filename
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/\.+/g, '.') // Collapse multiple dots
      .replace(/^\./, '') // Remove leading dot
      .replace(/\.$/, '') // Remove trailing dot
      .slice(0, 200); // Limit length
  }
}

// Singleton instance
let gitSyncService: GitSyncService | null = null;

export function getGitSyncService(): GitSyncService {
  if (!gitSyncService) {
    gitSyncService = new GitSyncService();
  }
  return gitSyncService;
}