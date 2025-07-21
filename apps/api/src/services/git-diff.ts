import { diff_match_patch } from 'diff-match-patch';
import { DocHandle } from '@automerge/automerge-repo';
import { log } from '../utils/logger.js';

export interface DiffOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string; // for insert
  length?: number; // for delete/retain
}

export interface ChangePreview {
  fileId: string;
  filename: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  operations: DiffOperation[];
}

export interface FileDiff {
  fileId: string;
  filename: string;
  gitContent: string;
  currentContent: string;
  status: 'added' | 'modified' | 'deleted';
}

export class GitDiffService {
  private static dmp = new diff_match_patch();

  /**
   * Calculate diff between git content and current content
   */
  static calculateDiff(gitContent: string, currentContent: string): DiffOperation[] {
    const operations: DiffOperation[] = [];
    
    // Get the diffs
    const diffs = this.dmp.diff_main(currentContent, gitContent);
    this.dmp.diff_cleanupSemantic(diffs);
    
    let position = 0;
    
    for (const [operation, text] of diffs) {
      switch (operation) {
        case 0: // EQUAL
          operations.push({
            type: 'retain',
            position,
            length: text.length
          });
          position += text.length;
          break;
          
        case -1: // DELETE
          operations.push({
            type: 'delete',
            position,
            length: text.length
          });
          // Don't advance position for deletes
          break;
          
        case 1: // INSERT
          operations.push({
            type: 'insert',
            position,
            text
          });
          position += text.length;
          break;
      }
    }
    
    return operations;
  }

  /**
   * Apply diff operations to an Automerge document
   */
  static async applyDiffToDocument(
    handle: DocHandle<any>,
    operations: DiffOperation[]
  ): Promise<void> {
    // Sort operations by position in reverse order to maintain positions
    const sortedOps = [...operations].sort((a, b) => b.position - a.position);
    
    await handle.change((doc) => {
      for (const op of sortedOps) {
        try {
          switch (op.type) {
            case 'insert':
              if (op.text) {
                // Insert text at position
                const before = doc.content.slice(0, op.position);
                const after = doc.content.slice(op.position);
                doc.content = before + op.text + after;
                log.info(`Inserted ${op.text.length} characters at position ${op.position}`);
              }
              break;
              
            case 'delete':
              if (op.length) {
                // Delete characters
                const before = doc.content.slice(0, op.position);
                const after = doc.content.slice(op.position + op.length);
                doc.content = before + after;
                log.info(`Deleted ${op.length} characters at position ${op.position}`);
              }
              break;
              
            case 'retain':
              // No action needed for retain
              break;
          }
        } catch (error) {
          log.error(`Failed to apply operation ${op.type} at position ${op.position}:`, error);
          throw error;
        }
      }
    });
  }

  /**
   * Preview changes without applying them
   */
  static previewChanges(fileDiff: FileDiff): ChangePreview {
    const operations = this.calculateDiff(fileDiff.gitContent, fileDiff.currentContent);
    
    let additions = 0;
    let deletions = 0;
    
    for (const op of operations) {
      if (op.type === 'insert' && op.text) {
        additions += op.text.length;
      } else if (op.type === 'delete' && op.length) {
        deletions += op.length;
      }
    }
    
    return {
      fileId: fileDiff.fileId,
      filename: fileDiff.filename,
      status: fileDiff.status,
      additions,
      deletions,
      operations
    };
  }

  /**
   * Apply a more sophisticated diff that preserves structure better
   */
  static async applySmartDiff(
    handle: DocHandle<any>,
    gitContent: string,
    currentContent: string
  ): Promise<void> {
    // Calculate line-based diff first for better structure preservation
    const lineDiffs = this.dmp.diff_linesToChars_(currentContent, gitContent);
    const diffs = this.dmp.diff_main(lineDiffs.chars1, lineDiffs.chars2, false);
    this.dmp.diff_charsToLines_(diffs, lineDiffs.lineArray);
    
    // Convert line diffs to character operations
    const operations: DiffOperation[] = [];
    let position = 0;
    
    for (const [operation, text] of diffs) {
      switch (operation) {
        case 0: // EQUAL
          position += text.length;
          break;
          
        case -1: // DELETE
          operations.push({
            type: 'delete',
            position,
            length: text.length
          });
          break;
          
        case 1: // INSERT
          operations.push({
            type: 'insert',
            position,
            text
          });
          position += text.length;
          break;
      }
    }
    
    // Apply the operations
    await this.applyDiffToDocument(handle, operations);
  }
}