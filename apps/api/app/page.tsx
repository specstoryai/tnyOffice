'use client';

import { useState } from 'react';

export default function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState<'create' | 'get' | 'list'>('create');
  const [testResults, setTestResults] = useState<{
    status?: number;
    statusText?: string;
    data?: unknown;
    elapsed?: number;
    headers?: Record<string, string>;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Test states
  const [createForm, setCreateForm] = useState({ filename: 'test.md', content: '# Test Document\n\nThis is a test.' });
  const [getForm, setGetForm] = useState({ id: '' });
  const [listForm, setListForm] = useState({ limit: '20', offset: '0' });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

  const runTest = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      let response: Response;
      const startTime = Date.now();

      switch (activeTab) {
        case 'create':
          response = await fetch(`${baseUrl}/api/v1/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createForm)
          });
          break;
        case 'get':
          response = await fetch(`${baseUrl}/api/v1/files/${getForm.id}`);
          break;
        case 'list':
          response = await fetch(`${baseUrl}/api/v1/files?limit=${listForm.limit}&offset=${listForm.offset}`);
          break;
      }

      const elapsed = Date.now() - startTime;
      const data = await response.json();

      setTestResults({
        status: response.status,
        statusText: response.statusText,
        data,
        elapsed,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          TnyOffice API Documentation
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Markdown File API v1
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Simple create/read API for markdown files with clean, versioned routes.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-sm">
            Base URL: <span className="text-blue-600 dark:text-blue-400">{baseUrl}/api/v1</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'create', label: 'Create File', method: 'POST' },
                { id: 'get', label: 'Get File', method: 'GET' },
                { id: 'list', label: 'List Files', method: 'GET' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'create' | 'get' | 'list')}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className={`inline-block px-2 py-1 text-xs rounded mr-2 ${
                    tab.method === 'POST' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {tab.method}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'create' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Create Markdown File</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">POST /api/v1/files</code>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filename
                    </label>
                    <input
                      type="text"
                      value={createForm.filename}
                      onChange={(e) => setCreateForm({ ...createForm, filename: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="example.md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content
                    </label>
                    <textarea
                      value={createForm.content}
                      onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows={6}
                      placeholder="# Markdown content"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'get' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Get Markdown File</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">GET /api/v1/files/:id</code>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File ID
                  </label>
                  <input
                    type="text"
                    value={getForm.id}
                    onChange={(e) => setGetForm({ ...getForm, id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                  />
                </div>
              </div>
            )}

            {activeTab === 'list' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">List Files</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">GET /api/v1/files</code>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Limit
                    </label>
                    <input
                      type="number"
                      value={listForm.limit}
                      onChange={(e) => setListForm({ ...listForm, limit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Offset
                    </label>
                    <input
                      type="number"
                      value={listForm.offset}
                      onChange={(e) => setListForm({ ...listForm, offset: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={runTest}
              disabled={loading}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : 'Run Test'}
            </button>

            {testResults && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Response</h4>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>{' '}
                    <span className={`font-bold ${
                      testResults.status >= 200 && testResults.status < 300
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {testResults.status} {testResults.statusText}
                    </span>
                    {testResults.elapsed && (
                      <span className="ml-4 text-gray-600 dark:text-gray-400">
                        ({testResults.elapsed}ms)
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded mt-2">
                    {(() => {
                      const data = testResults.data || testResults.error;
                      const jsonString = JSON.stringify(data, null, 2);
                      const isLargeContent = jsonString.length > 5000;
                      
                      if (isLargeContent && data?.content) {
                        // For large files with content, show a summary
                        const contentPreview = data.content.substring(0, 500);
                        const displayData = {
                          ...data,
                          content: contentPreview + `\n\n... (truncated - ${data.content.length} total characters) ...`
                        };
                        
                        return (
                          <div>
                            <div className="text-yellow-400 text-sm mb-2">
                              ⚠️ Large response truncated for display. Full content was returned by the API.
                            </div>
                            <pre className="overflow-x-auto text-sm whitespace-pre-wrap">
                              {JSON.stringify(displayData, null, 2)}
                            </pre>
                          </div>
                        );
                      }
                      
                      return (
                        <pre className="overflow-x-auto text-sm whitespace-pre-wrap">
                          {jsonString}
                        </pre>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">API Reference</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Error Responses</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                <li><strong>400</strong> - Invalid request body or parameters</li>
                <li><strong>404</strong> - File not found</li>
                <li><strong>500</strong> - Internal server error</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Validation Rules</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                <li>Filename: alphanumeric with dashes/underscores, .md extension</li>
                <li>Content: valid UTF-8 text, max 5MB</li>
                <li>List limit: 1-100 (default: 20)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}