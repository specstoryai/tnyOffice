import { simpleGit, SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { log } from '../utils/logger.js';
import { getDB } from '../db/database.js';
import { DocumentService } from '../automerge/document-service.js';

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
  pushedToRemote?: boolean;
  remoteUrl?: string;
  error?: string;
}

export interface GitSyncOptions {
  remoteUrl?: string;
  commitMessage?: string;
}

export class GitSyncService {
  private gitRepoPath: string;
  private git: SimpleGit;

  constructor() {
    this.gitRepoPath = process.env.NODE_ENV === 'production' 
      ? '/data/git-repo'
      : path.join(__dirname, '../../git-repo');
    
    log.info('Git repo path:', this.gitRepoPath);
    this.git = simpleGit();
  }

  async initializeRepo(overrideRemoteUrl?: string): Promise<void> {
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
      
      // Configure remote if provided
      await this.configureRemote(overrideRemoteUrl);
    } catch (error) {
      log.error('Failed to initialize git repository:', error);
      throw error;
    }
  }

  private async configureRemote(overrideRemoteUrl?: string): Promise<void> {
    const remoteUrl = overrideRemoteUrl || process.env.GIT_REMOTE_URL;
    if (!remoteUrl) {
      log.info('No remote URL configured, skipping remote setup');
      return;
    }

    try {
      log.info('Configuring git remote with URL:', remoteUrl.replace(/:[^@]+@/, ':***@'));
      
      // Check if origin remote exists
      const remotes = await this.git.getRemotes(true);
      log.info('Current remotes:', remotes.map(r => ({ name: r.name, url: r.refs?.push || r.refs?.fetch })));
      
      const originRemote = remotes.find(remote => remote.name === 'origin');

      if (!originRemote) {
        // Add origin remote
        await this.git.addRemote('origin', remoteUrl);
        log.info('Added git remote origin:', remoteUrl.replace(/:[^@]+@/, ':***@'));
      } else {
        // Update origin URL if it changed
        const currentUrl = originRemote.refs?.push || originRemote.refs?.fetch;
        if (currentUrl !== remoteUrl) {
          await this.git.remote(['set-url', 'origin', remoteUrl]);
          log.info('Updated git remote origin:', remoteUrl.replace(/:[^@]+@/, ':***@'));
        } else {
          log.info('Remote origin already configured correctly');
        }
      }
    } catch (error) {
      log.error('Failed to configure git remote:', error);
      // Don't throw - remote is optional
    }
  }

  async syncDocuments(options: GitSyncOptions = {}): Promise<GitSyncResult> {
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
      await this.initializeRepo(options.remoteUrl);

      // Get all documents from database
      const db = getDB();
      const documents = db.prepare('SELECT id, filename, content, automerge_id, updated_at FROM files').all() as Array<{
        id: string;
        filename: string;
        content: string | null;
        automerge_id: string | null;
        updated_at: number;
      }>;

      const documentsDir = path.join(this.gitRepoPath, 'documents');
      
      // Get all existing files in git repo
      const existingFiles = new Set<string>();
      try {
        const files = await fs.readdir(documentsDir);
        files.forEach(file => existingFiles.add(file));
      } catch {
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
          // Get current content - from Automerge if available, otherwise from SQLite
          let currentContent = doc.content || '';
          if (doc.automerge_id) {
            try {
              const handle = await DocumentService.getOrCreateDocument(doc.id);
              currentContent = await DocumentService.getDocumentContent(handle);
            } catch (err) {
              log.warn(`Failed to get Automerge content for file ${doc.id}, using database content:`, err);
            }
          }

          // Check if file exists and compare content
          const fileExists = existingFiles.has(gitFilename);
          
          if (!fileExists) {
            // New file
            await fs.writeFile(filePath, currentContent);
            await this.git.add(path.join('documents', gitFilename));
            result.changes.added.push(gitFilename);
            log.info('Added new file to git:', gitFilename);
          } else {
            // Check if content has changed
            const existingContent = await fs.readFile(filePath, 'utf-8');
            if (existingContent !== currentContent) {
              // Modified file
              await fs.writeFile(filePath, currentContent);
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
      log.info('Git status after file operations:', {
        isClean: status.isClean(),
        created: status.created,
        modified: status.modified,
        deleted: status.deleted,
        staged: status.staged
      });
      
      if (!status.isClean()) {
        // Commit all changes
        const timestamp = new Date().toISOString();
        const defaultMessage = `Sync documents from database - ${timestamp}`;
        const commitMessage = options.commitMessage || defaultMessage;
        log.info('Creating commit with message:', commitMessage);
        
        const commit = await this.git.commit(commitMessage);
        result.commitHash = commit.commit;
        result.success = true;
        
        log.info('Git sync completed successfully:', {
          commitHash: result.commitHash,
          added: result.changes.added.length,
          modified: result.changes.modified.length,
          deleted: result.changes.deleted.length
        });
        
        // Push to remote if configured
        const pushResult = await this.pushToRemote(options.remoteUrl);
        if (pushResult) {
          result.pushedToRemote = pushResult.pushed;
          result.remoteUrl = pushResult.remoteUrl;
        }
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

  private async pushToRemote(overrideRemoteUrl?: string): Promise<{ pushed: boolean; remoteUrl: string } | null> {
    const remoteUrl = overrideRemoteUrl || process.env.GIT_REMOTE_URL;
    if (!remoteUrl) {
      log.info('No remote URL configured, skipping push');
      return null;
    }

    try {
      log.info('Starting push to remote repository...');
      log.info('Remote URL:', remoteUrl.replace(/:[^@]+@/, ':***@'));
      
      // Check current branch and remotes
      const branches = await this.git.branch();
      const currentBranch = branches.current;
      log.info('Current branch:', currentBranch);
      
      const remotes = await this.git.getRemotes(true);
      log.info('Available remotes:', remotes.map(r => r.name));
      
      // Check git status before push
      const status = await this.git.status();
      log.info('Git status before push:', {
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind
      });
      
      // First push might need to set upstream
      try {
        log.info(`Attempting to push to origin/${currentBranch}...`);
        const pushResult = await this.git.push('origin', currentBranch);
        log.info('Push result:', pushResult);
        log.info('Successfully pushed to remote repository');
        return { pushed: true, remoteUrl: remoteUrl.replace(/:[^@]+@/, ':***@') };
      } catch (pushError) {
        const errorMessage = pushError instanceof Error ? pushError.message : String(pushError);
        const errorStack = pushError instanceof Error ? pushError.stack : undefined;
        
        log.error('Push error details:', {
          message: errorMessage,
          stack: errorStack
        });
        
        // If push fails, might need to set upstream
        if (errorMessage.includes('has no upstream branch') || 
            errorMessage.includes('no upstream configured')) {
          log.info('No upstream branch configured, setting upstream and pushing...');
          const pushWithUpstream = await this.git.push('origin', currentBranch, ['--set-upstream']);
          log.info('Push with upstream result:', pushWithUpstream);
          log.info('Successfully pushed to remote repository with upstream set');
          return { pushed: true, remoteUrl: remoteUrl.replace(/:[^@]+@/, ':***@') };
        } else {
          throw pushError;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      log.error('Failed to push to remote:', {
        message: errorMessage,
        stack: errorStack
      });
      // Don't throw - push failure shouldn't fail the sync
      return { pushed: false, remoteUrl: remoteUrl.replace(/:[^@]+@/, ':***@') };
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