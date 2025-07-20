import express from 'express';
import cors from 'cors';
import { log } from './utils/logger.js';
import { initDB } from './db/database.js';
import filesRouter from './routes/files.js';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/files', filesRouter);

// Home page with API documentation
app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>API2 - SQLite-based API</title>
        <style>
          body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 2rem; }
          h1 { color: #333; }
          .endpoint { background: #f5f5f5; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
          code { background: #e0e0e0; padding: 0.2rem 0.4rem; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>API2 - SQLite-based API Service</h1>
        <p>A TypeScript Node.js API using Express and SQLite for file storage.</p>
        
        <h2>Available Endpoints</h2>
        
        <div class="endpoint">
          <h3>POST /api/v1/files</h3>
          <p>Create a new markdown file</p>
          <p>Body: <code>{ "filename": "example.md", "content": "# Hello" }</code></p>
        </div>
        
        <div class="endpoint">
          <h3>GET /api/v1/files</h3>
          <p>List all files with pagination</p>
          <p>Query params: <code>?limit=20&offset=0</code></p>
        </div>
        
        <div class="endpoint">
          <h3>GET /api/v1/files/:id</h3>
          <p>Get a specific file by ID</p>
        </div>
      </body>
    </html>
  `);
});

// Initialize database and start server
async function start(): Promise<void> {
  try {
    await initDB();
    app.listen(PORT, () => {
      log.info(`API2 server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();