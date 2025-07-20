'use client';

import { useEffect, useState, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { automergeSyncPlugin } from '@automerge/automerge-codemirror';
import { useRepo } from '@automerge/automerge-repo-react-hooks';
import type { MarkdownDocument } from '@/lib/automerge/types';
import type { AutomergeUrl, DocHandle } from '@automerge/automerge-repo';

interface CollaborativeEditorProps {
  documentUrl: string;
  readOnly?: boolean;
  placeholder?: string;
  onConnectionChange?: (connected: boolean) => void;
  onContentChange?: (content: string) => void;
}

export function CollaborativeEditor({ 
  documentUrl, 
  readOnly = false, 
  placeholder,
  onConnectionChange,
  onContentChange
}: CollaborativeEditorProps) {
  const repo = useRepo();
  const [handle, setHandle] = useState<DocHandle<MarkdownDocument> | null>(null);
  const [initialContent, setInitialContent] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // Get handle from repo
  useEffect(() => {
    if (!repo || !documentUrl) return;

    const loadDocument = async () => {
      try {
        console.log('Finding document with URL:', documentUrl);
        // repo.find() returns a Promise<DocHandle>
        const docHandle = await repo.find<MarkdownDocument>(documentUrl as AutomergeUrl);
        console.log('Got handle:', docHandle);
        
        setHandle(docHandle);

        // Wait for the handle to be ready
        const waitForReady = () => {
          try {
            // Check if handle has the isReady method and if it's ready
            if (docHandle.isReady && !docHandle.isReady()) {
              console.log('Handle not ready yet, waiting...');
              setTimeout(waitForReady, 100);
              return;
            }

            // Now we can safely call doc()
            const currentDoc = docHandle.doc();
            console.log('Got document:', currentDoc);
            
            if (currentDoc) {
              // Initialize content if needed
              if (currentDoc.content === undefined) {
                docHandle.change((d) => {
                  d.content = '';
                });
              }
              
              // Get the document again after potential change
              const doc = docHandle.doc();
              setInitialContent(doc?.content || '');
              setIsReady(true);
              onConnectionChange?.(true);
            }
          } catch (err) {
            console.error('Error loading document:', err);
            onConnectionChange?.(false);
          }
        };

        waitForReady();
      } catch (err) {
        console.error('Error finding document:', err);
        onConnectionChange?.(false);
      }
    };

    loadDocument();

  }, [repo, documentUrl]);

  // Listen for changes on the handle
  useEffect(() => {
    if (!handle || !isReady) return;

    const handleChange = () => {
      try {
        const currentDoc = handle.doc();
        if (currentDoc) {
          onContentChange?.(currentDoc.content || '');
        }
      } catch (err) {
        console.error('Error handling change:', err);
      }
    };

    handle.on('change', handleChange);

    return () => {
      handle.off('change', handleChange);
    };
  }, [handle, isReady, onContentChange]);

  if (!handle || !isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Connecting to document...</div>
      </div>
    );
  }

  const syncPlugin = automergeSyncPlugin({
    handle,
    path: ['content'],
  });

  const extensions = [
    markdown(),
    syncPlugin,
    EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '100%',
      },
      '.cm-focused .cm-cursor': {
        borderLeftColor: '#3b82f6',
      },
      '.cm-line': {
        padding: '0 2px 0 4px',
      },
    }),
    EditorView.lineWrapping,
  ];

  if (readOnly) {
    extensions.push(EditorView.editable.of(false));
  }

  // Provide initial value to CodeMirror
  return (
    <CodeMirror
      value={initialContent}
      extensions={extensions}
      placeholder={placeholder}
      theme={undefined} // Uses system theme
      editable={!readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        dropCursor: !readOnly,
        allowMultipleSelections: !readOnly,
        indentOnInput: !readOnly,
        bracketMatching: true,
        closeBrackets: !readOnly,
        autocompletion: !readOnly,
        rectangularSelection: !readOnly,
        highlightSelectionMatches: true,
        searchKeymap: true,
      }}
      style={{ height: '100%' }}
    />
  );
}