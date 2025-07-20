import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './utils/logger.js';
import { initDB } from './db/database.js';
import { initAutomergeRepo } from './automerge/repo.js';
import { initWebSocketServer } from './websocket/server.js';
import filesRouter from './routes/files.js';
import gitRouter from './routes/git.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// Debug environment variables
if (process.env.GIT_REMOTE_URL) {
  log.info('Environment loaded - GIT_REMOTE_URL is set');
} else {
  log.warn('Environment loaded - GIT_REMOTE_URL is NOT set');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/v1/files', filesRouter);
app.use('/api/v1/git', gitRouter);

// Initialize database and start server
async function start(): Promise<void> {
  try {
    await initDB();
    initAutomergeRepo();
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Initialize WebSocket server
    initWebSocketServer(httpServer);
    
    // Start the server
    httpServer.listen(PORT, () => {
      log.info(`API server running on http://localhost:${PORT}`);
      log.info(`WebSocket server ready on ws://localhost:${PORT}`);
    });
  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();